import { createClient, SupabaseClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import pool from '../Providers/DatabaseProvider'
import { asignarItemsAPuestos } from '../Http/Controllers/CocinaController'

dotenv.config()

const SUPABASE_URL = process.env.SUPABASE_URL || ''
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

const INTERVALO_MS = 7000

const CATEGORIA_DELIVERY = 'Delivery'

let supabase: SupabaseClient | null = null

const estadoSupabaseAMysql: Record<string, string> = {
  pending: 'pendiente',
  assigned: 'asignado',
  in_transit: 'en_camino',
  delivered: 'entregado',
  cancelled: 'cancelado'
}

const initSupabase = (): void => {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.warn('[DeliverySync] SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY no configuradas. Puente desactivado.')
    return
  }
  supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
  console.log('[DeliverySync] Puente delivery->POS activo (polling cada ' + (INTERVALO_MS / 1000) + 's)')
}

const obtenerOCrearCategoriaDelivery = async (connection: any): Promise<number> => {
  const [rows] = await connection.execute(
    'SELECT id FROM categorias WHERE nombre = ? LIMIT 1',
    [CATEGORIA_DELIVERY]
  )
  if ((rows as any[]).length > 0) {
    return (rows as any[])[0].id
  }

  const [result] = await connection.execute(
    `INSERT INTO categorias (nombre, descripcion, icono, color, activo)
     VALUES (?, ?, 'shopping-bag', '#F39C12', 1)`,
    [CATEGORIA_DELIVERY, 'Productos creados desde la app de delivery']
  )
  return (result as any).insertId
}

const obtenerOCrearProducto = async (
  connection: any,
  nombre: string,
  precio: number,
  categoriaId: number
): Promise<number> => {
  const [rows] = await connection.execute(
    'SELECT id FROM productos WHERE nombre = ? LIMIT 1',
    [nombre]
  )
  if ((rows as any[]).length > 0) {
    return (rows as any[])[0].id
  }

  const [result] = await connection.execute(
    `INSERT INTO productos (nombre, descripcion, precio, categoria_id, disponible, activo)
     VALUES (?, 'Sincronizado desde la app de delivery', ?, ?, 1, 1)`,
    [nombre, precio, categoriaId]
  )
  return (result as any).insertId
}

const obtenerTelefonoCliente = async (clienteId: string): Promise<string> => {
  try {
    const { data } = await supabase!
      .from('users')
      .select('telefono')
      .eq('id', clienteId)
      .single()
    return data?.telefono || 'Sin teléfono'
  } catch (error) {
    return 'Sin teléfono'
  }
}

const obtenerNombreCliente = async (clienteId: string): Promise<string> => {
  try {
    const { data } = await supabase!
      .from('users')
      .select('nombre')
      .eq('id', clienteId)
      .single()
    return data?.nombre || 'Cliente delivery'
  } catch (error) {
    return 'Cliente delivery'
  }
}

