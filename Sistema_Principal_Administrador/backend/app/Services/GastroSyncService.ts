import jwt from 'jsonwebtoken'
import pool from '../Providers/DatabaseProvider'
import config from '../../config/app'

const GASTRO_API_URL = process.env.GASTRO_API_URL || 'http://localhost:3007/api'
const GASTRO_SERVICE_TOKEN = process.env.GASTRO_SERVICE_TOKEN || ''

// Genera token interno para hablar con Gastro (mismo JWT_SECRET)
const getServiceToken = (): string => {
  if (GASTRO_SERVICE_TOKEN) return GASTRO_SERVICE_TOKEN
  return jwt.sign(
    { id: 0, usuario: 'sistema', nombre: 'Sistema POS', rol: 'admin' },
    config.jwtSecret,
    { expiresIn: '1h' } as jwt.SignOptions
  )
}

// Llama a Gastro POST /api/gastro/kardex/salida
const enviarConsumoAGastro = async (
  gastroProductoId: number,
  cantidad: number,
  referencia: string,
  usuarioId: number | null
): Promise<void> => {
  const token = getServiceToken()
  const res = await fetch(`${GASTRO_API_URL}/gastro/kardex/salida`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      producto_id: gastroProductoId,
      cantidad,
      concepto: 'CONSUMO',
      referencia
    })
  })
  if (!res.ok) {
    const txt = await res.text()
    throw new Error(`Gastro API ${res.status}: ${txt}`)
  }
}

// Registra encolando en sync_consumo_cola y dispara envío inmediato
export const encolarConsumosDePedido = async (
  pedidoId: number,
  items: { producto_id: number; cantidad: number; detalle_pedido_id?: number }[],
  usuarioId: number | null
): Promise<void> => {
  for (const item of items) {
    const [recetas] = await pool.execute(
      'SELECT gastro_producto_id, cantidad FROM receta_detalle WHERE producto_id = ?',
      [item.producto_id]
    )
    for (const rec of recetas as any[]) {
      const totalInsumo = Number(rec.cantidad) * Number(item.cantidad)
      // Encolar
      const [result] = await pool.execute(
        `INSERT INTO sync_consumo_cola (pedido_id, detalle_pedido_id, gastro_producto_id, cantidad, estado, intentos)
         VALUES (?, ?, ?, ?, 'pendiente', 0)`,
        [pedidoId, item.detalle_pedido_id || null, rec.gastro_producto_id, totalInsumo]
      )
      const colaId = (result as any).insertId
      // Intento inmediato
      try {
        await enviarConsumoAGastro(rec.gastro_producto_id, totalInsumo, `pedido #${pedidoId}`, usuarioId)
        await pool.execute(
          `UPDATE sync_consumo_cola SET estado='enviado', updated_at=NOW() WHERE id=?`,
          [colaId]
        )
      } catch (err: any) {
        await pool.execute(
          `UPDATE sync_consumo_cola SET estado='error', intentos=intentos+1, ultimo_error=?, updated_at=NOW() WHERE id=?`,
          [err.message?.substring(0, 500) || 'Error desconocido', colaId]
        )
        console.warn(`[GastroSync] Encolado pendiente pedido #${pedidoId} insumo ${rec.gastro_producto_id}: ${err.message}`)
      }
    }
  }
}

// Reintenta pendientes cada 30s
export const iniciarGastroSync = (): void => {
  const INTERVALO = 30000
  console.log(`[GastroSync] Activo -> ${GASTRO_API_URL} (cada ${INTERVALO / 1000}s)`)

  setInterval(async () => {
    try {
      const [pendientes] = await pool.execute(
        `SELECT id, pedido_id, gastro_producto_id, cantidad FROM sync_consumo_cola
         WHERE estado IN ('pendiente','error') AND intentos < 10
         ORDER BY created_at ASC LIMIT 20`
      )
      for (const row of pendientes as any[]) {
        try {
          await enviarConsumoAGastro(row.gastro_producto_id, Number(row.cantidad), `pedido #${row.pedido_id} (reintento)`, null)
          await pool.execute(`UPDATE sync_consumo_cola SET estado='enviado', ultimo_error=NULL, updated_at=NOW() WHERE id=?`, [row.id])
          console.log(`[GastroSync] Reintento OK cola #${row.id} pedido #${row.pedido_id}`)
        } catch (err: any) {
          await pool.execute(`UPDATE sync_consumo_cola SET estado='error', intentos=intentos+1, ultimo_error=?, updated_at=NOW() WHERE id=?`, [err.message?.substring(0, 500), row.id])
        }
      }
    } catch (err: any) {
      console.error('[GastroSync] Error ciclo reintento:', err.message)
    }
  }, INTERVALO)
}
