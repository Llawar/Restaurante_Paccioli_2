import { Router } from 'express'
import { getAll, getById, create, asignarRepartidor, updateEstado } from '../app/Http/Controllers/DeliveryController'
import { verifyToken } from '../app/Http/Middleware/AuthMiddleware'
import { isEmpleado, isDelivery } from '../app/Http/Middleware/RolesMiddleware'

const router = Router()

router.get('/', verifyToken, isEmpleado, getAll)
router.get('/:id', verifyToken, isEmpleado, getById)
router.post('/', verifyToken, isEmpleado, create)
router.put('/:id/asignar', verifyToken, isEmpleado, asignarRepartidor)
router.put('/:id/estado', verifyToken, isDelivery, updateEstado)

export default router
