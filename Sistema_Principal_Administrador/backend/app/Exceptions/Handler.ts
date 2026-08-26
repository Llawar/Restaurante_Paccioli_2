import { Request, Response, NextFunction } from 'express'

export class HttpException extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public error?: string
  ) {
    super(message)
  }
}

export const errorHandler = (
  err: Error | HttpException,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  console.error('Error:', err)

  if (err instanceof HttpException) {
    res.status(err.statusCode).json({
      success: false,
      message: err.message,
      error: process.env.NODE_ENV === 'development' ? err.error : undefined
    })
    return
  }

  if ((err as any).name === 'MulterError') {
    const message = (err as any).code === 'LIMIT_FILE_SIZE'
      ? 'El archivo supera el tamaño máximo permitido (5MB)'
      : 'Error al subir el archivo'
    res.status(400).json({
      success: false,
      message
    })
    return
  }

  res.status(500).json({
    success: false,
    message: 'Error interno del servidor',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  })
}
