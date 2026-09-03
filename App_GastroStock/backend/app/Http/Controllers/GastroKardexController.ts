import { Request, Response } from 'express'
import pool from '../../Providers/DatabaseProvider'
import { registrarAuditoria } from '../../Services/AuditoriaService'
import { registrarSalidaPEPS } from '../../Services/KardexService'
import { generarAlertasStock } from '../../Services/AlertaService'

export const getByProducto = async (req: Request, res: Response): Promise<void> => {
  try {
    const { productoId } = req.params
    const { fecha_desde, fecha_hasta, lote_id, concepto, conceptos } = req.query

    const conditions: string[] = ['k.producto_id = ?']
    const params: any[] = [productoId]

    if (fecha_desde) {
      conditions.push('k.fecha >= ?')
      params.push(fecha_desde)
    }
    if (fecha_hasta) {
      conditions.push('k.fecha <= ?')
      params.push(`${fecha_hasta} 23:59:59`)
    }
    if (lote_id) {
      conditions.push('k.lote_id = ?')
      params.push(lote_id)
    }
    if (concepto) {
      conditions.push('k.concepto = ?')
      params.push(concepto)
    }
    if (conceptos) {
      const lista = String(conceptos).split(',').map((c) => c.trim()).filter(Boolean)
      if (lista.length > 0) {
        conditions.push(`k.concepto IN (${lista.map(() => '?').join(',')})`)
        params.push(...lista)
      }
    }

    const where = conditions.join(' AND ')

    const query = `
      SELECT k.*, 
        CASE WHEN k.lote_id IS NOT NULL THEN l.numero_lote END as numero_lote,
        CASE WHEN k.lote_id IS NOT NULL THEN l.costo_unitario END as lote_costo,
        NULL as usuario_nombre
      FROM gastro_movimientos_kardex k
      LEFT JOIN gastro_lotes l ON k.lote_id = l.id
      WHERE ${where}
      ORDER BY k.fecha ASC, k.id ASC
    `
    const [rows] = await pool.execute(query, params)

    const [prodRows] = await pool.execute(
      `SELECT p.*, um.nombre as unidad, um.abreviatura as unidad_abreviatura
       FROM gastro_productos p
       LEFT JOIN gastro_unidades_medida um ON p.unidad_id = um.id
       WHERE p.id = ?`,
      [productoId]
    )

    res.json({
      success: true,
      count: (rows as any[]).length,
      producto: (prodRows as any[])[0] || null,
      data: rows
    })
  } catch (error: any) {
    console.error('Error al obtener kardex (GastroStock):', error)
    res.status(500).json({
      success: false,
      message: 'Error al obtener kardex',
      error: error.message
    })
  }
}

export const registrarSalida = async (req: Request, res: Response): Promise<void> => {
  try {
    const { producto_id, cantidad, concepto, referencia } = req.body

    if (!producto_id || !cantidad) {
      res.status(400).json({
        success: false,
        message: 'producto_id y cantidad son requeridos'
      })
      return
    }

    const validos = ['CONSUMO', 'MERMA', 'VENCIDO', 'AJUSTE_NEGATIVO']
    if (concepto && !validos.includes(concepto)) {
      res.status(400).json({
        success: false,
        message: 'Concepto inválido'
      })
      return
    }

    await registrarSalidaPEPS(
      producto_id,
      Number(cantidad),
      (concepto || 'CONSUMO') as any,
      req.user?.id ?? null,
      referencia || null
    )

    await generarAlertasStock(producto_id)

    await registrarAuditoria(req.user?.id, 'REGISTRAR_SALIDA', 'gastro_productos', Number(producto_id), `${cantidad} ${concepto}${referencia ? ` - ${referencia}` : ''}`)

    res.status(201).json({
      success: true,
      message: 'Salida registrada exitosamente'
    })
  } catch (error: any) {
    console.error('Error al registrar salida (GastroStock):', error)
    res.status(500).json({
      success: false,
      message: error.message || 'Error al registrar la salida',
      error: error.message
    })
  }
}
