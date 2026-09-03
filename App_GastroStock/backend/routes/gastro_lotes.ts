import { Router } from 'express'
import { getByProducto, getAll } from '../app/Http/Controllers/GastroLoteController'
import { verifyToken } from '../app/Http/Middleware/AuthMiddleware'

const router = Router()

router.get('/', verifyToken, getAll)
router.get('/producto/:productoId', verifyToken, getByProducto)

export default router
