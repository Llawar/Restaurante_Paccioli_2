import { Request, Response } from 'express'
import pool from '../../Providers/DatabaseProvider'
import { registrarAuditoria } from '../../Services/AuditoriaService'
import { registrarAjusteFisico } from '../../Services/KardexService'

export const getAll = async (_req: Request, res: Response): Promise<void> => {
  try {
    const query = `
      SELECT f.*, NULL as usuario_nombre
      FROM gastro_inventario_fisico f
      WHERE f.activo = 1
      ORDER BY f.fecha DESC
    `
    const [rows] = await pool.execute(query)

    res.json({
      success: true,
      count: (rows as any[]).length,
      data: rows
    })
  } catch (error: any) {
    console.error('Error al obtener inventarios físicos (GastroStock):', error)
    res.status(500).json({
      success: false,
      message: 'Error al obtener inventarios físicos',
      error: error.message
    })
  }
}

export const getById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params

    const [headerRows] = await pool.execute(
      `SELECT f.*, NULL as usuario_nombre
       FROM gastro_inventario_fisico f
       WHERE f.id = ?`,
      [id]
    )

    if ((headerRows as any[]).length === 0) {
      res.status(404).json({
        success: false,
        message: 'Inventario físico no encontrado'
      })
      return
    }

    const [detalleRows] = await pool.execute(
      `SELECT d.*, p.nombre as producto_nombre, p.codigo as producto_codigo, um.abreviatura as unidad
       FROM gastro_inventario_fisico_detalle d
       LEFT JOIN gastro_productos p ON d.producto_id = p.id
       LEFT JOIN gastro_unidades_medida um ON p.unidad_id = um.id
       WHERE d.inventario_id = ?`,
      [id]
    )

    res.json({
      success: true,
      data: { ...(headerRows as any[])[0], detalles: detalleRows }
    })
  } catch (error: any) {
    console.error('Error al obtener inventario físico (GastroStock):', error)
    res.status(500).json({
      success: false,
      message: 'Error al obtener inventario físico',
      error: error.message
    })
  }
}

export const iniciar = async (req: Request, res: Response): Promise<void> => {
  try {
    const [result] = await pool.execute(
      `INSERT INTO gastro_inventario_fisico (usuario_id, estado, activo, created_at, updated_at)
       VALUES (?, 'EN_PROGRESO', 1, NOW(), NOW())`,
      [req.user?.id ?? null]
    )

    await registrarAuditoria(req.user?.id, 'INICIAR_INVENTARIO_FISICO', 'gastro_inventario_fisico', (result as any).insertId)

    res.status(201).json({
      success: true,
      message: 'Inventario físico iniciado',
      data: { id: (result as any).insertId, estado: 'EN_PROGRESO' }
    })
  } catch (error: any) {
    console.error('Error al iniciar inventario físico (GastroStock):', error)
    res.status(500).json({
      success: false,
      message: 'Error al iniciar inventario físico',
      error: error.message
    })
  }
}

export const registrarConteo = async (req: Request, res: Response): Promise<void> => {
  try {
    const { inventario_id, items } = req.body

    if (!inventario_id || !Array.isArray(items) || items.length === 0) {
      res.status(400).json({
        success: false,
        message: 'inventario_id y items son requeridos'
      })
      return
    }

    const conn = await pool.getConnection()
    try {
      await conn.beginTransaction()

      for (const item of items) {
        const { producto_id, stock_real, motivo } = item

        const [prodRows] = await conn.execute(
          'SELECT stock_actual FROM gastro_productos WHERE id = ?',
          [producto_id]
        )

        if ((prodRows as any[]).length === 0) {
          throw new Error(`Producto #${producto_id} no encontrado`)
        }

        const stockSistema = Number((prodRows as any[])[0].stock_actual) || 0
        const stockReal = Number(stock_real) || 0
        const diferencia = stockReal - stockSistema

        await conn.execute(
          `INSERT INTO gastro_inventario_fisico_detalle (inventario_id, producto_id, stock_sistema, stock_real, diferencia, motivo)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [inventario_id, producto_id, stockSistema, stockReal, diferencia, (motivo || 'OTRO') as any]
        )

        if (diferencia !== 0) {
          await registrarAjusteFisico(
            producto_id,
            diferencia,
            stockReal,
            req.user?.id ?? null,
            `Inventario físico #${inventario_id}`,
            conn
          )
        }
      }

      await conn.commit()

      await registrarAuditoria(req.user?.id, 'REGISTRAR_CONTEO', 'gastro_inventario_fisico', Number(inventario_id), `Items: ${items.length}`)

      res.status(201).json({
        success: true,
        message: 'Conteo registrado exitosamente'
      })
    } catch (error) {
      await conn.rollback()
      throw error
    } finally {
      conn.release()
    }
  } catch (error: any) {
    console.error('Error al registrar conteo (GastroStock):', error)
    res.status(500).json({
      success: false,
      message: error.message || 'Error al registrar el conteo',
      error: error.message
    })
  }
}

export const completar = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params

    const checkQuery = "SELECT id FROM gastro_inventario_fisico WHERE id = ? AND activo = 1 AND estado = 'EN_PROGRESO'"
    const [existing] = await pool.execute(checkQuery, [id])

    if ((existing as any[]).length === 0) {
      res.status(404).json({
        success: false,
        message: 'Inventario físico no encontrado o ya completado'
      })
      return
    }

    await pool.execute(
      `UPDATE gastro_inventario_fisico SET estado = 'COMPLETADO', updated_at = NOW() WHERE id = ?`,
      [id]
    )

    await registrarAuditoria(req.user?.id, 'COMPLETAR_INVENTARIO_FISICO', 'gastro_inventario_fisico', Number(id))

    res.json({
      success: true,
      message: 'Inventario físico completado exitosamente'
    })
  } catch (error: any) {
    console.error('Error al completar inventario físico (GastroStock):', error)
    res.status(500).json({
      success: false,
      message: 'Error al completar inventario físico',
      error: error.message
    })
  }
}
