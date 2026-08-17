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

export const getAlertas = async (_req: Request, res: Response): Promise<void> => {
  try {
    const query = `
      SELECT i.*, p.nombre as producto_nombre, p.unidad_medida
      FROM inventario i
      INNER JOIN productos p ON i.producto_id = p.id
      WHERE p.activo = 1
        AND (
          i.cantidad <= i.stock_minimo
          OR i.cantidad = 0
        )
      ORDER BY i.cantidad ASC
    `
    const [rows] = await pool.execute(query)

    const data = (rows as any[]).map(item => ({
      ...item,
      tipo_alerta: parseFloat(item.cantidad) === 0 ? 'agotado' : 'stock_bajo'
    }))

    res.json({
      success: true,
      count: data.length,
      data
    })
  } catch (error: any) {
    console.error('Error al obtener alertas de inventario:', error)
    res.status(500).json({
      success: false,
      message: 'Error al obtener alertas de inventario',
      error: error.message
    })
  }
}

export const create = async (req: Request, res: Response): Promise<void> => {
  const connection = await pool.getConnection()

  try {
    await connection.beginTransaction()

    const {
      nombre,
      proveedor,
      stock_actual = 0,
      stock_minimo = 10,
      stock_maximo = 100,
      unidad_medida = 'unidades'
    } = req.body

    if (!nombre) {
      res.status(400).json({
        success: false,
        message: 'El nombre del insumo es requerido'
      })
      await connection.rollback()
      connection.release()
      return
    }

    const insertProductoQuery = `
      INSERT INTO productos (nombre, descripcion, precio, categoria_id, imagen, disponible, requiere_inventario, unidad_medida, activo, created_at, updated_at)
      VALUES (?, NULL, 0, (SELECT id FROM categorias ORDER BY id ASC LIMIT 1), NULL, 1, 1, ?, 1, NOW(), NOW())
    `
    const [productoResult] = await connection.execute(insertProductoQuery, [
      nombre,
      unidad_medida
    ])
    const productoId = (productoResult as any).insertId

    const insertInventarioQuery = `
      INSERT INTO inventario (producto_id, cantidad, stock_minimo, stock_maximo, proveedor, updated_at)
      VALUES (?, ?, ?, ?, ?, NOW())
    `
    await connection.execute(insertInventarioQuery, [
      productoId,
      parseFloat(stock_actual) || 0,
      parseFloat(stock_minimo) || 10,
      parseFloat(stock_maximo) || 100,
      proveedor || null
    ])

    if (parseFloat(stock_actual) > 0) {
      const movimientoQuery = `
        INSERT INTO movimientos_inventario (producto_id, tipo_movimiento, cantidad, observaciones, usuario_id, created_at)
        VALUES (?, 'entrada', ?, 'Stock inicial', ?, NOW())
      `
      await connection.execute(movimientoQuery, [
        productoId,
        parseFloat(stock_actual) || 0,
        req.user?.id || null
      ])
    }

    await connection.commit()
    connection.release()

    if (global.io) {
      global.io.emit('inventario:changed', { action: 'create', productoId })
    }

    res.status(201).json({
      success: true,
      message: 'Insumo creado exitosamente',
      data: { id: productoId }
    })
  } catch (error: any) {
    await connection.rollback()
    connection.release()
    console.error('Error al crear insumo:', error)
    res.status(500).json({
      success: false,
      message: 'Error al crear insumo',
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

    if (global.io) {
      global.io.emit('inventario:changed', { action: 'stock', productoId, tipo_movimiento })
    }

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
