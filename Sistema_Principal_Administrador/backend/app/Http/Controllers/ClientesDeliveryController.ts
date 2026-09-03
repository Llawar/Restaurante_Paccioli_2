import { Request, Response } from 'express'
import pool from '../../Providers/DatabaseProvider'
import { hashPassword } from './AuthController'
import { createClient } from '@supabase/supabase-js'

const getSupabaseAdmin = () => {
  const url = process.env.SUPABASE_URL || ''
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
  if (!url || !key) return null
  return createClient(url, key)
}

// Listar clientes provenientes de Supabase (delivery app)
export const getAll = async (_req: Request, res: Response): Promise<void> => {
  try {
    const [rows] = await pool.execute(
      `SELECT c.id, c.nombre, c.telefono, c.email, c.direccion, c.supabase_id, c.supabase_rol, c.supabase_sincronizado_at, c.created_at,
              u.id as usuario_delivery_id, u.rol as usuario_rol, u.activo as usuario_activo
       FROM clientes c
       LEFT JOIN usuarios u ON u.email = c.email AND u.rol = 'delivery'
       WHERE c.supabase_id IS NOT NULL
       ORDER BY c.created_at DESC`
    )
    res.json({ success: true, count: (rows as any[]).length, data: rows })
  } catch (error: any) {
    console.error('Error al obtener clientes delivery:', error)
    res.status(500).json({ success: false, message: 'Error al obtener clientes delivery', error: error.message })
  }
}

export const getById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params
    const [rows] = await pool.execute('SELECT * FROM clientes WHERE id = ? AND supabase_id IS NOT NULL LIMIT 1', [id])
    if ((rows as any[]).length === 0) {
      res.status(404).json({ success: false, message: 'Cliente delivery no encontrado' })
      return
    }
    res.json({ success: true, data: (rows as any[])[0] })
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Error al obtener cliente', error: error.message })
  }
}

// Promover cliente a repartidor (crea usuario delivery + actualiza Supabase)
export const promoteToDelivery = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params
    const { password = 'delivery123' } = req.body

    const [rows] = await pool.execute('SELECT * FROM clientes WHERE id = ? AND supabase_id IS NOT NULL LIMIT 1', [id])
    const cliente = (rows as any[])[0]
    if (!cliente) {
      res.status(404).json({ success: false, message: 'Cliente no encontrado' })
      return
    }

    // Verificar si ya existe usuario delivery con ese email
    const [existing] = await pool.execute('SELECT id FROM usuarios WHERE email = ? LIMIT 1', [cliente.email])
    if ((existing as any[]).length > 0) {
      res.status(409).json({ success: false, message: 'Ya existe un usuario delivery con ese email' })
      return
    }

    const hashed = await hashPassword(password)
    const usuario = cliente.email?.split('@')[0] || `delivery_${cliente.id}`

    const [result] = await pool.execute(
      `INSERT INTO usuarios (nombre, usuario, password, email, rol, activo, created_at)
       VALUES (?, ?, ?, ?, 'delivery', 1, NOW())`,
      [cliente.nombre, usuario, hashed, cliente.email]
    )

    // Actualizar Supabase rol a delivery
    const supabase = getSupabaseAdmin()
    if (supabase && cliente.supabase_id) {
      const { error } = await supabase.from('users').update({ rol: 'delivery' }).eq('id', cliente.supabase_id)
      if (error) console.warn('[ClientesDelivery] No se pudo actualizar rol en Supabase:', error.message)
      else {
        // Asegurar perfil delivery
        await supabase.from('delivery_profiles').upsert({
          user_id: cliente.supabase_id,
          estado_disponibilidad: 'offline',
          calificacion_promedio: 0.0,
          entregas_completadas: 0,
        })
      }
      await pool.execute('UPDATE clientes SET supabase_rol = ? WHERE id = ?', ['delivery', id])
    }

    if (global.io) global.io.emit('clientes:changed', { action: 'promote', clienteId: id, usuarioId: (result as any).insertId })

    res.status(201).json({
      success: true,
      message: 'Cliente promovido a delivery exitosamente',
      data: { clienteId: id, usuarioId: (result as any).insertId, usuario, email: cliente.email }
    })
  } catch (error: any) {
    console.error('Error promoviendo a delivery:', error)
    res.status(500).json({ success: false, message: 'Error al promover a delivery', error: error.message })
  }
}

// Revertir delivery a cliente
export const demoteToClient = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params
    const [rows] = await pool.execute('SELECT * FROM clientes WHERE id = ? AND supabase_id IS NOT NULL LIMIT 1', [id])
    const cliente = (rows as any[])[0]
    if (!cliente) {
      res.status(404).json({ success: false, message: 'Cliente no encontrado' })
      return
    }

    // Desactivar usuario delivery asociado
    await pool.execute("UPDATE usuarios SET activo = 0, updated_at = NOW() WHERE email = ? AND rol = 'delivery'", [cliente.email])

    const supabase = getSupabaseAdmin()
    if (supabase && cliente.supabase_id) {
      await supabase.from('users').update({ rol: 'client' }).eq('id', cliente.supabase_id)
      await pool.execute('UPDATE clientes SET supabase_rol = ? WHERE id = ?', ['client', id])
    }

    if (global.io) global.io.emit('clientes:changed', { action: 'demote', clienteId: id })

    res.json({ success: true, message: 'Delivery revertido a cliente' })
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Error al revertir', error: error.message })
  }
}

// Bloquear/desbloquear cliente (actualiza Supabase estado)
export const toggleBlock = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params
    const [rows] = await pool.execute('SELECT * FROM clientes WHERE id = ? AND supabase_id IS NOT NULL LIMIT 1', [id])
    const cliente = (rows as any[])[0]
    if (!cliente) {
      res.status(404).json({ success: false, message: 'Cliente no encontrado' })
      return
    }

    const supabase = getSupabaseAdmin()
    let nuevoEstado = true
    if (supabase && cliente.supabase_id) {
      const { data } = await supabase.from('users').select('estado').eq('id', cliente.supabase_id).single()
      nuevoEstado = !data?.estado
      await supabase.from('users').update({ estado: nuevoEstado }).eq('id', cliente.supabase_id)
    }

    res.json({ success: true, message: nuevoEstado ? 'Cliente desbloqueado' : 'Cliente bloqueado', data: { estado: nuevoEstado } })
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Error al bloquear', error: error.message })
  }
}

// Forzar sincronización manual
export const syncNow = async (_req: Request, res: Response): Promise<void> => {
  try {
    const { sincronizarUsuariosAhora } = await import('../../Services/UserSyncService')
    await sincronizarUsuariosAhora()
    res.json({ success: true, message: 'Sincronización ejecutada' })
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Error en sincronización', error: error.message })
  }
}
