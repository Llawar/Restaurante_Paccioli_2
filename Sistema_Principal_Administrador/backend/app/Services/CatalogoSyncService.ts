import { createClient, SupabaseClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import os from 'os'
import pool from '../Providers/DatabaseProvider'

dotenv.config()

const SUPABASE_URL = process.env.SUPABASE_URL || ''
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

const detectarIpLocal = (): string => {
  const interfaces = os.networkInterfaces()
  for (const nombre of Object.keys(interfaces)) {
    for (const net of interfaces[nombre] || []) {
      if (net.family === 'IPv4' && !net.internal) {
        return net.address
      }
    }
  }
  return 'localhost'
}

const PUBLIC_BASE_URL = process.env.PUBLIC_BASE_URL || `http://${detectarIpLocal()}:3006`

const INTERVALO_CATALOGO_MS = 15000

const CATEGORIA_DELIVERY = 'Delivery'

let supabase: SupabaseClient | null = null
let sincronizando = false

const initSupabase = (): void => {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.warn('[CatalogoSync] SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY no configuradas. Sincronización de catálogo desactivada.')
    return
  }
  supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
  console.log('[CatalogoSync] Catálogo POS->Supabase activo (polling cada ' + (INTERVALO_CATALOGO_MS / 1000) + 's)')
}

const obtenerProductosPos = async (): Promise<any[]> => {
  const [rows] = await pool.execute(`
    SELECT p.id, p.nombre, p.descripcion, p.precio, p.imagen, p.activo, p.disponible,
           c.nombre AS categoria_nombre
    FROM productos p
    LEFT JOIN categorias c ON p.categoria_id = c.id
    WHERE c.nombre <> ? OR c.nombre IS NULL
    ORDER BY p.id ASC
  `, [CATEGORIA_DELIVERY])
  return rows as any[]
}

const construirImagenUrl = (imagen: string | null): string | null => {
  if (!imagen || !PUBLIC_BASE_URL) return null
  return PUBLIC_BASE_URL.replace(/\/$/, '') + '/' + imagen.replace(/^\//, '')
}

const sincronizarCatalogo = async (): Promise<void> => {
  if (!supabase || sincronizando) return

  sincronizando = true
  try {
    const productos = await obtenerProductosPos()

    const filasUpsert = productos.map((p) => ({
      pos_id: p.id,
      nombre: p.nombre,
      descripcion: p.descripcion || '',
      precio: Number(p.precio) || 0,
      categoria: p.categoria_nombre || 'General',
      imagen_url: construirImagenUrl(p.imagen),
      estado: Boolean(p.activo && p.disponible),
      updated_at: new Date().toISOString()
    }))

    if (filasUpsert.length === 0) return

    const { error } = await supabase
      .from('products')
      .upsert(filasUpsert, { onConflict: 'pos_id' })

    if (error) {
      console.error('[CatalogoSync] Error sincronizando productos:', error.message)
      return
    }

    console.log(`[CatalogoSync] Catálogo sincronizado: ${filasUpsert.length} productos`)

    const { data: supabaseProducts } = await supabase
      .from('products')
      .select('pos_id')
      .not('pos_id', 'is', null)

    const posIds = new Set(productos.map((p) => p.id))
    const desactivar = (supabaseProducts || [])
      .filter((sp: any) => !posIds.has(sp.pos_id))
      .map((sp: any) => sp.pos_id)

    if (desactivar.length > 0) {
      const { error: errDesactivar } = await supabase
        .from('products')
        .update({ estado: false })
        .in('pos_id', desactivar)
      if (errDesactivar) {
        console.error('[CatalogoSync] Error desactivando productos obsoletos:', errDesactivar.message)
      }
    }
  } catch (error: any) {
    console.error('[CatalogoSync] Error en el ciclo de sincronización:', error.message)
  } finally {
    sincronizando = false
  }
}

export const iniciarCatalogoSync = (): void => {
  initSupabase()
  if (!supabase) return

  sincronizarCatalogo()
  setInterval(sincronizarCatalogo, INTERVALO_CATALOGO_MS)
}

export const sincronizarCatalogoAhora = (): void => {
  if (supabase) {
    sincronizarCatalogo()
  }
}