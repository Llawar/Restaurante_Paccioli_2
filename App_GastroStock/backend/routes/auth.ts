import { Router } from 'express'
import { login, getProfile } from '../app/Http/Controllers/AuthController'
import { verifyToken } from '../app/Http/Middleware/AuthMiddleware'

const router = Router()

router.post('/login', login)
router.get('/profile', verifyToken, getProfile)

export default router
