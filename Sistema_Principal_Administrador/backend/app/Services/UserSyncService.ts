import { createClient, SupabaseClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import pool from '../Providers/DatabaseProvider'

dotenv.config()

const SUPABASE_URL = process.env.SUPABASE_URL || ''
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
const INTERVALO_MS = 10000

let supabase: SupabaseClient | null = null
let sincronizando = false

const initSupabase = (): void => {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.warn('[UserSync] SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY no configuradas. Puente desactivado.')
    return
  }
  supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
  console.log('[UserSync] Puente users Supabase -> MySQL clientes activo (polling cada ' + INTERVALO_MS / 1000 + 's)')
}

const existeCliente = async (supabaseId: string): Promise<boolean> => {
  const [rows] = await pool.execute('SELECT id FROM clientes WHERE supabase_id = ? LIMIT 1', [supabaseId])
  return (rows as any[]).length > 0
}

const crearCliente = async (u: any): Promise<void> => {
  await pool.execute(
    `INSERT INTO clientes (nombre, telefono, email, direccion, supabase_id, supabase_rol, supabase_sincronizado_at, origen, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, NOW(), 'delivery_app', NOW(), NOW())`,
    [u.nombre || 'Cliente delivery', u.telefono || null, u.email || null, u.direccion || null, String(u.id), u.rol || 'client', ]
  )
  console.log(`[UserSync] Cliente creado: ${u.email || u.id} (supabase ${u.id})`)
}

const actualizarCliente = async (u: any): Promise<void> => {
  await pool.execute(
    `UPDATE clientes SET nombre = ?, telefono = ?, email = ?, supabase_rol = ?, origen = 'delivery_app', supabase_sincronizado_at = NOW(), updated_at = NOW()
     WHERE supabase_id = ?`,
    [u.nombre || 'Cliente delivery', u.telefono || null, u.email || null, u.rol || 'client', String(u.id)]
  )
}

const sincronizar = async (): Promise<void> => {
  if (!supabase || sincronizando) return
  sincronizando = true
  try {
    const { data: usuarios, error } = await supabase
      .from('users')
      .select('id, email, nombre, telefono, direccion, rol, estado, fecha_creacion')
      .in('rol', ['client', 'delivery'])

    if (error) {
      console.error('[UserSync] Error consultando Supabase:', error.message)
      return
    }

    if (!usuarios || usuarios.length === 0) return

    let creados = 0
    let actualizados = 0

    for (const u of usuarios) {
      const yaExiste = await existeCliente(String(u.id))
      if (yaExiste) {
        await actualizarCliente(u)
        actualizados++
      } else {
        await crearCliente(u)
        creados++
      }
    }

    if (creados > 0 || actualizados > 0) {
      console.log(`[UserSync] Sincronizados ${usuarios.length} clientes (nuevos: ${creados}, actualizados: ${actualizados})`)
      if (global.io) {
        global.io.emit('clientes:changed', { action: 'sync', creados, actualizados, timestamp: new Date().toISOString() })
      }
    }
  } catch (error: any) {
    console.error('[UserSync] Error en ciclo de sincronización:', error.message)
  } finally {
    sincronizando = false
  }
}

export const iniciarUserSync = (): void => {
  initSupabase()
  if (!supabase) return
  sincronizar()
  setInterval(sincronizar, INTERVALO_MS)
}

export const sincronizarUsuariosAhora = async (): Promise<{ creados: number; actualizados: number }> => {
  if (!supabase) return { creados: 0, actualizados: 0 }
  await sincronizar()
  return { creados: 0, actualizados: 0 }
}
