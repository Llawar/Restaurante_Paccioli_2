import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import config from '../../../config/app'
import { JwtPayload } from '../../Models'

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload
    }
  }
}

export const verifyToken = (req: Request, res: Response, next: NextFunction): void => {
  try {
    const authHeader = req.headers.authorization

    if (!authHeader) {
      res.status(401).json({
        success: false,
        message: 'Token de autenticación no proporcionado'
      })
      return
    }

    const token = authHeader.startsWith('Bearer ')
      ? authHeader.substring(7)
      : authHeader

    const decoded = jwt.verify(token, config.jwtSecret) as JwtPayload

    req.user = decoded
    next()
  } catch (error: any) {
    res.status(401).json({
      success: false,
      message: 'Token inválido o expirado',
      error: error.message
    })
  }
}
