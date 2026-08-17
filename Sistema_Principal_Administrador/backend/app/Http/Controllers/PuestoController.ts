import { Request, Response } from 'express'
import pool from '../../Providers/DatabaseProvider'

export const getAll = async (_req: Request, res: Response): Promise<void> => {
  try {
    const query = `
      SELECT pc.*,
        GROUP_CONCAT(c.nombre) as categorias_asignadas
      FROM puestos_cocina pc
      LEFT JOIN categorias c ON pc.id = c.puesto_cocina_id AND c.activo = 1
      WHERE pc.activo = 1
      GROUP BY pc.id
      ORDER BY pc.id
    `
    const [rows] = await pool.execute(query)

    res.json({
      success: true,
      count: (rows as any[]).length,
      data: rows
    })
  } catch (error: any) {
    console.error('Error al obtener puestos:', error)
    res.status(500).json({
      success: false,
      message: 'Error al obtener puestos de cocina'
    })
  }
}

export const getById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params

    const query = `
      SELECT pc.*,
        GROUP_CONCAT(c.nombre) as categorias_asignadas
      FROM puestos_cocina pc
      LEFT JOIN categorias c ON pc.id = c.puesto_cocina_id AND c.activo = 1
      WHERE pc.id = ? AND pc.activo = 1
      GROUP BY pc.id
    `
    const [rows] = await pool.execute(query, [id])

    if ((rows as any[]).length === 0) {
      res.status(404).json({
        success: false,
        message: 'Puesto no encontrado'
      })
      return
    }

    res.json({
      success: true,
      data: (rows as any[])[0]
    })
  } catch (error: any) {
    console.error('Error al obtener puesto:', error)
    res.status(500).json({
      success: false,
      message: 'Error al obtener puesto',
      error: error.message
    })
  }
}

export const create = async (req: Request, res: Response): Promise<void> => {
  try {
    const { nombre, descripcion } = req.body

    if (!nombre) {
      res.status(400).json({
        success: false,
        message: 'El nombre del puesto es requerido'
      })
      return
    }

    const checkQuery = 'SELECT id FROM puestos_cocina WHERE nombre = ? AND activo = 1'
    const [existing] = await pool.execute(checkQuery, [nombre])

    if ((existing as any[]).length > 0) {
      res.status(409).json({
        success: false,
        message: 'Ya existe un puesto con ese nombre'
      })
      return
    }

    const insertQuery = `
      INSERT INTO puestos_cocina (nombre, descripcion, activo, created_at, updated_at)
      VALUES (?, ?, 1, NOW(), NOW())
    `

    const [result] = await pool.execute(insertQuery, [nombre, descripcion || null])

    if (global.io) {
      global.io.emit('puestos:changed', { action: 'create', puestoId: (result as any).insertId })
    }

    res.status(201).json({
      success: true,
      message: 'Puesto creado exitosamente',
      data: {
        id: (result as any).insertId,
        nombre,
        descripcion,
        activo: 1
      }
    })
  } catch (error: any) {
    console.error('Error al crear puesto:', error)
    res.status(500).json({
      success: false,
      message: 'Error al crear puesto',
      error: error.message
    })
  }
}

