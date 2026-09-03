import { Router } from 'express'
import { getAll, getStockBajo, getProximoVencer, marcarLeidas } from '../app/Http/Controllers/GastroAlertaController'
import { verifyToken } from '../app/Http/Middleware/AuthMiddleware'
import { isEmpleado } from '../app/Http/Middleware/RolesMiddleware'

const router = Router()

router.get('/', verifyToken, getAll)
router.get('/stock-bajo', verifyToken, getStockBajo)
router.get('/proximo-vencer', verifyToken, getProximoVencer)
router.put('/leidas', verifyToken, isEmpleado, marcarLeidas)

export default router
