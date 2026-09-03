import { Router } from 'express'
import { getAll, getById, promoteToDelivery, demoteToClient, toggleBlock, syncNow } from '../app/Http/Controllers/ClientesDeliveryController'
import { verifyToken } from '../app/Http/Middleware/AuthMiddleware'
import { isAdmin } from '../app/Http/Middleware/RolesMiddleware'

const router = Router()

router.get('/', verifyToken, isAdmin, getAll)
router.get('/:id', verifyToken, isAdmin, getById)
router.post('/:id/promote', verifyToken, isAdmin, promoteToDelivery)
router.post('/:id/demote', verifyToken, isAdmin, demoteToClient)
router.patch('/:id/block', verifyToken, isAdmin, toggleBlock)
router.post('/sync/now', verifyToken, isAdmin, syncNow)

export default router
