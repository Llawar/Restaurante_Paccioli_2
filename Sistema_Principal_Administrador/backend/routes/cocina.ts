import { Router } from 'express'
import { getPedidosPorPuesto, cambiarEstadoItem, getResumenCocina, getMiPuesto } from '../app/Http/Controllers/CocinaController'
import { getAll as getPuestos, getById, create as createPuesto, update as updatePuesto, remove as removePuesto } from '../app/Http/Controllers/PuestoController'
import { verifyToken } from '../app/Http/Middleware/AuthMiddleware'
import { isCocinero, isAdmin } from '../app/Http/Middleware/RolesMiddleware'

const router = Router()

// Puestos de cocina (administración solo admin)
router.get('/puestos', verifyToken, isCocinero, getPuestos)
router.get('/puestos/:id', verifyToken, isCocinero, getById)
router.post('/puestos', verifyToken, isAdmin, createPuesto)
router.put('/puestos/:id', verifyToken, isAdmin, updatePuesto)
router.delete('/puestos/:id', verifyToken, isAdmin, removePuesto)
// Desactivado por decisión: no se cambia el estado activo/inactivo de los puestos por ahora.
// router.patch('/puestos/:id/estado', verifyToken, isAdmin, toggleStatus)

// Módulo cocina
router.get('/mi-puesto', verifyToken, isCocinero, getMiPuesto)
router.get('/pedidos/:puestoId', verifyToken, isCocinero, getPedidosPorPuesto)
router.put('/item/:detalleId/estado', verifyToken, isCocinero, cambiarEstadoItem)
router.get('/resumen', verifyToken, isAdmin, getResumenCocina)

export default router