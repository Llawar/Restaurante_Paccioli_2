import { Request, Response } from 'express'
import pool from '../../Providers/DatabaseProvider'

export const getPedidosPorPuesto = async (req: Request, res: Response): Promise<void> => {
  try {
    const { puestoId } = req.params

    const query = `
      SELECT
        dp.id as detalle_id,
        dp.pedido_id,
        dp.cantidad,
        dp.notas as notas_item,
        dp.estado_cocina,
        dp.hora_inicio_preparacion,
        dp.hora_fin_preparacion,
        p.nombre as producto_nombre,
        p.imagen as producto_imagen,
        c.nombre as categoria_nombre,
        ped.tipo as tipo_pedido,
        ped.created_at as hora_pedido,
        ped.notas as notas_pedido,
        mes.numero_mesa,
        pc.nombre as puesto_nombre
      FROM detalles_pedido dp
      JOIN productos p ON dp.producto_id = p.id
      JOIN categorias c ON p.categoria_id = c.id
      JOIN pedidos ped ON dp.pedido_id = ped.id
      LEFT JOIN mesas mes ON ped.mesa_id = mes.id
      JOIN puestos_cocina pc ON dp.puesto_asignado_id = pc.id
      WHERE dp.puesto_asignado_id = ?
        AND dp.estado_cocina IN ('pendiente', 'en_preparacion')
        AND ped.estado NOT IN ('cancelado', 'entregado')
      ORDER BY
        CASE dp.estado_cocina
          WHEN 'en_preparacion' THEN 1
          WHEN 'pendiente' THEN 2
        END,
        ped.created_at ASC
    `

    const [rows] = await pool.execute(query, [puestoId])

    res.json({
      success: true,
      count: (rows as any[]).length,
      data: rows
    })
  } catch (error: any) {
    console.error('Error al obtener pedidos del puesto:', error)
    res.status(500).json({
      success: false,
      message: 'Error al obtener pedidos',
      error: error.message
    })
  }
}

export const getPuestosCocina = async (_req: Request, res: Response): Promise<void> => {
  try {
    const query = `
      SELECT
        pc.*,
        GROUP_CONCAT(c.nombre) as categorias_asignadas
      FROM puestos_cocina pc
      LEFT JOIN categorias c ON pc.id = c.puesto_cocina_id AND c.activo = 1
      WHERE pc.activo = 1
      GROUP BY pc.id
      ORDER BY pc.id
    `

    const [rows] = await pool.execute(query)

    res.json({
      success: true,
      data: rows
    })
  } catch (error: any) {
    console.error('Error al obtener puestos:', error)
    res.status(500).json({
      success: false,
      message: 'Error al obtener puestos de cocina'
    })
  }
}

export const getMiPuesto = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id

    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'Usuario no autenticado'
      })
      return
    }

    const query = `
      SELECT pc.id, pc.nombre, pc.descripcion, u.puesto_cocina_id
      FROM usuarios u
      LEFT JOIN puestos_cocina pc ON u.puesto_cocina_id = pc.id
      WHERE u.id = ?
    `
    const [rows] = await pool.execute(query, [userId])
    const row = (rows as any[])[0]

    if (!row) {
      res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      })
      return
    }

    const esCocinero = req.user?.rol === 'cocinero'

    res.json({
      success: true,
      data: {
        puestoCocinaId: row.puesto_cocina_id,
        esCocinero,
        puesto: row.puesto_cocina_id
          ? { id: row.id, nombre: row.nombre, descripcion: row.descripcion }
          : null,
        // Los admin/empleados sin puesto asignado pueden elegir cualquier puesto
        requiereSeleccion: esCocinero ? false : !row.puesto_cocina_id
      }
    })
  } catch (error: any) {
    console.error('Error al obtener mi puesto:', error)
    res.status(500).json({
      success: false,
      message: 'Error al obtener mi puesto',
      error: error.message
    })
  }
}

const actualizarEstadoPedido = async (pedidoId: number, connection: any): Promise<void> => {
  try {
    const [items] = await connection.execute(
      `SELECT estado_cocina FROM detalles_pedido WHERE pedido_id = ?`,
      [pedidoId]
    )

    if ((items as any[]).length === 0) return

    const estados = (items as any[]).map((i: any) => i.estado_cocina)
    const todosListos = estados.every((e: string) => e === 'listo')
    const algunoEnPreparacion = estados.some((e: string) => e === 'en_preparacion')
    const algunoPendiente = estados.some((e: string) => e === 'pendiente')

    let nuevoEstadoPedido: string | null = null

    if (todosListos) {
      nuevoEstadoPedido = 'listo'
    } else if (algunoEnPreparacion) {
      nuevoEstadoPedido = 'preparando'
    } else if (algunoPendiente) {
      nuevoEstadoPedido = 'pendiente'
    }

    if (nuevoEstadoPedido) {
      await connection.execute(
        `UPDATE pedidos SET estado = ?, updated_at = NOW() WHERE id = ?`,
        [nuevoEstadoPedido, pedidoId]
      )
      console.log(`Pedido ${pedidoId} actualizado a: ${nuevoEstadoPedido}`)
    }
  } catch (error) {
    console.error('Error actualizando estado del pedido:', error)
  }
}

