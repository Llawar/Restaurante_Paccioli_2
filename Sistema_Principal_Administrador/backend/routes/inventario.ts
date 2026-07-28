import { Router } from 'express'
import { getAll, getByProducto, getMovimientos, updateStock } from '../app/Http/Controllers/InventarioController'
import { verifyToken } from '../app/Http/Middleware/AuthMiddleware'
import { isEmpleado } from '../app/Http/Middleware/RolesMiddleware'

const router = Router()

router.get('/', verifyToken, getAll)
router.get('/producto/:productoId', verifyToken, getByProducto)
router.get('/producto/:productoId/movimientos', verifyToken, getMovimientos)
router.put('/producto/:productoId/stock', verifyToken, isEmpleado, updateStock)

export default router
