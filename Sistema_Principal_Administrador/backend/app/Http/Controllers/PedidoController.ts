import { Request, Response } from 'express'
import pool from '../../Providers/DatabaseProvider'
import { asignarItemsAPuestos } from './CocinaController'

export const getAll = async (req: Request, res: Response): Promise<void> => {
  try {
    const { estado, fecha_desde, fecha_hasta } = req.query

    let query = `
      SELECT p.*,
             u.nombre as usuario_nombre,
             c.nombre as cliente_nombre,
             m.numero_mesa
      FROM pedidos p
      LEFT JOIN usuarios u ON p.usuario_id = u.id
      LEFT JOIN clientes c ON p.cliente_id = c.id
      LEFT JOIN mesas m ON p.mesa_id = m.id
      WHERE 1=1
    `
    const params: any[] = []

    if (estado) {
      query += ' AND p.estado = ?'
      params.push(estado)
    }

    if (fecha_desde) {
      query += ' AND DATE(p.created_at) >= ?'
      params.push(fecha_desde)
    }

    if (fecha_hasta) {
      query += ' AND DATE(p.created_at) <= ?'
      params.push(fecha_hasta)
    }

    query += ' ORDER BY p.created_at DESC'

    const [rows] = await pool.execute(query, params)

    res.json({
      success: true,
      count: (rows as any[]).length,
      data: rows
    })
  } catch (error: any) {
    console.error('Error al obtener pedidos:', error)
    res.status(500).json({
      success: false,
      message: 'Error al obtener pedidos',
      error: error.message
    })
  }
}

export const getById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params

    const query = `
      SELECT p.*,
             u.nombre as usuario_nombre,
             c.nombre as cliente_nombre,
             m.numero_mesa
      FROM pedidos p
      LEFT JOIN usuarios u ON p.usuario_id = u.id
      LEFT JOIN clientes c ON p.cliente_id = c.id
      LEFT JOIN mesas m ON p.mesa_id = m.id
      WHERE p.id = ?
    `
    const [pedidos] = await pool.execute(query, [id])

    if ((pedidos as any[]).length === 0) {
      res.status(404).json({
        success: false,
        message: 'Pedido no encontrado'
      })
      return
    }

    const detallesQuery = `
      SELECT dp.*, pr.nombre as producto_nombre
      FROM detalles_pedido dp
      INNER JOIN productos pr ON dp.producto_id = pr.id
      WHERE dp.pedido_id = ?
    `
    const [detalles] = await pool.execute(detallesQuery, [id])

    res.json({
      success: true,
      data: {
        ...(pedidos as any[])[0],
        detalles
      }
    })
  } catch (error: any) {
    console.error('Error al obtener pedido:', error)
    res.status(500).json({
      success: false,
      message: 'Error al obtener pedido',
      error: error.message
    })
  }
}

export const create = async (req: Request, res: Response): Promise<void> => {
  const connection = await pool.getConnection()

  try {
    await connection.beginTransaction()

    const {
      tipo,
      mesa_id,
      cliente_id,
      delivery_id,
      items,
      notas,
      total
    } = req.body

    if (!items || !Array.isArray(items) || items.length === 0) {
      res.status(400).json({
        success: false,
        message: 'El pedido debe contener al menos un item'
      })
      await connection.rollback()
      connection.release()
      return
    }

    const pedidoQuery = `
      INSERT INTO pedidos (tipo, mesa_id, cliente_id, usuario_id, estado, total, notas, created_at, updated_at)
      VALUES (?, ?, ?, ?, 'pendiente', ?, ?, NOW(), NOW())
    `

    const [pedidoResult] = await connection.execute(pedidoQuery, [
      tipo,
      mesa_id || null,
      cliente_id || null,
      req.user?.id || null,
      total || 0,
      notas || null
    ])

    const pedidoId = (pedidoResult as any).insertId

    for (const item of items) {
      const detalleQuery = `
        INSERT INTO detalles_pedido (pedido_id, producto_id, cantidad, precio_unitario, subtotal, notas)
        VALUES (?, ?, ?, ?, ?, ?)
      `

      await connection.execute(detalleQuery, [
        pedidoId,
        item.producto_id,
        item.cantidad,
        item.precio_unitario,
        item.cantidad * item.precio_unitario,
        item.notas || null
      ])
    }

    await connection.commit()
    connection.release()

    await asignarItemsAPuestos(pedidoId)

    if (global.io) {
      global.io.emit('kitchen:new_order', { pedidoId, timestamp: new Date().toISOString() })
    }

    res.status(201).json({
      success: true,
      message: 'Pedido creado exitosamente',
      data: { id: pedidoId }
    })
  } catch (error: any) {
    await connection.rollback()
    connection.release()
    console.error('Error al crear pedido:', error)
    res.status(500).json({
      success: false,
      message: 'Error al crear pedido',
      error: error.message
    })
  }
}

export const updateEstado = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params
    const { estado } = req.body

    const estadosValidos = ['pendiente', 'preparando', 'listo', 'entregado', 'cancelado']

    if (!estadosValidos.includes(estado)) {
      res.status(400).json({
        success: false,
        message: 'Estado no válido'
      })
      return
    }

    const updateQuery = `
      UPDATE pedidos
      SET estado = ?, updated_at = NOW()
      WHERE id = ?
    `

    const [result] = await pool.execute(updateQuery, [estado, id])

    if ((result as any).affectedRows === 0) {
      res.status(404).json({
        success: false,
        message: 'Pedido no encontrado'
      })
      return
    }

    res.json({
      success: true,
      message: 'Estado del pedido actualizado exitosamente'
    })
  } catch (error: any) {
    console.error('Error al actualizar estado:', error)
    res.status(500).json({
      success: false,
      message: 'Error al actualizar estado',
      error: error.message
    })
  }
}

export const getParaDisplay = async (_req: Request, res: Response): Promise<void> => {
  try {
    const query = `
      SELECT id, tipo, estado, created_at
      FROM pedidos
      WHERE DATE(created_at) = CURDATE()
        AND estado NOT IN ('entregado', 'cancelado')
      ORDER BY
        CASE estado
          WHEN 'listo' THEN 0
          WHEN 'preparando' THEN 1
          WHEN 'pendiente' THEN 2
          ELSE 3
        END,
        created_at ASC
    `

    const [rows] = await pool.execute(query)

    res.json({
      success: true,
      count: (rows as any[]).length,
      data: rows
    })
  } catch (error: any) {
    console.error('Error al obtener pedidos para display:', error)
    res.status(500).json({
      success: false,
      message: 'Error al obtener pedidos',
      error: error.message
    })
  }
}
