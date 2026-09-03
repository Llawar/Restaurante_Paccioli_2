import { Request, Response } from 'express'
import pool from '../../Providers/DatabaseProvider'
import { registrarAuditoria } from '../../Services/AuditoriaService'
import { generarNumeroLote } from '../../Services/KardexService'

interface DetalleCompraInput {
  producto_id: number
  cantidad: number
  costo_unitario: number
  vencimiento?: string
}

export const getAll = async (_req: Request, res: Response): Promise<void> => {
  try {
    const query = `
      SELECT c.*, p.nombre as proveedor_nombre, p.nit as proveedor_nit,
        NULL as usuario_nombre
      FROM gastro_compras c
      LEFT JOIN gastro_proveedores p ON c.proveedor_id = p.id
      WHERE c.activo = 1
      ORDER BY c.fecha DESC
    `
    const [rows] = await pool.execute(query)

    res.json({
      success: true,
      count: (rows as any[]).length,
      data: rows
    })
  } catch (error: any) {
    console.error('Error al obtener compras (GastroStock):', error)
    res.status(500).json({
      success: false,
      message: 'Error al obtener compras',
      error: error.message
    })
  }
}

export const getById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params

    const [compraRows] = await pool.execute(
      `SELECT c.*, p.nombre as proveedor_nombre, NULL as usuario_nombre
       FROM gastro_compras c
       LEFT JOIN gastro_proveedores p ON c.proveedor_id = p.id
       WHERE c.id = ?`,
      [id]
    )

    if ((compraRows as any[]).length === 0) {
      res.status(404).json({
        success: false,
        message: 'Compra no encontrada'
      })
      return
    }

    const [detalleRows] = await pool.execute(
      `SELECT d.*, p.nombre as producto_nombre, p.codigo as producto_codigo, l.numero_lote
       FROM gastro_detalle_compras d
       LEFT JOIN gastro_productos p ON d.producto_id = p.id
       LEFT JOIN gastro_lotes l ON l.detalle_compra_id = d.id
       WHERE d.compra_id = ?`,
      [id]
    )

    res.json({
      success: true,
      data: {
        ...(compraRows as any[])[0],
        detalles: detalleRows
      }
    })
  } catch (error: any) {
    console.error('Error al obtener compra (GastroStock):', error)
    res.status(500).json({
      success: false,
      message: 'Error al obtener compra',
      error: error.message
    })
  }
}

export const create = async (req: Request, res: Response): Promise<void> => {
  const { proveedor_id, detalles, fecha } = req.body

  if (!proveedor_id) {
    res.status(400).json({
      success: false,
      message: 'El proveedor es requerido'
    })
    return
  }

  if (!Array.isArray(detalles) || detalles.length === 0) {
    res.status(400).json({
      success: false,
      message: 'Debe incluir al menos un detalle de compra'
    })
    return
  }

  const conn = await pool.getConnection()

  try {
    await conn.beginTransaction()

    let total = 0
    for (const det of detalles) {
      total += Number(det.cantidad) * Number(det.costo_unitario)
    }

    const [compraResult] = await conn.execute(
      `INSERT INTO gastro_compras (proveedor_id, usuario_id, fecha, total, estado, activo, created_at, updated_at)
       VALUES (?, ?, COALESCE(?, NOW()), ?, 'REGISTRADA', 1, NOW(), NOW())`,
      [proveedor_id, req.user?.id ?? null, fecha || null, total]
    )

    const compraId = (compraResult as any).insertId

    for (const det of (detalles as DetalleCompraInput[])) {
      const cantidad = Number(det.cantidad)
      const costo = Number(det.costo_unitario)
      const subtotal = cantidad * costo

      const [detalleResult] = await conn.execute(
        `INSERT INTO gastro_detalle_compras (compra_id, producto_id, cantidad, costo_unitario, vencimiento, subtotal)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [compraId, det.producto_id, cantidad, costo, det.vencimiento || null, subtotal]
      )

      const detalleId = (detalleResult as any).insertId
      const numeroLote = await generarNumeroLote()

      await conn.execute(
        `INSERT INTO gastro_lotes (producto_id, detalle_compra_id, numero_lote, cantidad_ingreso, cantidad_disponible, costo_unitario, fecha_ingreso, vencimiento, activo, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, NOW(), ?, 1, NOW(), NOW())`,
        [det.producto_id, detalleId, numeroLote, cantidad, cantidad, costo, det.vencimiento || null]
      )

      const [prodRows] = await conn.execute(
        'SELECT stock_actual FROM gastro_productos WHERE id = ?',
        [det.producto_id]
      )

      const stockActual = Number((prodRows as any[])[0]?.stock_actual) || 0
      const nuevoSaldo = stockActual + cantidad

      await conn.execute(
        `INSERT INTO gastro_movimientos_kardex (tipo, concepto, producto_id, lote_id, entrada, salida, saldo, costo_unitario, usuario_id, referencia)
         VALUES ('ENTRADA', 'COMPRA', ?, ?, ?, 0, ?, ?, ?, ?)`,
        [det.producto_id, detalleId, cantidad, nuevoSaldo, costo, req.user?.id ?? null, `Compra #${compraId}`]
      )

      await conn.execute(
        'UPDATE gastro_productos SET stock_actual = ? WHERE id = ?',
        [nuevoSaldo, det.producto_id]
      )
    }

    await conn.commit()

    await registrarAuditoria(req.user?.id, 'CREAR_COMPRA', 'gastro_compras', compraId, `Proveedor #${proveedor_id}, Total: ${total}`)

    res.status(201).json({
      success: true,
      message: 'Compra registrada exitosamente',
      data: { id: compraId, proveedor_id, total, num_lotes: detalles.length }
    })
  } catch (error: any) {
    await conn.rollback()
    console.error('Error al crear compra (GastroStock):', error)
    res.status(500).json({
      success: false,
      message: 'Error al registrar la compra',
      error: error.message
    })
  } finally {
    conn.release()
  }
}

export const cancelar = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params

    const checkQuery = 'SELECT id FROM gastro_compras WHERE id = ? AND activo = 1'
    const [existing] = await pool.execute(checkQuery, [id])

    if ((existing as any[]).length === 0) {
      res.status(404).json({
        success: false,
        message: 'Compra no encontrada'
      })
      return
    }

    await pool.execute(
      "UPDATE gastro_compras SET estado = 'CANCELADA', updated_at = NOW() WHERE id = ?",
      [id]
    )

    await registrarAuditoria(req.user?.id, 'CANCELAR_COMPRA', 'gastro_compras', Number(id))

    res.json({
      success: true,
      message: 'Compra cancelada exitosamente'
    })
  } catch (error: any) {
    console.error('Error al cancelar compra (GastroStock):', error)
    res.status(500).json({
      success: false,
      message: 'Error al cancelar la compra',
      error: error.message
    })
  }
}