export const update = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params
    // Nota: activo/estado se mantiene fijo (decisión: no cambiar activo/inactivo de puestos)
    const { nombre, descripcion } = req.body

    const checkQuery = 'SELECT id FROM puestos_cocina WHERE id = ? AND activo = 1'
    const [existing] = await pool.execute(checkQuery, [id])

    if ((existing as any[]).length === 0) {
      res.status(404).json({
        success: false,
        message: 'Puesto no encontrado'
      })
      return
    }

    if (nombre) {
      const duplicateQuery = 'SELECT id FROM puestos_cocina WHERE nombre = ? AND id != ? AND activo = 1'
      const [duplicate] = await pool.execute(duplicateQuery, [nombre, id])

      if ((duplicate as any[]).length > 0) {
        res.status(409).json({
          success: false,
          message: 'Ya existe otro puesto con ese nombre'
        })
        return
      }
    }

    const updateQuery = `
      UPDATE puestos_cocina
      SET nombre = COALESCE(?, nombre),
          descripcion = COALESCE(?, descripcion),
          updated_at = NOW()
      WHERE id = ? AND activo = 1
    `

    const [result] = await pool.execute(updateQuery, [nombre ?? null, descripcion ?? null, id])

    if ((result as any).affectedRows === 0) {
      res.status(400).json({
        success: false,
        message: 'No se pudo actualizar el puesto'
      })
      return
    }

    if (global.io) {
      global.io.emit('puestos:changed', { action: 'update', puestoId: id })
    }

    res.json({
      success: true,
      message: 'Puesto actualizado exitosamente',
      data: { id, nombre, descripcion }
    })
  } catch (error: any) {
    console.error('Error al actualizar puesto:', error)
    res.status(500).json({
      success: false,
      message: 'Error al actualizar puesto',
      error: error.message
    })
  }
}

export const remove = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params

    const checkQuery = 'SELECT id FROM puestos_cocina WHERE id = ? AND activo = 1'
    const [existing] = await pool.execute(checkQuery, [id])

    if ((existing as any[]).length === 0) {
      res.status(404).json({
        success: false,
        message: 'Puesto no encontrado'
      })
      return
    }

    const [categorias] = await pool.execute(
      'SELECT id FROM categorias WHERE puesto_cocina_id = ? AND activo = 1 LIMIT 1',
      [id]
    )

    if ((categorias as any[]).length > 0) {
      res.status(409).json({
        success: false,
        message: 'No se puede eliminar el puesto porque tiene categorías asignadas. Reasigna o elimina sus categorías primero.'
      })
      return
    }

    const deleteQuery = 'UPDATE puestos_cocina SET activo = 0, updated_at = NOW() WHERE id = ?'
    const [result] = await pool.execute(deleteQuery, [id])

    if ((result as any).affectedRows === 0) {
      res.status(400).json({
        success: false,
        message: 'No se pudo eliminar el puesto'
      })
      return
    }

    if (global.io) {
      global.io.emit('puestos:changed', { action: 'delete', puestoId: id })
    }

    res.json({
      success: true,
      message: 'Puesto eliminado exitosamente'
    })
  } catch (error: any) {
    console.error('Error al eliminar puesto:', error)
    res.status(500).json({
      success: false,
      message: 'Error al eliminar puesto',
      error: error.message
    })
  }
}

export const toggleStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params

    const [categorias] = await pool.execute(
      'SELECT id FROM categorias WHERE puesto_cocina_id = ? AND activo = 1 LIMIT 1',
      [id]
    )

    if ((categorias as any[]).length > 0) {
      res.status(409).json({
        success: false,
        message: 'No se puede desactivar el puesto porque tiene categorías asignadas activas.'
      })
      return
    }

    const updateQuery = 'UPDATE puestos_cocina SET activo = IF(activo = 1, 0, 1), updated_at = NOW() WHERE id = ?'
    const [result] = await pool.execute(updateQuery, [id])

    if ((result as any).affectedRows === 0) {
      res.status(404).json({
        success: false,
        message: 'Puesto no encontrado'
      })
      return
    }

    const [rows] = await pool.execute('SELECT activo FROM puestos_cocina WHERE id = ?', [id])
    const activo = (rows as any[])[0]?.activo ?? 1

    if (global.io) {
      global.io.emit('puestos:changed', { action: 'toggle', puestoId: id, activo })
    }

    res.json({
      success: true,
      message: activo ? 'Puesto activado' : 'Puesto desactivado',
      data: { id, activo }
    })
  } catch (error: any) {
    console.error('Error al cambiar estado del puesto:', error)
    res.status(500).json({
      success: false,
      message: 'Error al cambiar estado del puesto',
      error: error.message
    })
  }
}