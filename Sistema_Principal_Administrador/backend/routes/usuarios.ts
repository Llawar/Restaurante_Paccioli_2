import { Router } from 'express'
import { getAll, getById, update, remove, updatePassword } from '../app/Http/Controllers/UsuarioController'
import { verifyToken } from '../app/Http/Middleware/AuthMiddleware'
import { isAdmin } from '../app/Http/Middleware/RolesMiddleware'

const router = Router()

router.get('/', verifyToken, isAdmin, getAll)
router.get('/:id', verifyToken, isAdmin, getById)
router.put('/:id', verifyToken, isAdmin, update)
router.delete('/:id', verifyToken, isAdmin, remove)
router.put('/:id/password', verifyToken, isAdmin, updatePassword)

export default router
