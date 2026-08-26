import { Request, Response } from 'express'
import pool from '../../Providers/DatabaseProvider'
import { hashPassword } from './AuthController'

export const getAll = async (_req: Request, res: Response): Promise<void> => {
  try {
    const query = `
      SELECT u.id, u.nombre, u.usuario, u.email, u.rol, u.puesto_cocina_id, u.activo, u.created_at, u.updated_at,
             p.nombre as puesto_nombre
      FROM usuarios u
      LEFT JOIN puestos_cocina p ON u.puesto_cocina_id = p.id
      ORDER BY u.nombre ASC
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
      SELECT u.id, u.nombre, u.usuario, u.email, u.rol, u.puesto_cocina_id, u.activo, u.created_at, u.updated_at,
             p.nombre as puesto_nombre
      FROM usuarios u
      LEFT JOIN puestos_cocina p ON u.puesto_cocina_id = p.id
      WHERE u.id = ?
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

export const create = async (req: Request, res: Response): Promise<void> => {
  try {
    const { nombre, usuario, password, email, rol = 'empleado', activo = 1, puesto_cocina_id = null } = req.body

    if (!nombre || !usuario || !password) {
      res.status(400).json({
        success: false,
        message: 'Nombre, usuario y contraseña son requeridos'
      })
      return
    }

    const checkQuery = 'SELECT id FROM usuarios WHERE usuario = ? OR (email IS NOT NULL AND email = ?)'
    const [existing] = await pool.execute(checkQuery, [usuario, email || null])

    if ((existing as any[]).length > 0) {
      res.status(409).json({
        success: false,
        message: 'El usuario o email ya existe'
      })
      return
    }

    const hashedPassword = await hashPassword(password)

    const insertQuery = `
      INSERT INTO usuarios (nombre, usuario, password, email, rol, puesto_cocina_id, activo, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
    `

    const [result] = await pool.execute(insertQuery, [
      nombre,
      usuario,
      hashedPassword,
      email || null,
      rol,
      puesto_cocina_id || null,
      activo
    ])

    if (global.io) {
      global.io.emit('usuarios:changed', { action: 'create', userId: (result as any).insertId })
    }

    res.status(201).json({
      success: true,
      message: 'Usuario creado exitosamente',
      data: {
        id: (result as any).insertId,
        nombre,
        usuario,
        email,
        rol,
        puesto_cocina_id,
        activo
      }
    })
  } catch (error: any) {
    console.error('Error al crear usuario:', error)
    res.status(500).json({
      success: false,
      message: 'Error al crear usuario',
      error: error.message
    })
  }
}

export const toggleStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params

    const updateQuery = 'UPDATE usuarios SET activo = IF(activo = 1, 0, 1), updated_at = NOW() WHERE id = ?'
    const [result] = await pool.execute(updateQuery, [id])

    if ((result as any).affectedRows === 0) {
      res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      })
      return
    }

    const [rows] = await pool.execute('SELECT activo FROM usuarios WHERE id = ?', [id])
    const activo = (rows as any[])[0]?.activo ?? 1

    if (global.io) {
      global.io.emit('usuarios:changed', { action: 'toggle', userId: id, activo })
    }

    res.json({
      success: true,
      message: activo ? 'Usuario activado' : 'Usuario desactivado',
      data: { id, activo }
    })
  } catch (error: any) {
    console.error('Error al cambiar estado del usuario:', error)
    res.status(500).json({
      success: false,
      message: 'Error al cambiar estado del usuario',
      error: error.message
    })
  }
}

export const update = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params
    const { nombre, email, rol, activo, puesto_cocina_id } = req.body

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
          puesto_cocina_id = COALESCE(?, puesto_cocina_id),
          activo = COALESCE(?, activo),
          updated_at = NOW()
      WHERE id = ?
    `

    await pool.execute(updateQuery, [
      nombre || null,
      email || null,
      rol || null,
      puesto_cocina_id ?? null,
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
