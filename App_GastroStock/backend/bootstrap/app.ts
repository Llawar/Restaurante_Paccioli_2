import expressApp from '../app/Providers/AppProvider'
import { registerRoutes } from '../app/Providers/RouteProvider'
import { errorHandler } from '../app/Exceptions/Handler'
import { testConnection } from '../app/Providers/DatabaseProvider'
import config from '../config/app'

export const startServer = async (): Promise<void> => {
  const isDbConnected = await testConnection()

  if (!isDbConnected) {
    console.error('No se pudo conectar a la base de datos. Saliendo...')
    process.exit(1)
  }

  registerRoutes(expressApp)
  expressApp.use(errorHandler)

  expressApp.listen(config.port, () => {
    console.log(`GastroStock corriendo en el puerto ${config.port}`)
    console.log(`API disponible en: http://localhost:${config.port}/api`)
    console.log(`Health check: http://localhost:${config.port}/api/health`)
  })
}
