import { Express } from 'express'
import authRoutes from '../../routes/auth'
import gastroCategoriaRoutes from '../../routes/gastro_categorias'
import gastroSubcategoriaRoutes from '../../routes/gastro_subcategorias'
import gastroUnidadRoutes from '../../routes/gastro_unidades'
import gastroProveedorRoutes from '../../routes/gastro_proveedores'
import gastroProductoRoutes from '../../routes/gastro_productos'
import gastroUbicacionRoutes from '../../routes/gastro_ubicaciones'
import gastroCompraRoutes from '../../routes/gastro_compras'
import gastroLoteRoutes from '../../routes/gastro_lotes'
import gastroKardexRoutes from '../../routes/gastro_kardex'
import gastroInventarioFisicoRoutes from '../../routes/gastro_inventario_fisico'
import gastroAlertaRoutes from '../../routes/gastro_alertas'
import gastroDashboardRoutes from '../../routes/gastro_dashboard'

export const registerRoutes = (app: Express): void => {
  app.use('/api/auth', authRoutes)
  app.use('/api/gastro/categorias', gastroCategoriaRoutes)
  app.use('/api/gastro/subcategorias', gastroSubcategoriaRoutes)
  app.use('/api/gastro/unidades', gastroUnidadRoutes)
  app.use('/api/gastro/proveedores', gastroProveedorRoutes)
  app.use('/api/gastro/productos', gastroProductoRoutes)
  app.use('/api/gastro/ubicaciones', gastroUbicacionRoutes)
  app.use('/api/gastro/compras', gastroCompraRoutes)
  app.use('/api/gastro/lotes', gastroLoteRoutes)
  app.use('/api/gastro/kardex', gastroKardexRoutes)
  app.use('/api/gastro/inventario-fisico', gastroInventarioFisicoRoutes)
  app.use('/api/gastro/alertas', gastroAlertaRoutes)
  app.use('/api/gastro/dashboard', gastroDashboardRoutes)

  app.get('/api/health', (_req, res) => {
    res.json({
      status: 'OK',
      message: 'API de GastroStock funcionando',
      timestamp: new Date().toISOString()
    })
  })
}
