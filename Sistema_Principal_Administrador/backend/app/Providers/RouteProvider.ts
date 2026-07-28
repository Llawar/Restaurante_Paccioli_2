import { Express } from 'express'
import authRoutes from '../../routes/auth'
import categoriaRoutes from '../../routes/categorias'
import productoRoutes from '../../routes/productos'
import inventarioRoutes from '../../routes/inventario'
import pedidoRoutes from '../../routes/pedidos'
import usuarioRoutes from '../../routes/usuarios'
import deliveryRoutes from '../../routes/delivery'
import cocinaRoutes from '../../routes/cocina'

export const registerRoutes = (app: Express): void => {
  app.use('/api/auth', authRoutes)
  app.use('/api/categorias', categoriaRoutes)
  app.use('/api/productos', productoRoutes)
  app.use('/api/inventario', inventarioRoutes)
  app.use('/api/pedidos', pedidoRoutes)
  app.use('/api/usuarios', usuarioRoutes)
  app.use('/api/delivery', deliveryRoutes)
  app.use('/api/cocina', cocinaRoutes)

  app.get('/api/health', (_req, res) => {
    res.json({
      status: 'OK',
      message: 'API del Sistema de Restaurante funcionando',
      timestamp: new Date().toISOString()
    })
  })
}
