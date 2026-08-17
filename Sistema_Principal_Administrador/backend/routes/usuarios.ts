import { Router } from 'express'
import { getAll, getById, create, update, remove, toggleStatus, updatePassword } from '../app/Http/Controllers/UsuarioController'
import { verifyToken } from '../app/Http/Middleware/AuthMiddleware'
import { isAdmin } from '../app/Http/Middleware/RolesMiddleware'

const router = Router()

router.get('/', verifyToken, isAdmin, getAll)
router.get('/:id', verifyToken, isAdmin, getById)
router.post('/', verifyToken, isAdmin, create)
router.put('/:id', verifyToken, isAdmin, update)
router.delete('/:id', verifyToken, isAdmin, remove)
router.patch('/:id/estado', verifyToken, isAdmin, toggleStatus)
router.put('/:id/password', verifyToken, isAdmin, updatePassword)

export default router