export const cambiarEstadoItem = async (req: Request, res: Response): Promise<void> => {
  const connection = await pool.getConnection()

  try {
    await connection.beginTransaction()

    const { detalleId } = req.params
    const { nuevoEstado } = req.body
    // Cocinero identificado desde el token JWT (no confiar en el body)
    const cocineroId = req.user?.id ?? null

    let updateQuery: string
    let params: any[] = [nuevoEstado]

    if (nuevoEstado === 'en_preparacion') {
      updateQuery = `
        UPDATE detalles_pedido
        SET estado_cocina = ?,
            cocinero_id = ?,
            hora_inicio_preparacion = NOW()
        WHERE id = ?
      `
      params.push(cocineroId, detalleId)
    } else if (nuevoEstado === 'listo') {
      updateQuery = `
        UPDATE detalles_pedido
        SET estado_cocina = ?,
            hora_fin_preparacion = NOW()
        WHERE id = ?
      `
      params.push(detalleId)
    } else {
      await connection.rollback()
      connection.release()
      res.status(400).json({
        success: false,
        message: 'Estado no válido: ' + nuevoEstado
      })
      return
    }

    const [result] = await connection.execute(updateQuery, params)

    if ((result as any).affectedRows === 0) {
      await connection.rollback()
      connection.release()
      res.status(404).json({
        success: false,
        message: 'Item no encontrado'
      })
      return
    }

    const [itemData] = await connection.execute(
      'SELECT pedido_id FROM detalles_pedido WHERE id = ?',
      [detalleId]
    )
    const pedidoId = (itemData as any[])[0]?.pedido_id

    if (pedidoId) {
      await actualizarEstadoPedido(pedidoId, connection)
    }

    await connection.commit()
    connection.release()

    if (global.io) {
      global.io.emit('kitchen:order_updated', {
        detalleId,
        pedidoId,
        nuevoEstado,
        timestamp: new Date().toISOString()
      })
    }

    res.json({
      success: true,
      message: 'Estado actualizado correctamente'
    })
  } catch (error: any) {
    await connection.rollback()
    connection.release()
    console.error('Error al cambiar estado:', error)
    res.status(500).json({
      success: false,
      message: 'Error al actualizar estado'
    })
  }
}

export const asignarItemsAPuestos = async (pedidoId: number): Promise<boolean> => {
  try {
    const itemsQuery = `
      SELECT dp.id, p.categoria_id
      FROM detalles_pedido dp
      JOIN productos p ON dp.producto_id = p.id
      WHERE dp.pedido_id = ? AND dp.puesto_asignado_id IS NULL
    `
    const [items] = await pool.execute(itemsQuery, [pedidoId])

    for (const item of items as any[]) {
      // 1 categoría → 1 puesto (columna categorias.puesto_cocina_id)
      const puestoQuery = `
        SELECT pc.id, pc.nombre
        FROM categorias c
        JOIN puestos_cocina pc ON c.puesto_cocina_id = pc.id
        WHERE c.id = ? AND pc.activo = 1 AND pc.id != 6
        ORDER BY pc.id ASC
        LIMIT 1
      `
      const [puestos] = await pool.execute(puestoQuery, [item.categoria_id])

      if ((puestos as any[]).length > 0) {
        await pool.execute(
          'UPDATE detalles_pedido SET puesto_asignado_id = ? WHERE id = ?',
          [(puestos as any[])[0].id, item.id]
        )
      }
    }

    return true
  } catch (error) {
    console.error('Error al asignar items:', error)
    return false
  }
}

export const getResumenCocina = async (_req: Request, res: Response): Promise<void> => {
  try {
    const query = `
      SELECT
        pc.id,
        pc.nombre,
        COUNT(CASE WHEN dp.estado_cocina = 'pendiente' THEN 1 END) as pendientes,
        COUNT(CASE WHEN dp.estado_cocina = 'en_preparacion' THEN 1 END) as en_preparacion,
        COUNT(CASE WHEN dp.estado_cocina = 'listo' THEN 1 END) as listos_hoy
      FROM puestos_cocina pc
      LEFT JOIN detalles_pedido dp ON pc.id = dp.puesto_asignado_id
        AND (dp.estado_cocina IN ('pendiente', 'en_preparacion')
             OR (dp.estado_cocina = 'listo' AND DATE(dp.hora_fin_preparacion) = CURDATE()))
      WHERE pc.activo = 1
      GROUP BY pc.id
      ORDER BY pc.id
    `

    const [rows] = await pool.execute(query)

    res.json({
      success: true,
      data: rows
    })
  } catch (error: any) {
    console.error('Error al obtener resumen:', error)
    res.status(500).json({
      success: false,
      message: 'Error al obtener resumen'
    })
  }
}
