import { Request, Response } from 'express'
import pool from '../../Providers/DatabaseProvider'

export const getByProducto = async (req: Request, res: Response): Promise<void> => {
  try {
    const { productoId } = req.params

    const query = `
      SELECT l.*, p.nombre as producto_nombre, p.codigo as producto_codigo, pr.nombre as proveedor_nombre
      FROM gastro_lotes l
      LEFT JOIN gastro_productos p ON l.producto_id = p.id
      LEFT JOIN gastro_detalle_compras dc ON l.detalle_compra_id = dc.id
      LEFT JOIN gastro_compras c ON dc.compra_id = c.id
      LEFT JOIN gastro_proveedores pr ON c.proveedor_id = pr.id
      WHERE l.producto_id = ? AND l.activo = 1
      ORDER BY l.fecha_ingreso ASC, l.id ASC
    `
    const [rows] = await pool.execute(query, [productoId])

    res.json({
      success: true,
      count: (rows as any[]).length,
      data: rows
    })
  } catch (error: any) {
    console.error('Error al obtener lotes (GastroStock):', error)
    res.status(500).json({
      success: false,
      message: 'Error al obtener lotes',
      error: error.message
    })
  }
}

export const getAll = async (_req: Request, res: Response): Promise<void> => {
  try {
    const query = `
      SELECT l.*, p.nombre as producto_nombre, p.codigo as producto_codigo, pr.nombre as proveedor_nombre
      FROM gastro_lotes l
      LEFT JOIN gastro_productos p ON l.producto_id = p.id
      LEFT JOIN gastro_detalle_compras dc ON l.detalle_compra_id = dc.id
      LEFT JOIN gastro_compras c ON dc.compra_id = c.id
      LEFT JOIN gastro_proveedores pr ON c.proveedor_id = pr.id
      WHERE l.activo = 1
      ORDER BY l.fecha_ingreso DESC, l.id DESC
    `
    const [rows] = await pool.execute(query)

    res.json({
      success: true,
      count: (rows as any[]).length,
      data: rows
    })
  } catch (error: any) {
    console.error('Error al obtener lotes (GastroStock):', error)
    res.status(500).json({
      success: false,
      message: 'Error al obtener lotes',
      error: error.message
    })
  }
}
