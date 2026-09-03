import { Request, Response } from 'express'
import pool from '../../Providers/DatabaseProvider'
import { registrarAuditoria } from '../../Services/AuditoriaService'

export const getAll = async (_req: Request, res: Response): Promise<void> => {
  try {
    const query = 'SELECT * FROM gastro_unidades_medida WHERE activo = 1 ORDER BY nombre ASC'
    const [rows] = await pool.execute(query)

    res.json({
      success: true,
      count: (rows as any[]).length,
      data: rows
    })
  } catch (error: any) {
    console.error('Error al obtener unidades (GastroStock):', error)
    res.status(500).json({
      success: false,
      message: 'Error al obtener unidades de medida',
      error: error.message
    })
  }
}

export const create = async (req: Request, res: Response): Promise<void> => {
  try {
    const { nombre, abreviatura } = req.body

    if (!nombre || !abreviatura) {
      res.status(400).json({
        success: false,
        message: 'Nombre y abreviatura son requeridos'
      })
      return
    }

    const checkQuery = 'SELECT id FROM gastro_unidades_medida WHERE abreviatura = ? AND activo = 1'
    const [existing] = await pool.execute(checkQuery, [abreviatura])

    if ((existing as any[]).length > 0) {
      res.status(409).json({
        success: false,
        message: 'Ya existe una unidad con esa abreviatura'
      })
      return
    }

    const insertQuery = `
      INSERT INTO gastro_unidades_medida (nombre, abreviatura, activo, created_at, updated_at)
      VALUES (?, ?, 1, NOW(), NOW())
    `

    const [result] = await pool.execute(insertQuery, [nombre, abreviatura])

    await registrarAuditoria(req.user?.id, 'CREAR_UNIDAD', 'gastro_unidades_medida', (result as any).insertId, nombre)

    res.status(201).json({
      success: true,
      message: 'Unidad de medida creada exitosamente',
      data: { id: (result as any).insertId, nombre, abreviatura, activo: 1 }
    })
  } catch (error: any) {
    console.error('Error al crear unidad (GastroStock):', error)
    res.status(500).json({
      success: false,
      message: 'Error al crear unidad de medida',
      error: error.message
    })
  }
}

export const update = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params
    const { nombre, abreviatura } = req.body

    const checkQuery = 'SELECT id FROM gastro_unidades_medida WHERE id = ? AND activo = 1'
    const [existing] = await pool.execute(checkQuery, [id])

    if ((existing as any[]).length === 0) {
      res.status(404).json({
        success: false,
        message: 'Unidad de medida no encontrada'
      })
      return
    }

    const updateQuery = `
      UPDATE gastro_unidades_medida
      SET nombre = COALESCE(?, nombre),
          abreviatura = COALESCE(?, abreviatura),
          updated_at = NOW()
      WHERE id = ? AND activo = 1
    `

    await pool.execute(updateQuery, [nombre ?? null, abreviatura ?? null, id])

    await registrarAuditoria(req.user?.id, 'ACTUALIZAR_UNIDAD', 'gastro_unidades_medida', Number(id))

    res.json({
      success: true,
      message: 'Unidad de medida actualizada exitosamente',
      data: { id, nombre, abreviatura }
    })
  } catch (error: any) {
    console.error('Error al actualizar unidad (GastroStock):', error)
    res.status(500).json({
      success: false,
      message: 'Error al actualizar unidad de medida',
      error: error.message
    })
  }
}

export const remove = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params

    const checkQuery = 'SELECT id FROM gastro_unidades_medida WHERE id = ? AND activo = 1'
    const [existing] = await pool.execute(checkQuery, [id])

    if ((existing as any[]).length === 0) {
      res.status(404).json({
        success: false,
        message: 'Unidad de medida no encontrada'
      })
      return
    }

    await pool.execute('UPDATE gastro_unidades_medida SET activo = 0, updated_at = NOW() WHERE id = ?', [id])

    await registrarAuditoria(req.user?.id, 'ELIMINAR_UNIDAD', 'gastro_unidades_medida', Number(id))

    res.json({
      success: true,
      message: 'Unidad de medida eliminada exitosamente'
    })
  } catch (error: any) {
    console.error('Error al eliminar unidad (GastroStock):', error)
    res.status(500).json({
      success: false,
      message: 'Error al eliminar unidad de medida',
      error: error.message
    })
  }
}
