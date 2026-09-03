import pool from '../Providers/DatabaseProvider'

export const generarNumeroLote = async (): Promise<string> => {
  const fecha = new Date()
  const yyyy = fecha.getFullYear()
  const mm = String(fecha.getMonth() + 1).padStart(2, '0')
  const dd = String(fecha.getDate()).padStart(2, '0')
  const prefijo = `LT-${yyyy}${mm}${dd}`

  const query = `
    SELECT numero_lote FROM gastro_lotes
    WHERE numero_lote LIKE ?
    ORDER BY numero_lote DESC
    LIMIT 1
  `
  const [rows] = await pool.execute(query, [`${prefijo}-%`])

  let consecutivo = 1

  if ((rows as any[]).length > 0) {
    const ultimo = (rows as any[])[0].numero_lote
    const numStr = ultimo.split('-').pop()
    const num = parseInt(numStr, 10)
    if (!isNaN(num)) {
      consecutivo = num + 1
    }
  }

  return `${prefijo}-${String(consecutivo).padStart(4, '0')}`
}

export const registrarEntrada = async (
  productoId: number,
  loteId: number | null,
  cantidad: number,
  costoUnitario: number,
  concepto: 'COMPRA' | 'DONACION' | 'DEVOLUCION' | 'AJUSTE_POSITIVO',
  usuarioId: number | null,
  referencia: string | null
): Promise<void> => {
  const [prodRows] = await pool.execute(
    'SELECT stock_actual FROM gastro_productos WHERE id = ?',
    [productoId]
  )

  if ((prodRows as any[]).length === 0) {
    throw new Error('Producto no encontrado')
  }

  const stockActual = Number((prodRows as any[])[0].stock_actual) || 0
  const nuevoSaldo = stockActual + cantidad

  const conn = await pool.getConnection()
  try {
    await conn.beginTransaction()

    await conn.execute(
      `INSERT INTO gastro_movimientos_kardex (tipo, concepto, producto_id, lote_id, entrada, salida, saldo, costo_unitario, usuario_id, referencia)
       VALUES ('ENTRADA', ?, ?, ?, ?, 0, ?, ?, ?, ?)`,
      [concepto, productoId, loteId, cantidad, nuevoSaldo, costoUnitario, usuarioId, referencia]
    )

    await conn.execute(
      'UPDATE gastro_productos SET stock_actual = ? WHERE id = ?',
      [nuevoSaldo, productoId]
    )

    await conn.commit()
  } catch (error) {
    await conn.rollback()
    throw error
  } finally {
    conn.release()
  }
}

export const registrarSalidaPEPS = async (
  productoId: number,
  cantidad: number,
  concepto: 'CONSUMO' | 'MERMA' | 'VENCIDO' | 'AJUSTE_NEGATIVO',
  usuarioId: number | null,
  referencia: string | null
): Promise<void> => {
  const [prodRows] = await pool.execute(
    'SELECT stock_actual FROM gastro_productos WHERE id = ?',
    [productoId]
  )

  if ((prodRows as any[]).length === 0) {
    throw new Error('Producto no encontrado')
  }

  const stockActual = Number((prodRows as any[])[0].stock_actual) || 0

  if (cantidad > stockActual) {
    throw new Error(`Stock insuficiente. Disponible: ${stockActual}`)
  }

  const [lotes] = await pool.execute(
    `SELECT id, cantidad_disponible, costo_unitario, vencimiento
     FROM gastro_lotes
     WHERE producto_id = ? AND cantidad_disponible > 0 AND activo = 1
     ORDER BY fecha_ingreso ASC, id ASC`,
    [productoId]
  )

  const lotesDisponibles = lotes as any[]
  let restante = cantidad
  const nuevoSaldo = stockActual - cantidad

  const conn = await pool.getConnection()
  try {
    await conn.beginTransaction()

    for (const lote of lotesDisponibles) {
      if (restante <= 0) break

      const disponible = Number(lote.cantidad_disponible)
      const cantidadDesdeLote = Math.min(disponible, restante)
      const nuevoDisponible = disponible - cantidadDesdeLote
      restante -= cantidadDesdeLote

      await conn.execute(
        'UPDATE gastro_lotes SET cantidad_disponible = ? WHERE id = ?',
        [nuevoDisponible, lote.id]
      )

      await conn.execute(
        `INSERT INTO gastro_movimientos_kardex (tipo, concepto, producto_id, lote_id, entrada, salida, saldo, costo_unitario, usuario_id, referencia)
         VALUES ('SALIDA', ?, ?, ?, 0, ?, 0, ?, ?, ?)`,
        [concepto, productoId, lote.id, cantidadDesdeLote, lote.costo_unitario, usuarioId, referencia]
      )
    }

    await conn.execute(
      'UPDATE gastro_productos SET stock_actual = ? WHERE id = ?',
      [nuevoSaldo, productoId]
    )

    await conn.execute(
      `UPDATE gastro_movimientos_kardex
       SET saldo = ?
       WHERE producto_id = ?
         AND id = (SELECT MAX(id) FROM (SELECT id FROM gastro_movimientos_kardex WHERE producto_id = ?) t)`,
      [nuevoSaldo, productoId, productoId]
    )

    await conn.commit()
  } catch (error) {
    await conn.rollback()
    throw error
  } finally {
    conn.release()
  }
}

export const registrarAjusteFisico = async (
  productoId: number,
  diferencia: number,
  stockReal: number,
  usuarioId: number | null,
  referencia: string | null,
  connPool: any = pool
): Promise<void> => {
  if (diferencia === 0) return

  const tipo = diferencia > 0 ? 'ENTRADA' : 'SALIDA'
  const cantidad = Math.abs(diferencia)

  await connPool.execute(
    `INSERT INTO gastro_movimientos_kardex (tipo, concepto, producto_id, lote_id, entrada, salida, saldo, costo_unitario, usuario_id, referencia)
     VALUES (?, 'AJUSTE_POSITIVO', ?, NULL, ?, ?, ?, 0, ?, ?)`,
    [tipo, productoId,
     tipo === 'ENTRADA' ? cantidad : 0,
     tipo === 'SALIDA' ? cantidad : 0,
     stockReal,
     usuarioId,
     referencia]
  )

  await connPool.execute(
    'UPDATE gastro_productos SET stock_actual = ? WHERE id = ?',
    [stockReal, productoId]
  )
}
