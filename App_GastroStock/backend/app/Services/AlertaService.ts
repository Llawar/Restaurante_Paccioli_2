import pool from '../Providers/DatabaseProvider'

export const generarAlertasStock = async (productoId: number): Promise<void> => {
  try {
    const [prodRows] = await pool.execute(
      'SELECT nombre, stock_actual, stock_minimo FROM gastro_productos WHERE id = ? AND activo = 1',
      [productoId]
    )

    if ((prodRows as any[]).length === 0) return

    const prod = (prodRows as any[])[0]
    const stock = Number(prod.stock_actual) || 0
    const minimo = Number(prod.stock_minimo) || 0

    if (stock <= 0) {
      await pool.execute(
        `INSERT INTO gastro_alertas (producto_id, tipo, mensaje)
         VALUES (?, 'AGOTADO', ?)`,
        [productoId, `Producto agotado: ${prod.nombre}`]
      )
    } else if (stock <= minimo) {
      await pool.execute(
        `INSERT INTO gastro_alertas (producto_id, tipo, mensaje)
         VALUES (?, 'STOCK_MINIMO', ?)`,
        [productoId, `Stock mínimo alcanzado: ${prod.nombre} (${stock})`]
      )
    }
  } catch (error) {
    console.error('Error al generar alertas de stock:', error)
  }
}

export const generarAlertaVencimiento = async (loteId: number): Promise<void> => {
  try {
    const [loteRows] = await pool.execute(
      `SELECT l.vencimiento, p.nombre as producto_nombre, p.id as producto_id
       FROM gastro_lotes l
       LEFT JOIN gastro_productos p ON l.producto_id = p.id
       WHERE l.id = ? AND l.vencimiento IS NOT NULL`,
      [loteId]
    )

    if ((loteRows as any[]).length === 0) return

    const lote = (loteRows as any[])[0]

    await pool.execute(
      `INSERT INTO gastro_alertas (producto_id, tipo, mensaje)
       VALUES (?, 'PROXIMO_VENCER', ?)`,
      [lote.producto_id, `Próximo a vencer: ${lote.producto_nombre} (${lote.vencimiento})`]
    )
  } catch (error) {
    console.error('Error al generar alerta de vencimiento:', error)
  }
}
