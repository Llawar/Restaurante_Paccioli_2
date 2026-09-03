import { Request, Response } from 'express'
import pool from '../../Providers/DatabaseProvider'

export const getResumen = async (_req: Request, res: Response): Promise<void> => {
  try {
    const [productos] = await pool.execute(
      'SELECT COUNT(*) as total, SUM(CASE WHEN stock_actual <= stock_minimo AND stock_actual > 0 THEN 1 ELSE 0 END) as stock_bajo, SUM(CASE WHEN stock_actual <= 0 THEN 1 ELSE 0 END) as agotados FROM gastro_productos WHERE activo = 1'
    )

    const [categorias] = await pool.execute(
      'SELECT COUNT(*) as total FROM gastro_categorias WHERE activo = 1'
    )

    const [proveedores] = await pool.execute(
      'SELECT COUNT(*) as total FROM gastro_proveedores WHERE activo = 1'
    )

    const [valorInventario] = await pool.execute(`
      SELECT COALESCE(SUM(l.cantidad_disponible * l.costo_unitario), 0) as valor
      FROM gastro_lotes l
      WHERE l.activo = 1 AND l.cantidad_disponible > 0
    `)

    const [proximoVencer] = await pool.execute(`
      SELECT COUNT(*) as total FROM gastro_lotes
      WHERE activo = 1 AND cantidad_disponible > 0
        AND vencimiento IS NOT NULL
        AND vencimiento BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 30 DAY)
    `)

    const [movimientosHoy] = await pool.execute(`
      SELECT COUNT(*) as total FROM gastro_movimientos_kardex
      WHERE DATE(fecha) = CURDATE()
    `)

    res.json({
      success: true,
      data: {
        productos: (productos as any[])[0],
        categorias: (categorias as any[])[0].total,
        proveedores: (proveedores as any[])[0].total,
        valor_inventario: (valorInventario as any[])[0]?.valor || 0,
        proximo_vencer: (proximoVencer as any[])[0].total,
        movimientos_hoy: (movimientosHoy as any[])[0].total
      }
    })
  } catch (error: any) {
    console.error('Error al obtener resumen (GastroStock):', error)
    res.status(500).json({
      success: false,
      message: 'Error al obtener resumen',
      error: error.message
    })
  }
}

export const getComprasRecientes = async (_req: Request, res: Response): Promise<void> => {
  try {
    const query = `
      SELECT c.*, p.nombre as proveedor_nombre
      FROM gastro_compras c
      LEFT JOIN gastro_proveedores p ON c.proveedor_id = p.id
      WHERE c.activo = 1
      ORDER BY c.fecha DESC
      LIMIT 10
    `
    const [rows] = await pool.execute(query)

    res.json({
      success: true,
      data: rows
    })
  } catch (error: any) {
    console.error('Error al obtener compras recientes (GastroStock):', error)
    res.status(500).json({
      success: false,
      message: 'Error al obtener compras recientes',
      error: error.message
    })
  }
}

export const getMovimientosRecientes = async (_req: Request, res: Response): Promise<void> => {
  try {
    const query = `
      SELECT k.*, p.nombre as producto_nombre, NULL as usuario_nombre
      FROM gastro_movimientos_kardex k
      LEFT JOIN gastro_productos p ON k.producto_id = p.id
      ORDER BY k.fecha DESC
      LIMIT 15
    `
    const [rows] = await pool.execute(query)

    res.json({
      success: true,
      data: rows
    })
  } catch (error: any) {
    console.error('Error al obtener movimientos recientes (GastroStock):', error)
    res.status(500).json({
      success: false,
      message: 'Error al obtener movimientos recientes',
      error: error.message
    })
  }
}

export const getStockBajo = async (_req: Request, res: Response): Promise<void> => {
  try {
    const query = `
      SELECT p.*, um.abreviatura as unidad
      FROM gastro_productos p
      LEFT JOIN gastro_unidades_medida um ON p.unidad_id = um.id
      WHERE p.activo = 1 AND p.stock_actual <= p.stock_minimo
      ORDER BY (p.stock_actual / NULLIF(p.stock_minimo, 0)) ASC
      LIMIT 10
    `
    const [rows] = await pool.execute(query)

    res.json({
      success: true,
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
