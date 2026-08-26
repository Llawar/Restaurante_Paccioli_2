import { Request, Response } from 'express'
import pool from '../../Providers/DatabaseProvider'

export const getAll = async (_req: Request, res: Response): Promise<void> => {
  try {
    const query = `
      SELECT c.*, p.nombre as puesto_nombre
      FROM categorias c
      LEFT JOIN puestos_cocina p ON c.puesto_cocina_id = p.id
      WHERE c.activo = 1
      ORDER BY c.nombre ASC
    `
    const [rows] = await pool.execute(query)

    res.json({
      success: true,
      count: (rows as any[]).length,
      data: rows
    })
  } catch (error: any) {
    console.error('Error al obtener categorías:', error)
    res.status(500).json({
      success: false,
      message: 'Error al obtener categorías',
      error: error.message
    })
  }
}

export const getById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params

    const query = `
      SELECT c.*, p.nombre as puesto_nombre
      FROM categorias c
      LEFT JOIN puestos_cocina p ON c.puesto_cocina_id = p.id
      WHERE c.id = ? AND c.activo = 1
    `
    const [rows] = await pool.execute(query, [id])

    if ((rows as any[]).length === 0) {
      res.status(404).json({
        success: false,
        message: 'Categoría no encontrada'
      })
      return
    }

    res.json({
      success: true,
      data: (rows as any[])[0]
    })
  } catch (error: any) {
    console.error('Error al obtener categoría:', error)
    res.status(500).json({
      success: false,
      message: 'Error al obtener categoría',
      error: error.message
    })
  }
}

export const create = async (req: Request, res: Response): Promise<void> => {
  try {
    const { nombre, descripcion, icono, color, puesto_cocina_id } = req.body

    if (!nombre) {
      res.status(400).json({
        success: false,
        message: 'El nombre de la categoría es requerido'
      })
      return
    }

    const checkQuery = 'SELECT id FROM categorias WHERE nombre = ? AND activo = 1'
    const [existing] = await pool.execute(checkQuery, [nombre])

    if ((existing as any[]).length > 0) {
      res.status(409).json({
        success: false,
        message: 'Ya existe una categoría con ese nombre'
      })
      return
    }

    const insertQuery = `
      INSERT INTO categorias (nombre, descripcion, icono, color, puesto_cocina_id, activo, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, 1, NOW(), NOW())
    `

    const [result] = await pool.execute(insertQuery, [
      nombre,
      descripcion || null,
      icono || null,
      color || null,
      puesto_cocina_id || null
    ])

    if (global.io) {
      global.io.emit('categories:changed', { action: 'create', categoryId: (result as any).insertId })
    }

    res.status(201).json({
      success: true,
      message: 'Categoría creada exitosamente',
      data: {
        id: (result as any).insertId,
        nombre,
        descripcion,
        icono,
        color,
        puesto_cocina_id,
        activo: 1
      }
    })
  } catch (error: any) {
    console.error('Error al crear categoría:', error)
    res.status(500).json({
      success: false,
      message: 'Error al crear categoría',
      error: error.message
    })
  }
}

export const update = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params
    const { nombre, descripcion, icono, color, puesto_cocina_id } = req.body

    const checkQuery = 'SELECT id FROM categorias WHERE id = ? AND activo = 1'
    const [existing] = await pool.execute(checkQuery, [id])

    if ((existing as any[]).length === 0) {
      res.status(404).json({
        success: false,
        message: 'Categoría no encontrada'
      })
      return
    }

    if (nombre) {
      const duplicateQuery = 'SELECT id FROM categorias WHERE nombre = ? AND id != ? AND activo = 1'
      const [duplicate] = await pool.execute(duplicateQuery, [nombre, id])

      if ((duplicate as any[]).length > 0) {
        res.status(409).json({
          success: false,
          message: 'Ya existe otra categoría con ese nombre'
        })
        return
      }
    }

    const updateQuery = `
      UPDATE categorias
      SET nombre = COALESCE(?, nombre),
          descripcion = COALESCE(?, descripcion),
          icono = COALESCE(?, icono),
          color = COALESCE(?, color),
          puesto_cocina_id = COALESCE(?, puesto_cocina_id),
          updated_at = NOW()
      WHERE id = ? AND activo = 1
    `

    const [result] = await pool.execute(updateQuery, [
      nombre ?? null,
      descripcion ?? null,
      icono ?? null,
      color ?? null,
      puesto_cocina_id ?? null,
      id
    ])

    if ((result as any).affectedRows === 0) {
      res.status(400).json({
        success: false,
        message: 'No se pudo actualizar la categoría'
      })
      return
    }

    if (global.io) {
      global.io.emit('categories:changed', { action: 'update', categoryId: id })
    }

    res.json({
      success: true,
      message: 'Categoría actualizada exitosamente',
      data: { id, nombre, descripcion, icono, color, puesto_cocina_id }
    })
  } catch (error: any) {
    console.error('Error al actualizar categoría:', error)
    res.status(500).json({
      success: false,
      message: 'Error al actualizar categoría',
      error: error.message
    })
  }
}

export const remove = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params

    const checkQuery = 'SELECT id FROM categorias WHERE id = ? AND activo = 1'
    const [existing] = await pool.execute(checkQuery, [id])

    if ((existing as any[]).length === 0) {
      res.status(404).json({
        success: false,
        message: 'Categoría no encontrada'
      })
      return
    }

    const [productos] = await pool.execute(
      'SELECT id FROM productos WHERE categoria_id = ? AND activo = 1 LIMIT 1',
      [id]
    )

    if ((productos as any[]).length > 0) {
      res.status(409).json({
        success: false,
        message: 'No se puede eliminar la categoría porque tiene productos asociados'
      })
      return
    }

    const deleteQuery = 'UPDATE categorias SET activo = 0, updated_at = NOW() WHERE id = ?'
    const [result] = await pool.execute(deleteQuery, [id])

    if ((result as any).affectedRows === 0) {
      res.status(400).json({
        success: false,
        message: 'No se pudo eliminar la categoría'
      })
      return
    }

    if (global.io) {
      global.io.emit('categories:changed', { action: 'delete', categoryId: id })
    }

    res.json({
      success: true,
      message: 'Categoría eliminada exitosamente'
    })
  } catch (error: any) {
    console.error('Error al eliminar categoría:', error)
    res.status(500).json({
      success: false,
      message: 'Error al eliminar categoría',
      error: error.message
    })
  }
}
