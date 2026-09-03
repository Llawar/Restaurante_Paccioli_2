import { Router } from 'express'
import { verifyToken } from '../app/Http/Middleware/AuthMiddleware'
import { isEmpleado, isAdmin } from '../app/Http/Middleware/RolesMiddleware'
import * as Receta from '../app/Http/Controllers/RecetaController'

const router = Router()

router.get('/', verifyToken, Receta.getAll)
router.get('/producto/:productoId', verifyToken, Receta.getByProducto)
router.post('/', verifyToken, isEmpleado, Receta.upsert)
router.delete('/:id', verifyToken, isAdmin, Receta.remove)

// Cola sync (admin)
router.get('/sync/cola', verifyToken, isAdmin, Receta.getCola)
router.post('/sync/cola/:id/reintentar', verifyToken, isAdmin, Receta.reintentarCola)

export default router
