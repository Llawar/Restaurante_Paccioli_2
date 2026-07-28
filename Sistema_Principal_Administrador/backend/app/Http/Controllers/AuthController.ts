import { Request, Response } from 'express'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import pool from '../../Providers/DatabaseProvider'
import config from '../../../config/app'

const hashPassword = async (password: string): Promise<string> => {
  const saltRounds = 10
  return await bcrypt.hash(password, saltRounds)
}

const comparePassword = async (password: string, hashedPassword: string): Promise<boolean> => {
  return await bcrypt.compare(password, hashedPassword)
}

const generateToken = (user: { id: number; usuario: string; nombre: string; rol: string }): string => {
  const payload = {
    id: user.id,
    usuario: user.usuario,
    nombre: user.nombre,
    rol: user.rol
  }

  return jwt.sign(payload, config.jwtSecret, { expiresIn: config.jwtExpiresIn } as jwt.SignOptions)
}

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { usuario, password } = req.body

    if (!usuario || !password) {
      res.status(400).json({
        success: false,
        message: 'Usuario y contraseña son requeridos'
      })
      return
    }

    const query = 'SELECT * FROM usuarios WHERE usuario = ? AND activo = 1'
    const [rows] = await pool.execute(query, [usuario])

    if ((rows as any[]).length === 0) {
      res.status(401).json({
        success: false,
        message: 'Credenciales inválidas'
      })
      return
    }

    const user = (rows as any[])[0]
    const isPasswordValid = await comparePassword(password, user.password)

    if (!isPasswordValid) {
      res.status(401).json({
        success: false,
        message: 'Credenciales inválidas'
      })
      return
    }

    const token = generateToken(user)

    res.json({
      success: true,
      message: 'Inicio de sesión exitoso',
      data: {
        token,
        user: {
          id: user.id,
          nombre: user.nombre,
          usuario: user.usuario,
          rol: user.rol,
          email: user.email
        }
      }
    })
  } catch (error: any) {
    console.error('Error en login:', error)
    res.status(500).json({
      success: false,
      message: 'Error al iniciar sesión',
      error: error.message
    })
  }
}

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { nombre, usuario, password, email, rol = 'empleado' } = req.body

    if (!nombre || !usuario || !password) {
      res.status(400).json({
        success: false,
        message: 'Nombre, usuario y contraseña son requeridos'
      })
      return
    }

    const checkQuery = 'SELECT id FROM usuarios WHERE usuario = ? OR email = ?'
    const [existing] = await pool.execute(checkQuery, [usuario, email])

    if ((existing as any[]).length > 0) {
      res.status(409).json({
        success: false,
        message: 'El usuario o email ya existe'
      })
      return
    }

    const hashedPassword = await hashPassword(password)

    const insertQuery = `
      INSERT INTO usuarios (nombre, usuario, password, email, rol, activo, created_at)
      VALUES (?, ?, ?, ?, ?, 1, NOW())
    `

    const [result] = await pool.execute(insertQuery, [
      nombre,
      usuario,
      hashedPassword,
      email,
      rol
    ])

    res.status(201).json({
      success: true,
      message: 'Usuario creado exitosamente',
      data: {
        id: (result as any).insertId,
        nombre,
        usuario,
        email,
        rol
      }
    })
  } catch (error: any) {
    console.error('Error en registro:', error)
    res.status(500).json({
      success: false,
      message: 'Error al crear usuario',
      error: error.message
    })
  }
}

export const getProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id

    const query = 'SELECT id, nombre, usuario, email, rol, activo, created_at FROM usuarios WHERE id = ?'
    const [rows] = await pool.execute(query, [userId])

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
    console.error('Error al obtener perfil:', error)
    res.status(500).json({
      success: false,
      message: 'Error al obtener perfil',
      error: error.message
    })
  }
}

export { hashPassword, comparePassword, generateToken }
