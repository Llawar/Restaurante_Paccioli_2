import { Request, Response } from 'express'
import pool from '../../Providers/DatabaseProvider'
import { hashPassword } from './AuthController'

export const getAll = async (_req: Request, res: Response): Promise<void> => {
  try {
    const query = `
      SELECT id, nombre, usuario, email, rol, activo, created_at, updated_at
      FROM usuarios
      ORDER BY nombre ASC
    `
    const [rows] = await pool.execute(query)

    res.json({
      success: true,
      count: (rows as any[]).length,
      data: rows
    })
  } catch (error: any) {
    console.error('Error al obtener usuarios:', error)
    res.status(500).json({
      success: false,
      message: 'Error al obtener usuarios',
      error: error.message
    })
  }
}

export const getById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params

    const query = `
      SELECT id, nombre, usuario, email, rol, activo, created_at, updated_at
      FROM usuarios WHERE id = ?
    `
    const [rows] = await pool.execute(query, [id])

    if ((rows as any[]).length === 0) {
      res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      })
      return
    }

    res.json({
      success: true,
      data: (rows as any[])[0]
    })
  } catch (error: any) {
    console.error('Error al obtener usuario:', error)
    res.status(500).json({
      success: false,
      message: 'Error al obtener usuario',
      error: error.message
    })
  }
}

export const update = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params
    const { nombre, email, rol, activo } = req.body

    const checkQuery = 'SELECT id FROM usuarios WHERE id = ?'
    const [existing] = await pool.execute(checkQuery, [id])

    if ((existing as any[]).length === 0) {
      res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      })
      return
    }

    const updateQuery = `
      UPDATE usuarios
      SET nombre = COALESCE(?, nombre),
          email = COALESCE(?, email),
          rol = COALESCE(?, rol),
          activo = COALESCE(?, activo),
          updated_at = NOW()
      WHERE id = ?
    `

    await pool.execute(updateQuery, [
      nombre || null,
      email || null,
      rol || null,
      activo ?? null,
      id
    ])

    res.json({
      success: true,
      message: 'Usuario actualizado exitosamente'
    })
  } catch (error: any) {
    console.error('Error al actualizar usuario:', error)
    res.status(500).json({
      success: false,
      message: 'Error al actualizar usuario',
      error: error.message
    })
  }
}

export const remove = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params

    const updateQuery = 'UPDATE usuarios SET activo = 0, updated_at = NOW() WHERE id = ? AND activo = 1'
    const [result] = await pool.execute(updateQuery, [id])

    if ((result as any).affectedRows === 0) {
      res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      })
      return
    }

    res.json({
      success: true,
      message: 'Usuario desactivado correctamente'
    })
  } catch (error: any) {
    console.error('Error al eliminar usuario:', error)
    res.status(500).json({
      success: false,
      message: 'Error al eliminar usuario',
      error: error.message
    })
  }
}

export const updatePassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params
    const { password } = req.body

    if (!password) {
      res.status(400).json({
        success: false,
        message: 'La contraseña es requerida'
      })
      return
    }

    const hashedPassword = await hashPassword(password)

    const updateQuery = 'UPDATE usuarios SET password = ?, updated_at = NOW() WHERE id = ?'
    const [result] = await pool.execute(updateQuery, [hashedPassword, id])

    if ((result as any).affectedRows === 0) {
      res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      })
      return
    }

    res.json({
      success: true,
      message: 'Contraseña actualizada exitosamente'
    })
  } catch (error: any) {
    console.error('Error al actualizar contraseña:', error)
    res.status(500).json({
      success: false,
      message: 'Error al actualizar contraseña',
      error: error.message
    })
  }
}
