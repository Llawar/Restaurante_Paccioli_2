# Integración Delivery (Supabase) ↔ POS (MySQL) — Camino A: Puente

## Objetivo

Conectar los pedidos que llegan por la **app de delivery (Flutter + Supabase)** con el **POS local (Express + MySQL + Socket.IO)**, para que el restaurante los vea en tiempo real (cocina, display y panel admin) sin tocar la app móvil.

> Antes de esta integración, los pedidos de la app quedaban solo en Supabase y el restaurante **no se enteraba** por el sistema POS.

---

## Arquitectura

```
┌──────────────────────────────  INTERNET  ──────────────────────────────┐
│                                                                        │
│  Cliente app ──▶ Supabase (nube) ──orders + order_items──▶  PUENTE      │
│  Repartidor ──▶  (app Flutter)                             │           │
│                                                           ▼            │
└────────────────────────────────────────────────────────────────────────┘
                                                           │
                                        ┌──────────────────────────────┐
                                        │  PUENTE (backend Express)     │
                                        │  DeliverySyncService.ts       │
                                        │  - polling a Supabase cada 7s │
                                        │  - crea pedido + delivery     │
                                        │  - asigna items a puestos     │
                                        │  - emite eventos Socket.IO    │
                                        └──────────────┬───────────────┘
                                                       ▼
                                        ┌──────────────────────────────┐
                                        │  MySQL restaurant_system_db   │
                                        │  pedidos / detalles_pedido /  │
                                        │  delivery (supabase_order_id) │
                                        └──────────────┬───────────────┘
                                                       ▼
                                    Cocina (KDS) · Display · POS Admin
                                    (Socket.IO, tiempo real)
```

---

## Componentes

| Componente | Archivo | Función |
|---|---|---|
| Worker puente | `backend/app/Services/DeliverySyncService.ts` | Consulta Supabase cada 7s, mapea y escribe en MySQL, emite Socket.IO |
| Arranque | `backend/bootstrap/app.ts` | Llama a `iniciarDeliverySync()` tras conectar la BD |
| Migración | `backend/database/migrations/011_delivery_supabase.sql` | Agrega `delivery.supabase_order_id` (UNIQUE) |
| Config | `backend/.env` | `SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY` |

---

## Mapeo de datos (Supabase → MySQL)

| Supabase | MySQL | Notas |
|---|---|---|
| `orders.id` (uuid) | `delivery.supabase_order_id` | Identificador único para evitar duplicados |
| `orders.direccion_entrega` | `delivery.direccion` | |
| `users.telefono` (del cliente) | `delivery.telefono` | Consulta adicional al cliente |
| `users.nombre` (del cliente) | `delivery.nombre_cliente` | |
| `orders.metodo_pago` | `delivery.notas` | Se guarda como nota ("Metodo de pago: ...") |
| `orders.total` | `pedidos.total` | |
| — | `pedidos.tipo` | Siempre `'delivery'` |
| `order_items[].nombre_producto` | `detalles_pedido.producto_id` | Producto se busca por nombre; si no existe se crea en la categoría **Delivery** |
| `order_items[].cantidad` | `detalles_pedido.cantidad` | |
| `order_items[].precio_unitario` | `detalles_pedido.precio_unitario` | |
| `orders.estado` | `delivery.estado` + `pedidos.estado` | Ver tabla de estados |

---

## Mapeo de estados

| Estado Supabase | Estado `delivery` MySQL | Estado `pedidos` MySQL |
|---|---|---|
| `pending` | `pendiente` | `pendiente` |
| `assigned` | `asignado` | *(sin cambio)* |
| `in_transit` | `en_camino` | *(sin cambio)* |
| `delivered` | `entregado` | `entregado` |
| `cancelled` | `cancelado` | `cancelado` |

> El estado de `pedidos` lo recalculan además los puestos de cocina a través de `detalles_pedido`. Solo `delivered`/`cancelled` lo fuerza el puente.

---

## Configuración paso a paso

### 1. Obtener la `service_role` key de Supabase

1. Entra a **https://supabase.com/dashboard** e inicia sesión con la cuenta del proyecto.
2. En *Your projects*, selecciona el proyecto **oywjtoventqgzcotqpny**.
3. Menú izquierdo → **Settings (⚙️)** → **API Keys** (en algunos proyectos: *Project Settings → API*).
4. Copia la clave **`service_role`** (NO la `anon`).
   - ⚠️ La `anon` está limitada por las políticas RLS; la `service_role` **bypassa** RLS y solo debe usarse en el servidor.

### 2. Pegar la key en el backend

Edita `backend/.env`:

```env
SUPABASE_URL=https://oywjtoventqgzcotqpny.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...tu_service_role...t
```

> Si la key está vacía o no existe, el puente se **desactiva solo** con un log de advertencia: el resto del sistema funciona normal.

### 3. Ejecutar la migración

En tu cliente MySQL (Workbench, CLI, etc.):

```sql
ALTER TABLE delivery
  ADD COLUMN supabase_order_id VARCHAR(64) NULL AFTER notas,
  ADD UNIQUE KEY uq_delivery_supabase_order_id (supabase_order_id);
```

### 4. Reiniciar el backend

Detener y volver a ejecutar (importante: cargó la dependencia `@supabase/supabase-js` y la nueva variable de entorno):

```bash
cd Sistema_Principal_Administrador/backend
npm run dev
```

Al arrancar deberías ver el log:

```
[DeliverySync] Puente delivery->POS activo (polling cada 7s)
```

---

## Cómo probar

1. Abre la app de delivery (Flutter) y crea un pedido como cliente (rol `client`).
2. En un máximo de ~7 s, en el **POS admin** (`:5173` → Pedidos) debe aparecer un pedido de tipo **delivery**.
3. En la **cocina** (`:5175`) deben aparecer los items asignados a sus puestos (si la categoría "Delivery" no tiene puesto asignado, quedan sin asignar hasta que le asignes un puesto en Admin → Puestos).
4. Avanza el estado en la app (repartidor acepta → in_transit → delivered) y verifica que en el POS el estado cambie en tiempo real.

---

## Notas y brechas conocidas

- **Sin asignación automática de puesto**: los productos creados en la categoría "Delivery" no tienen `puesto_cocina_id`; asígnale un puesto (ej. Puesto 6 Apoyo) en el admin para que la cocina los reciba.
- **Clientes no creados en `clientes`**: el puente guarda nombre/teléfono solo en `delivery`, no crea filas en la tabla `clientes`. Se puede agregar después si se requiere.
- **Una vía por ahora**: Supabase → MySQL. Los cambios hechos en el POS no se reflejan en la app (requeriría sincronización bidireccional).
- **Polling, no Realtime**: se usa polling de 7 s por simplicidad y robustez. Migrar a Supabase Realtime sería una mejora futura para latencia <1s.
- **Redundancia de catálogo**: si el mismo producto se crea dos veces con el mismo nombre exacto, se reutiliza; nombres ligeramente distintos crean productos duplicados.

---

*Documento generado para el Camino A de integración Delivery ↔ POS.*
