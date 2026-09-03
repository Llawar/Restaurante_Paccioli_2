import { Router } from 'express'
import { getAll, create, update, remove } from '../app/Http/Controllers/GastroUnidadController'
import { verifyToken } from '../app/Http/Middleware/AuthMiddleware'
import { isEmpleado } from '../app/Http/Middleware/RolesMiddleware'

const router = Router()

router.get('/', verifyToken, getAll)
router.post('/', verifyToken, isEmpleado, create)
router.put('/:id', verifyToken, isEmpleado, update)
router.delete('/:id', verifyToken, isEmpleado, remove)

export default router
