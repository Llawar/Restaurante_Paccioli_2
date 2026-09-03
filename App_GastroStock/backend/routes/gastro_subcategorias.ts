import { Router } from 'express'
import { getAll, getByCategoria, getById, create, update, remove } from '../app/Http/Controllers/GastroSubcategoriaController'
import { verifyToken } from '../app/Http/Middleware/AuthMiddleware'
import { isEmpleado } from '../app/Http/Middleware/RolesMiddleware'

const router = Router()

router.get('/', verifyToken, getAll)
router.get('/categoria/:categoriaId', verifyToken, getByCategoria)
router.get('/:id', verifyToken, getById)
router.post('/', verifyToken, isEmpleado, create)
router.put('/:id', verifyToken, isEmpleado, update)
router.delete('/:id', verifyToken, isEmpleado, remove)

export default router
