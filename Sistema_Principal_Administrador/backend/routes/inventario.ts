import { Router } from 'express'
import { getAll, getByProducto, getMovimientos, updateStock, getAlertas, create } from '../app/Http/Controllers/InventarioController'
import { verifyToken } from '../app/Http/Middleware/AuthMiddleware'
import { isEmpleado } from '../app/Http/Middleware/RolesMiddleware'

const router = Router()

router.get('/', verifyToken, getAll)
router.get('/alertas', verifyToken, getAlertas)
router.post('/', verifyToken, isEmpleado, create)
router.get('/producto/:productoId', verifyToken, getByProducto)
router.get('/producto/:productoId/movimientos', verifyToken, getMovimientos)
router.put('/producto/:productoId/stock', verifyToken, isEmpleado, updateStock)
router.put('/producto/:productoId', verifyToken, isEmpleado, updateStock)

export default router
