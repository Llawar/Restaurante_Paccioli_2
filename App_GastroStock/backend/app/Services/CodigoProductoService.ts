import pool from '../Providers/DatabaseProvider'

export interface CodigoInfo {
  categoriaCodigo: string
  subcategoriaCodigo: string
}

export const obtenerCodigosSubcategoria = async (subcategoriaId: number): Promise<CodigoInfo | null> => {
  const query = `
    SELECT sc.codigo as subcat_codigo, c.codigo as cat_codigo
    FROM gastro_subcategorias sc
    LEFT JOIN gastro_categorias c ON sc.categoria_id = c.id
    WHERE sc.id = ?
  `
  const [rows] = await pool.execute(query, [subcategoriaId])

  if ((rows as any[]).length === 0) return null

  const row = (rows as any[])[0]
  return {
    categoriaCodigo: row.cat_codigo,
    subcategoriaCodigo: row.subcat_codigo
  }
}

export const generarCodigoProducto = async (subcategoriaId: number): Promise<string> => {
  const codigos = await obtenerCodigosSubcategoria(subcategoriaId)

  if (!codigos) {
    throw new Error('Subcategoría no encontrada')
  }

  const prefijo = `${codigos.categoriaCodigo}-${codigos.subcategoriaCodigo}-`

  const query = `
    SELECT codigo FROM gastro_productos
    WHERE codigo LIKE ? AND activo = 1
    ORDER BY codigo DESC
    LIMIT 1
  `
  const [rows] = await pool.execute(query, [`${prefijo}%`])

  let siguiente = 1

  if ((rows as any[]).length > 0) {
    const ultimo = (rows as any[])[0].codigo
    const numStr = ultimo.split('-').pop()
    const num = parseInt(numStr, 10)
    if (!isNaN(num)) {
      siguiente = num + 1
    }
  }

  return `${prefijo}${String(siguiente).padStart(4, '0')}`
}
