import http from 'http'
import { Server } from 'socket.io'
import expressApp from '../app/Providers/AppProvider'
import { registerRoutes } from '../app/Providers/RouteProvider'
import { testConnection } from '../app/Providers/DatabaseProvider'
import config from '../config/app'

const server = http.createServer(expressApp)

const io = new Server(server, {
  cors: {
    origin: ['http://localhost:3000', 'http://localhost:5173', 'http://localhost:5175', 'http://localhost:5176'],
    methods: ['GET', 'POST'],
    credentials: true
  }
})

global.io = io

io.on('connection', (socket) => {
  console.log('Cliente conectado:', socket.id)

  socket.on('disconnect', () => {
    console.log('Cliente desconectado:', socket.id)
  })
})

registerRoutes(expressApp)

declare global {
  var io: Server | undefined
}

export const startServer = async (): Promise<void> => {
  const isDbConnected = await testConnection()

  if (!isDbConnected) {
    console.error('No se pudo conectar a la base de datos. Saliendo...')
    process.exit(1)
  }

  server.listen(config.port, () => {
    console.log(`Servidor corriendo en el puerto ${config.port}`)
    console.log(`API disponible en: http://localhost:${config.port}/api`)
    console.log(`Health check: http://localhost:${config.port}/api/health`)
    console.log(`WebSocket disponible en: ws://localhost:${config.port}`)
  })
}
