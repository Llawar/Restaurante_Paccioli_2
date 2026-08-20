# Supabase — Setup de la Delivery App

Scripts para crear la base de datos y la seguridad en TU proyecto Supabase.

## Orden de ejecución (en el SQL Editor de Supabase)

1. **`01_tablas.sql`** — crea tablas, índices y la función `delete_user`.
2. **`02_rls_enable.sql`** — activa Row Level Security en las 6 tablas.
3. **`03_politicas.sql`** — crea funciones de rol y políticas de acceso.
4. **`04_productos_catalogo.sql`** — (si existe) carga/añade el catálogo base de productos.
5. **`05_catalogo_pos.sql`** — agrega `products.pos_id` (UNIQUE) + índice + `updated_at` para la **sincronización de catálogo desde el POS** (`CatalogoSyncService.ts`). Idempotente.

> Ejecuta en ese orden. 2 puede ir antes que 1 (solo activa la protección);
> 3 siempre después de 1 y 2 para que las tablas existan con RLS activo.
> El 05 es opcional (solo necesario si usas el puente Delivery↔POS).

---

## Pasos en el panel de Supabase

### A. Desactivar confirmación de email (para entrar al instante)
- **Authentication → Providers → Email** → desactiva **"Confirm email"**.
- Así los usuarios registrados desde la app entran sin verificar correo.

### B. Probar con tu primera cuenta
- Abre la app, ve a **Registro**, elige rol y crea **3 usuarios**:
  - 1 `admin`, 1 `client`, 1 `delivery`.
- Verás que los 3 se crean y pueden iniciar sesión.

---

## Conectar la app a TU proyecto (reemplaza el de tu compañero)

Edita `lib/config/supabase_config.dart`:

```dart
static const String supabaseUrl = 'https://<TU-PROYECTO>.supabase.co';
static const String supabaseAnonKey = '<TU-ANON-ANON>';
```

Dónde obtenerlas (panel de Supabase):
- **Settings → API** (o *Project Settings → API*)
- `Project URL`  → supabaseUrl
- `anon public`  → supabaseAnonKey

---

## Tablas que crea (coinciden con `TableNames` en el código)

| Tabla | Uso |
|---|---|
| `users` | Cuentas + rol (admin/client/delivery) + `direccion` |
| `client_profiles` | Perfil + geo del cliente |
| `delivery_profiles` | Perfil del repartidor + `ubicacion_actual` (JSON lat/lng) |
| `products` | Catálogo |
| `orders` | Pedido (cliente, repartidor, estado, direccion, total...) |
| `order_items` | Líneas del pedido |

**Extra agregado respecto a `SETUP.md`** (necesario por el código real):
- `users.direccion`
- `delivery_profiles.ubicacion_actual` (jsonb)
- `order_items.nombre_producto`
- índices en `fecha_creacion`

---

## Seguridad (resumen de las políticasen `03_politicas.sql`)

| Tabla | Usuario lee | Usuario escribe |
|---|---|---|
| `users` | admin todos; el propio suyo | el propio, admin |
| `client_profiles` | el propio | el propio |
| `delivery_profiles` | admin + el propio | el propio, admin |
| `products` | todos | solo admin |
| `orders` | cliente el suyo, delivery asignados/pendientes, admin todos | cliente (insert), delivery/admin (update) |
| `order_items` | dueño del pedido, delivery, admin | dueño (insert), admin (delete) |

> Estas políticas están afinadas al código. Si en producción quieres más restringir
> (p. ej. delivery no ve todos los pendientes), ajusta `orders_select`.