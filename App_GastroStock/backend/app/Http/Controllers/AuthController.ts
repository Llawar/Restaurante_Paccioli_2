import { Request, Response } from 'express'
import config from '../../../config/app'

// SSO centralizado: GastroStock no tiene tabla usuarios.
// Este controller hace proxy al Sistema Principal (única fuente de verdad).
const PRINCIPAL_AUTH_URL = process.env.PRINCIPAL_API_URL || 'http://localhost:3006/api/auth/login'

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

    // Proxy al Sistema Principal - única BD con usuarios
    const response = await fetch(PRINCIPAL_AUTH_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ usuario, password })
    })

    const data = await response.json() as any

    // Reenviar exactamente lo que devuelve el Principal (status + body)
    // El token viene firmado con el mismo JWT_SECRET, por lo que verifyToken en Gastro lo aceptará
    res.status(response.status).json(data)
  } catch (error: any) {
    console.error('Error en login proxy GastroStock -> Principal:', error)
    // Si el Principal está caído, informar claramente
    if (error.cause?.code === 'ECONNREFUSED' || error.message?.includes('fetch')) {
      res.status(503).json({
        success: false,
        message: 'Sistema Principal no disponible para autenticar. Verifique que el backend Principal (puerto 3006) esté corriendo.',
        error: error.message
      })
      return
    }
    res.status(500).json({
      success: false,
      message: 'Error al iniciar sesión',
      error: error.message
    })
  }
}

export const getProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    // Sin tabla usuarios en restaurante_inventarios_db, el perfil viene del JWT validado por verifyToken
    // El token fue firmado por el Principal con el mismo JWT_SECRET
    const user = req.user!

    res.json({
      success: true,
      data: {
        id: user.id,
        nombre: user.nombre,
        usuario: user.usuario,
        rol: user.rol
      }
    })
  } catch (error: any) {
    console.error('Error al obtener perfil (GastroStock):', error)
    res.status(500).json({
      success: false,
      message: 'Error al obtener perfil',
      error: error.message
    })
  }
}
