import { Router } from 'express'
import { getPedidosPorPuesto, getPuestosCocina, cambiarEstadoItem, getResumenCocina } from '../app/Http/Controllers/CocinaController'
import { verifyToken } from '../app/Http/Middleware/AuthMiddleware'

const router = Router()

router.get('/puestos', getPuestosCocina)
router.get('/pedidos/:puestoId', getPedidosPorPuesto)
router.put('/item/:detalleId/estado', cambiarEstadoItem)
router.get('/resumen', verifyToken, getResumenCocina)

export default router
