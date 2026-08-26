import { Request, Response, NextFunction } from 'express'
import { Role } from '../../../config/auth'

export const checkRole = (...allowedRoles: Role[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Usuario no autenticado'
        })
        return
      }

      const userRole = req.user.rol as Role

      if (!allowedRoles.includes(userRole)) {
        res.status(403).json({
          success: false,
          message: 'No tiene permisos para acceder a este recurso',
          requiredRoles: allowedRoles,
          userRole: userRole
        })
        return
      }

      next()
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Error al verificar permisos',
        error: error.message
      })
    }
  }
}

export const isAdmin = checkRole('admin')
export const isEmpleado = checkRole('admin', 'empleado')
export const isCocinero = checkRole('admin', 'empleado', 'cocinero')
export const isDelivery = checkRole('admin', 'empleado', 'delivery')
