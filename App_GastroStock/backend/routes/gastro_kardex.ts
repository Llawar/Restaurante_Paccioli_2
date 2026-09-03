import { Router } from 'express'
import { getByProducto, registrarSalida } from '../app/Http/Controllers/GastroKardexController'
import { verifyToken } from '../app/Http/Middleware/AuthMiddleware'
import { isEmpleado } from '../app/Http/Middleware/RolesMiddleware'

const router = Router()

router.get('/producto/:productoId', verifyToken, getByProducto)
router.post('/salida', verifyToken, isEmpleado, registrarSalida)

export default router
