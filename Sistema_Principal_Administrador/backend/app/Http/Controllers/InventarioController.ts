import { Request, Response } from 'express'
import pool from '../../Providers/DatabaseProvider'

export const getAll = async (_req: Request, res: Response): Promise<void> => {
  try {
    const query = `
      SELECT i.*, p.nombre as producto_nombre, p.unidad_medida
      FROM inventario i
      INNER JOIN productos p ON i.producto_id = p.id
      WHERE p.activo = 1
      ORDER BY p.nombre ASC
    `
    const [rows] = await pool.execute(query)

    res.json({
      success: true,
      count: (rows as any[]).length,
      data: rows
    })
  } catch (error: any) {
    console.error('Error al obtener inventario:', error)
    res.status(500).json({
      success: false,
      message: 'Error al obtener inventario',
      error: error.message
    })
  }
}

export const getByProducto = async (req: Request, res: Response): Promise<void> => {
  try {
    const { productoId } = req.params

    const query = `
      SELECT i.*, p.nombre as producto_nombre, p.unidad_medida
      FROM inventario i
      INNER JOIN productos p ON i.producto_id = p.id
      WHERE i.producto_id = ? AND p.activo = 1
    `
    const [rows] = await pool.execute(query, [productoId])

    res.json({
      success: true,
      data: (rows as any[])[0] || { cantidad: 0 }
    })
  } catch (error: any) {
    console.error('Error al obtener inventario del producto:', error)
    res.status(500).json({
      success: false,
      message: 'Error al obtener inventario',
      error: error.message
    })
  }
}

export const getMovimientos = async (req: Request, res: Response): Promise<void> => {
  try {
    const { productoId } = req.params

    const query = `
      SELECT m.*, u.nombre as usuario_nombre
      FROM movimientos_inventario m
      LEFT JOIN usuarios u ON m.usuario_id = u.id
      WHERE m.producto_id = ?
      ORDER BY m.created_at DESC
      LIMIT 50
    `
    const [rows] = await pool.execute(query, [productoId])

    res.json({
      success: true,
      count: (rows as any[]).length,
      data: rows
    })
  } catch (error: any) {
    console.error('Error al obtener movimientos:', error)
    res.status(500).json({
      success: false,
      message: 'Error al obtener movimientos',
      error: error.message
    })
  }
}

export const updateStock = async (req: Request, res: Response): Promise<void> => {
  const connection = await pool.getConnection()

  try {
    await connection.beginTransaction()

    const { productoId } = req.params
    const { cantidad, tipo_movimiento, observaciones } = req.body

    if (!cantidad || !tipo_movimiento) {
      res.status(400).json({
        success: false,
        message: 'Cantidad y tipo de movimiento son requeridos'
      })
      await connection.rollback()
      connection.release()
      return
    }

    const upsertQuery = `
      INSERT INTO inventario (producto_id, cantidad, updated_at)
      VALUES (?, ?, NOW())
      ON DUPLICATE KEY UPDATE
        cantidad = CASE
          WHEN ? = 'entrada' THEN cantidad + ?
          WHEN ? = 'salida' THEN cantidad - ?
          ELSE ?
        END,
        updated_at = NOW()
    `

    const cantidadNumerica = parseFloat(cantidad)
    await connection.execute(upsertQuery, [
      productoId,
      cantidadNumerica,
      tipo_movimiento, cantidadNumerica,
      tipo_movimiento, cantidadNumerica,
      cantidadNumerica
    ])

    const movimientoQuery = `
      INSERT INTO movimientos_inventario (producto_id, tipo_movimiento, cantidad, observaciones, usuario_id, created_at)
      VALUES (?, ?, ?, ?, ?, NOW())
    `

    await connection.execute(movimientoQuery, [
      productoId,
      tipo_movimiento,
      cantidadNumerica,
      observaciones || null,
      req.user?.id || null
    ])

    await connection.commit()
    connection.release()

    res.json({
      success: true,
      message: 'Stock actualizado exitosamente'
    })
  } catch (error: any) {
    await connection.rollback()
    connection.release()
    console.error('Error al actualizar stock:', error)
    res.status(500).json({
      success: false,
      message: 'Error al actualizar stock',
      error: error.message
    })
  }
}
