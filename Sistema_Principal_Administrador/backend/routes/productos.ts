import { Router } from 'express'
import { getAll, getById, getByCategoria, create, update, remove } from '../app/Http/Controllers/ProductoController'
import { verifyToken } from '../app/Http/Middleware/AuthMiddleware'
import { isEmpleado } from '../app/Http/Middleware/RolesMiddleware'
import upload from '../app/Http/Middleware/UploadMiddleware'

const router = Router()

router.get('/', getAll)
router.get('/:id', getById)
router.get('/categoria/:categoriaId', getByCategoria)
router.post('/', verifyToken, isEmpleado, upload.single('imagen'), create)
router.put('/:id', verifyToken, isEmpleado, upload.single('imagen'), update)
router.delete('/:id', verifyToken, isEmpleado, remove)

export default router
