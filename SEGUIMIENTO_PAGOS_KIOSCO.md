# SEGUIMIENTO_PAGOS_KIOSCO.md

Seguimiento del registro de pagos en el flujo del kiosco de autoservicio.

> **Estado actual: ⚠️ Falta por implementar**

---

## Objetivo

El kiosco (`Sistema_Pedidos_Automatico`) debe poder realizar y **registrar pagos reales** además de crear el pedido. Hoy solo crea el pedido vía `POST /api/pedidos/publico` (sin autenticación) y simula el pago exitoso.

## Contexto (implementado)

- **Ruta pública**: `POST /api/pedidos/publico` en `Sistema_Principal_Administrador/backend/routes/pedidos.ts`, reutiliza el controlador `create` sin token.
- El controlador ya inserta el pedido en `pedidos` y sus items en `detalles_pedido`, y emite `kitchen:new_order`.
- El kiosco envía `tipo`, `items[{producto_id, cantidad, precio_unitario}]`, `total`.

## Pendiente / Falta por implementar

### 1. Validación de payload en la ruta pública
- Validar body: `tipo` ∈ `['mesa', 'delivery', 'para_llevar']`, `items` array no vacío, cada item con `producto_id` válido, `cantidad > 0`, `precio_unitario` numérico ≥ 0.
- Validar `total` numérico ≥ 0 y consistencia con la suma de items (margin tolerance).
- Limitar tamaño/peso del body y tasas de petición (rate limiting) para evitar abuso, ya que la ruta no tiene token.

### 2. Registro de pagos reales
- Crear tabla/migración de pagos (o columnas en `pedidos`): método de pago, referencia/transacción, monto, fecha, estado, id del pedido.
- Integrar pasarela/QR (ej. POS, Stripe, Yape/Plin en LATAM) o confirmación manual desde el kiosco.
- Marcar el pedido como `pagado` y no solo `pendiente`.
- Registrar el pago en la base y emitir evento Socket.IO al admin/cocina.

### 3. Endurecer seguridad de la ruta pública
- Token/firma del kiosco cuando pase de simulación a producción.
- No confiar en `precio_unitario` enviado por el cliente: recalcular contra la BD en el servidor (ideal a futuro).

---

## Cómo actualizar este documento

Cuando se implemente una sección, cambiar el estado general a:

> **Estado actual: 🔨 Implementando**

y mover el ítem de "Pendiente" a la sección "Implementado" con la fecha y archivos tocados.