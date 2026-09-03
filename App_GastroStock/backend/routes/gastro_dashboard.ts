import { Router } from 'express'
import { getResumen, getComprasRecientes, getMovimientosRecientes, getStockBajo } from '../app/Http/Controllers/GastroDashboardController'
import { verifyToken } from '../app/Http/Middleware/AuthMiddleware'

const router = Router()

router.get('/resumen', verifyToken, getResumen)
router.get('/compras-recientes', verifyToken, getComprasRecientes)
router.get('/movimientos-recientes', verifyToken, getMovimientosRecientes)
router.get('/stock-bajo', verifyToken, getStockBajo)

export default router
