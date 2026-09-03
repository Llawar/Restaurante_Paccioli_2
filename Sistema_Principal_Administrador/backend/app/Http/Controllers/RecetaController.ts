import { Request, Response } from 'express'
import pool from '../../Providers/DatabaseProvider'

export const getByProducto = async (req: Request, res: Response): Promise<void> => {
  try {
    const { productoId } = req.params
    const [rows] = await pool.execute(
      `SELECT r.*, p.nombre as producto_nombre
       FROM receta_detalle r
       LEFT JOIN productos p ON r.producto_id = p.id
       WHERE r.producto_id = ?`,
      [productoId]
    )
    res.json({ success: true, count: (rows as any[]).length, data: rows })
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Error al obtener receta', error: error.message })
  }
}

export const getAll = async (_req: Request, res: Response): Promise<void> => {
  try {
    const [rows] = await pool.execute(
      `SELECT r.*, p.nombre as producto_nombre
       FROM receta_detalle r
       LEFT JOIN productos p ON r.producto_id = p.id
       ORDER BY r.producto_id ASC`
    )
    res.json({ success: true, count: (rows as any[]).length, data: rows })
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Error al listar recetas', error: error.message })
  }
}

export const upsert = async (req: Request, res: Response): Promise<void> => {
  try {
    const { producto_id, gastro_producto_id, cantidad } = req.body
    if (!producto_id || !gastro_producto_id || !cantidad) {
      res.status(400).json({ success: false, message: 'producto_id, gastro_producto_id y cantidad son requeridos' })
      return
    }
    await pool.execute(
      `INSERT INTO receta_detalle (producto_id, gastro_producto_id, cantidad)
       VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE cantidad=VALUES(cantidad), updated_at=NOW()`,
      [producto_id, gastro_producto_id, cantidad]
    )
    res.status(201).json({ success: true, message: 'Receta guardada' })
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Error al guardar receta', error: error.message })
  }
}

export const remove = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params
    const [result] = await pool.execute('DELETE FROM receta_detalle WHERE id = ?', [id])
    if ((result as any).affectedRows === 0) {
      res.status(404).json({ success: false, message: 'Receta no encontrada' })
      return
    }
    res.json({ success: true, message: 'Receta eliminada' })
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Error al eliminar receta', error: error.message })
  }
}

// Para debugging: ver cola de sync
export const getCola = async (req: Request, res: Response): Promise<void> => {
  try {
    const { estado } = req.query
    let query = 'SELECT * FROM sync_consumo_cola'
    const params: any[] = []
    if (estado) {
      query += ' WHERE estado = ?'
      params.push(estado)
    }
    query += ' ORDER BY created_at DESC LIMIT 100'
    const [rows] = await pool.execute(query, params)
    res.json({ success: true, count: (rows as any[]).length, data: rows })
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Error al obtener cola', error: error.message })
  }
}

export const reintentarCola = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params
    await pool.execute(`UPDATE sync_consumo_cola SET estado='pendiente', updated_at=NOW() WHERE id=?`, [id])
    res.json({ success: true, message: 'Reencolado para reintento' })
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Error', error: error.message })
  }
}