const crearPedidoEnMySQL = async (orden: any): Promise<void> => {
  const connection = await pool.getConnection()

  try {
    await connection.beginTransaction()

    const categoriaId = await obtenerOCrearCategoriaDelivery(connection)
    const items = orden.order_items || []
    let total = parseFloat(orden.total) || 0

    const [pedidoResult] = await connection.execute(
      `INSERT INTO pedidos (tipo, usuario_id, estado, total, notas, created_at, updated_at)
       VALUES ('delivery', NULL, 'pendiente', ?, ?, NOW(), NOW())`,
      [total, `Pedido delivery (Supabase): ${orden.id}`]
    )
    const pedidoId = (pedidoResult as any).insertId

    for (const item of items) {
      const productoId = await obtenerOCrearProducto(
        connection,
        item.nombre_producto || 'Producto',
        parseFloat(item.precio_unitario) || 0,
        categoriaId
      )
      const cantidad = parseInt(item.cantidad) || 1
      const precioUnitario = parseFloat(item.precio_unitario) || 0
      const subtotal = cantidad * precioUnitario

      await connection.execute(
        `INSERT INTO detalles_pedido (pedido_id, producto_id, cantidad, precio_unitario, subtotal, notas)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [pedidoId, productoId, cantidad, precioUnitario, subtotal, null]
      )
    }

    const telefono = await obtenerTelefonoCliente(orden.cliente_id)
    const nombreCliente = await obtenerNombreCliente(orden.cliente_id)

    await connection.execute(
      `INSERT INTO delivery (pedido_id, direccion, telefono, nombre_cliente, estado, notas, supabase_order_id, created_at, updated_at)
       VALUES (?, ?, ?, ?, 'pendiente', ?, ?, NOW(), NOW())`,
      [
        pedidoId,
        orden.direccion_entrega || '',
        telefono,
        nombreCliente,
        `Metodo de pago: ${orden.metodo_pago || 'Efectivo'}`,
        String(orden.id)
      ]
    )

    await connection.commit()
    connection.release()

    await asignarItemsAPuestos(pedidoId)

    if (global.io) {
      global.io.emit('kitchen:new_order', { pedidoId, timestamp: new Date().toISOString() })
      global.io.emit('delivery:changed', { action: 'create', pedidoId, origen: 'supabase' })
      global.io.emit('pedidos:changed', { action: 'create', pedidoId, origen: 'supabase' })
    }

    console.log(`[DeliverySync] Pedido de delivery creado en MySQL: pedido #${pedidoId} (supabase ${orden.id})`)
  } catch (error: any) {
    await connection.rollback()
    connection.release()
    console.error('[DeliverySync] Error creando pedido delivery:', error.message)
  }
}

const existePedido = async (supabaseOrderId: string): Promise<boolean> => {
  const [rows] = await pool.execute(
    'SELECT id FROM delivery WHERE supabase_order_id = ? LIMIT 1',
    [supabaseOrderId]
  )
  return (rows as any[]).length > 0
}

const actualizarEstadoEnMySQL = async (orden: any): Promise<void> => {
  const estadoMysql = estadoSupabaseAMysql[orden.estado] || orden.estado

  const [rows] = await pool.execute(
    'SELECT id, pedido_id FROM delivery WHERE supabase_order_id = ? LIMIT 1',
    [String(orden.id)]
  )
  const delivery = (rows as any[])[0]
  if (!delivery) return

  await pool.execute(
    'UPDATE delivery SET estado = ?, updated_at = NOW() WHERE id = ?',
    [estadoMysql, delivery.id]
  )

  if (orden.estado === 'delivered' || orden.estado === 'cancelled') {
    await pool.execute(
      'UPDATE pedidos SET estado = ?, updated_at = NOW() WHERE id = ?',
      [estadoMysql, delivery.pedido_id]
    )
  }

  if (global.io) {
    global.io.emit('delivery:changed', { deliveryId: delivery.id, estado: estadoMysql, origen: 'supabase' })
    global.io.emit('pedidos:changed', { pedidoId: delivery.pedido_id, estado: estadoMysql, origen: 'supabase' })
  }

  console.log(`[DeliverySync] Estado delivery actualizado a '${estadoMysql}' (supabase ${orden.id})`)
}

const sincronizar = async (): Promise<void> => {
  if (!supabase) return

  try {
    const { data: ordenes, error } = await supabase!
      .from('orders')
      .select('*, order_items(*)')
      .in('estado', ['pending', 'assigned', 'in_transit', 'delivered', 'cancelled'])

    if (error) {
      console.error('[DeliverySync] Error consultando Supabase:', error.message)
      return
    }

    for (const orden of ordenes || []) {
      const yaExiste = await existePedido(String(orden.id))

      if (yaExiste) {
        await actualizarEstadoEnMySQL(orden)
      } else if (orden.estado !== 'cancelled') {
        await crearPedidoEnMySQL(orden)
      }
    }
  } catch (error: any) {
    console.error('[DeliverySync] Error en el ciclo de sincronización:', error.message)
  }
}

export const iniciarDeliverySync = (): void => {
  initSupabase()
  if (!supabase) return

  setInterval(sincronizar, INTERVALO_MS)
}