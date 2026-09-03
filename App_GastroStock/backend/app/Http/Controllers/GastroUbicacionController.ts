import { Request, Response } from 'express'
import pool from '../../Providers/DatabaseProvider'
import { registrarAuditoria } from '../../Services/AuditoriaService'

export const getAll = async (_req: Request, res: Response): Promise<void> => {
  try {
    const query = 'SELECT * FROM gastro_ubicaciones WHERE activo = 1 ORDER BY nombre ASC'
    const [rows] = await pool.execute(query)

    res.json({
      success: true,
      count: (rows as any[]).length,
      data: rows
    })
  } catch (error: any) {
    console.error('Error al obtener ubicaciones (GastroStock):', error)
    res.status(500).json({
      success: false,
      message: 'Error al obtener ubicaciones',
      error: error.message
    })
  }
}

export const create = async (req: Request, res: Response): Promise<void> => {
  try {
    const { nombre, tipo } = req.body

    if (!nombre) {
      res.status(400).json({
        success: false,
        message: 'El nombre de la ubicación es requerido'
      })
      return
    }

    const checkQuery = 'SELECT id FROM gastro_ubicaciones WHERE nombre = ? AND activo = 1'
    const [existing] = await pool.execute(checkQuery, [nombre])

    if ((existing as any[]).length > 0) {
      res.status(409).json({
        success: false,
        message: 'Ya existe una ubicación con ese nombre'
      })
      return
    }

    const insertQuery = `
      INSERT INTO gastro_ubicaciones (nombre, tipo, activo, created_at, updated_at)
      VALUES (?, ?, 1, NOW(), NOW())
    `

    const [result] = await pool.execute(insertQuery, [nombre, tipo || 'ESTANTERIA'])

    await registrarAuditoria(req.user?.id, 'CREAR_UBICACION', 'gastro_ubicaciones', (result as any).insertId, nombre)

    res.status(201).json({
      success: true,
      message: 'Ubicación creada exitosamente',
      data: { id: (result as any).insertId, nombre, tipo: tipo || 'ESTANTERIA', activo: 1 }
    })
  } catch (error: any) {
    console.error('Error al crear ubicación (GastroStock):', error)
    res.status(500).json({
      success: false,
      message: 'Error al crear ubicación',
      error: error.message
    })
  }
}

export const update = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params
    const { nombre, tipo } = req.body

    const checkQuery = 'SELECT id FROM gastro_ubicaciones WHERE id = ? AND activo = 1'
    const [existing] = await pool.execute(checkQuery, [id])

    if ((existing as any[]).length === 0) {
      res.status(404).json({
        success: false,
        message: 'Ubicación no encontrada'
      })
      return
    }

    await pool.execute(
      `UPDATE gastro_ubicaciones SET nombre = COALESCE(?, nombre), tipo = COALESCE(?, tipo), updated_at = NOW() WHERE id = ?`,
      [nombre ?? null, tipo ?? null, id]
    )

    await registrarAuditoria(req.user?.id, 'ACTUALIZAR_UBICACION', 'gastro_ubicaciones', Number(id))

    res.json({
      success: true,
      message: 'Ubicación actualizada exitosamente',
      data: { id, nombre, tipo }
    })
  } catch (error: any) {
    console.error('Error al actualizar ubicación (GastroStock):', error)
    res.status(500).json({
      success: false,
      message: 'Error al actualizar ubicación',
      error: error.message
    })
  }
}

export const remove = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params

    const checkQuery = 'SELECT id FROM gastro_ubicaciones WHERE id = ? AND activo = 1'
    const [existing] = await pool.execute(checkQuery, [id])

    if ((existing as any[]).length === 0) {
      res.status(404).json({
        success: false,
        message: 'Ubicación no encontrada'
      })
      return
    }

    await pool.execute('UPDATE gastro_ubicaciones SET activo = 0, updated_at = NOW() WHERE id = ?', [id])

    await registrarAuditoria(req.user?.id, 'ELIMINAR_UBICACION', 'gastro_ubicaciones', Number(id))

    res.json({
      success: true,
      message: 'Ubicación eliminada exitosamente'
    })
  } catch (error: any) {
    console.error('Error al eliminar ubicación (GastroStock):', error)
    res.status(500).json({
      success: false,
      message: 'Error al eliminar ubicación',
      error: error.message
    })
  }
}
