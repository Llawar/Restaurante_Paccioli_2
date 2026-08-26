import { Router } from 'express'
import { getAll, getById, create, updateEstado, getParaDisplay } from '../app/Http/Controllers/PedidoController'
import { verifyToken } from '../app/Http/Middleware/AuthMiddleware'
import { isEmpleado } from '../app/Http/Middleware/RolesMiddleware'

const router = Router()

router.get('/', verifyToken, getAll)
router.get('/display', getParaDisplay)
router.get('/:id', verifyToken, getById)
router.post('/publico', create)
router.post('/', verifyToken, isEmpleado, create)
router.put('/:id/estado', verifyToken, isEmpleado, updateEstado)

export default router
