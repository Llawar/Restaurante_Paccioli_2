import { Request, Response } from 'express'
import pool from '../../Providers/DatabaseProvider'

export const getAll = async (_req: Request, res: Response): Promise<void> => {
  try {
    const query = `
      SELECT a.*, p.nombre as producto_nombre, p.codigo as producto_codigo, p.stock_actual
      FROM gastro_alertas a
      LEFT JOIN gastro_productos p ON a.producto_id = p.id
      WHERE a.leida = 0
      ORDER BY a.created_at DESC
    `
    const [rows] = await pool.execute(query)

    res.json({
      success: true,
      count: (rows as any[]).length,
      data: rows
    })
  } catch (error: any) {
    console.error('Error al obtener alertas (GastroStock):', error)
    res.status(500).json({
      success: false,
      message: 'Error al obtener alertas',
      error: error.message
    })
  }
}

export const getStockBajo = async (_req: Request, res: Response): Promise<void> => {
  try {
    const query = `
      SELECT p.*, sc.nombre as subcategoria_nombre, c.nombre as categoria_nombre, um.abreviatura as unidad
      FROM gastro_productos p
      LEFT JOIN gastro_subcategorias sc ON p.subcategoria_id = sc.id
      LEFT JOIN gastro_categorias c ON sc.categoria_id = c.id
      LEFT JOIN gastro_unidades_medida um ON p.unidad_id = um.id
      WHERE p.activo = 1 AND p.stock_actual <= p.stock_minimo
      ORDER BY (p.stock_actual / NULLIF(p.stock_minimo, 0)) ASC
    `
    const [rows] = await pool.execute(query)

    res.json({
      success: true,
      count: (rows as any[]).length,
      data: rows
    })
  } catch (error: any) {
    console.error('Error al obtener stock bajo (GastroStock):', error)
    res.status(500).json({
      success: false,
      message: 'Error al obtener stock bajo',
      error: error.message
    })
  }
}

export const getProximoVencer = async (_req: Request, res: Response): Promise<void> => {
  try {
    const query = `
      SELECT l.*, p.nombre as producto_nombre, p.codigo as producto_codigo, um.abreviatura as unidad
      FROM gastro_lotes l
      LEFT JOIN gastro_productos p ON l.producto_id = p.id
      LEFT JOIN gastro_unidades_medida um ON p.unidad_id = um.id
      WHERE l.activo = 1 AND l.cantidad_disponible > 0
        AND l.vencimiento IS NOT NULL
        AND l.vencimiento BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 30 DAY)
      ORDER BY l.vencimiento ASC
    `
    const [rows] = await pool.execute(query)

    res.json({
      success: true,
      count: (rows as any[]).length,
      data: rows
    })
  } catch (error: any) {
    console.error('Error al obtener productos próximos a vencer (GastroStock):', error)
    res.status(500).json({
      success: false,
      message: 'Error al obtener productos próximos a vencer',
      error: error.message
    })
  }
}

export const marcarLeidas = async (req: Request, res: Response): Promise<void> => {
  try {
    await pool.execute('UPDATE gastro_alertas SET leida = 1 WHERE leida = 0')

    res.json({
      success: true,
      message: 'Alertas marcadas como leídas'
    })
  } catch (error: any) {
    console.error('Error al marcar alertas (GastroStock):', error)
    res.status(500).json({
      success: false,
      message: 'Error al marcar alertas',
      error: error.message
    })
  }
}
