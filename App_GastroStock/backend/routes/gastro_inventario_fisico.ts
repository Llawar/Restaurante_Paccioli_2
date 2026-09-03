import { Router } from 'express'
import { getAll, getById, iniciar, registrarConteo, completar } from '../app/Http/Controllers/GastroInventarioFisicoController'
import { verifyToken } from '../app/Http/Middleware/AuthMiddleware'
import { isEmpleado } from '../app/Http/Middleware/RolesMiddleware'

const router = Router()

router.get('/', verifyToken, getAll)
router.post('/iniciar', verifyToken, isEmpleado, iniciar)
router.get('/:id', verifyToken, getById)
router.post('/conteo', verifyToken, isEmpleado, registrarConteo)
router.put('/:id/completar', verifyToken, isEmpleado, completar)

export default router
