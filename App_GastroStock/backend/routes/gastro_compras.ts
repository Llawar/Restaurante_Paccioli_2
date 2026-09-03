import { Router } from 'express'
import { getAll, getById, create, cancelar } from '../app/Http/Controllers/GastroCompraController'
import { verifyToken } from '../app/Http/Middleware/AuthMiddleware'
import { isEmpleado } from '../app/Http/Middleware/RolesMiddleware'

const router = Router()

router.get('/', verifyToken, getAll)
router.get('/:id', verifyToken, getById)
router.post('/', verifyToken, isEmpleado, create)
router.put('/:id/cancelar', verifyToken, isEmpleado, cancelar)

export default router
