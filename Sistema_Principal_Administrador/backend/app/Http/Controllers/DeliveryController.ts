import { Request, Response } from 'express'
import pool from '../../Providers/DatabaseProvider'

export const getAll = async (req: Request, res: Response): Promise<void> => {
  try {
    const { estado } = req.query

    let query = `
      SELECT d.*, u.nombre as repartidor_nombre
      FROM delivery d
      LEFT JOIN usuarios u ON d.repartidor_id = u.id
      WHERE 1=1
    `
    const params: any[] = []

    if (estado) {
      query += ' AND d.estado = ?'
      params.push(estado)
    }

    query += ' ORDER BY d.created_at DESC'

    const [rows] = await pool.execute(query, params)

    res.json({
      success: true,
      count: (rows as any[]).length,
      data: rows
    })
  } catch (error: any) {
    console.error('Error al obtener deliveries:', error)
    res.status(500).json({
      success: false,
      message: 'Error al obtener deliveries',
      error: error.message
    })
  }
}

export const getById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params

    const query = `
      SELECT d.*, u.nombre as repartidor_nombre, p.tipo as pedido_tipo, p.total as pedido_total
      FROM delivery d
      LEFT JOIN usuarios u ON d.repartidor_id = u.id
      LEFT JOIN pedidos p ON d.pedido_id = p.id
      WHERE d.id = ?
    `
    const [rows] = await pool.execute(query, [id])

    if ((rows as any[]).length === 0) {
      res.status(404).json({
        success: false,
        message: 'Delivery no encontrado'
      })
      return
    }

    res.json({
      success: true,
      data: (rows as any[])[0]
    })
  } catch (error: any) {
    console.error('Error al obtener delivery:', error)
    res.status(500).json({
      success: false,
      message: 'Error al obtener delivery',
      error: error.message
    })
  }
}

export const create = async (req: Request, res: Response): Promise<void> => {
  const connection = await pool.getConnection()

  try {
    await connection.beginTransaction()

    const { pedido_id, direccion, telefono, nombre_cliente, notas } = req.body

    if (!pedido_id || !direccion || !telefono || !nombre_cliente) {
      res.status(400).json({
        success: false,
        message: 'Pedido ID, dirección, teléfono y nombre del cliente son requeridos'
      })
      await connection.rollback()
      connection.release()
      return
    }

    const insertQuery = `
      INSERT INTO delivery (pedido_id, direccion, telefono, nombre_cliente, estado, notas, created_at, updated_at)
      VALUES (?, ?, ?, ?, 'pendiente', ?, NOW(), NOW())
    `

    const [result] = await connection.execute(insertQuery, [
      pedido_id,
      direccion,
      telefono,
      nombre_cliente,
      notas || null
    ])

    await connection.execute(
      'UPDATE pedidos SET tipo = ? WHERE id = ?',
      ['delivery', pedido_id]
    )

    await connection.commit()
    connection.release()

    if (global.io) {
      global.io.emit('delivery:changed', { action: 'create', deliveryId: (result as any).insertId })
      global.io.emit('pedidos:changed', { action: 'create', deliveryId: (result as any).insertId })
    }

    res.status(201).json({
      success: true,
      message: 'Delivery creado exitosamente',
      data: { id: (result as any).insertId }
    })
  } catch (error: any) {
    await connection.rollback()
    connection.release()
    console.error('Error al crear delivery:', error)
    res.status(500).json({
      success: false,
      message: 'Error al crear delivery',
      error: error.message
    })
  }
}

export const asignarRepartidor = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params
    const { repartidor_id } = req.body

    if (!repartidor_id) {
      res.status(400).json({
        success: false,
        message: 'ID del repartidor es requerido'
      })
      return
    }

    const updateQuery = `
      UPDATE delivery
      SET repartidor_id = ?, estado = 'asignado', updated_at = NOW()
      WHERE id = ? AND estado = 'pendiente'
    `
    const [result] = await pool.execute(updateQuery, [repartidor_id, id])

    if ((result as any).affectedRows === 0) {
      res.status(400).json({
        success: false,
        message: 'No se pudo asignar repartidor. Verifique que el delivery esté pendiente.'
      })
      return
    }

    if (global.io) {
      global.io.emit('delivery:changed', { action: 'asignar', deliveryId: id })
    }

    res.json({
      success: true,
      message: 'Repartidor asignado exitosamente'
    })
  } catch (error: any) {
    console.error('Error al asignar repartidor:', error)
    res.status(500).json({
      success: false,
      message: 'Error al asignar repartidor',
      error: error.message
    })
  }
}

export const updateEstado = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params
    const { estado } = req.body

    const estadosValidos = ['pendiente', 'asignado', 'en_camino', 'entregado', 'cancelado']

    if (!estadosValidos.includes(estado)) {
      res.status(400).json({
        success: false,
        message: 'Estado no válido'
      })
      return
    }

    const updateQuery = 'UPDATE delivery SET estado = ?, updated_at = NOW() WHERE id = ?'
    const [result] = await pool.execute(updateQuery, [estado, id])

    if ((result as any).affectedRows === 0) {
      res.status(404).json({
        success: false,
        message: 'Delivery no encontrado'
      })
      return
    }

    if (estado === 'entregado') {
      const [delivery] = await pool.execute(
        'SELECT pedido_id FROM delivery WHERE id = ?',
        [id]
      )
      const pedidoId = (delivery as any[])[0]?.pedido_id
      if (pedidoId) {
        await pool.execute(
          'UPDATE pedidos SET estado = ? WHERE id = ?',
          ['entregado', pedidoId]
        )
      }
    }

    if (global.io) {
      global.io.emit('delivery:changed', { deliveryId: id, estado })
      global.io.emit('pedidos:changed', { deliveryId: id, estado })
    }

    res.json({
      success: true,
      message: 'Estado del delivery actualizado exitosamente'
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
