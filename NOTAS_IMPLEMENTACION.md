# NOTAS_IMPLEMENTACION.md

Notas de referencia para implementación futura del sistema **Restaurante Paccioli POS**.
Documento vivo: se actualiza conforme se avanza en inventario, red, túnel y fixes.

---

## 1. Arquitectura actual

Sistema compuesto por **4 módulos independientes** + backend central en tiempo real.

| # | Módulo | Propósito | Tecnología | Puerto |
|---|--------|-----------|------------|--------|
| 1 | **Sistema_Principal_Administrador** | Panel admin + Backend central | React 18 + Node/Express + MySQL | Backend `3006` · Frontend `5173` |
| 2 | **App_Cocina** | Pantalla de cocina (KDS) | React 19 + Vite + Socket.IO | `5175` |
| 3 | **App_Display_Clientes** | Monitor público de pedidos | React 18 + Vite + Socket.IO | `5176` |
| 4 | **Sistema_Pedidos_Automatico** | Kiosco de autoservicio | React 19 + Vite + Tailwind 4 | `3000` |

Todos se comunican con el **mismo backend** mediante REST API + Socket.IO.

### Puertos por defecto
- Backend API: `3006`
- Admin Frontend: `5173`
- App Cocina: `5175`
- Display Clientes: `5176`
- Kiosco Autoservicio: `3000`

---

## 2. Estado del sistema (diagnóstico 2026-08-11)

### Base de datos
- **MySQL corriendo** en puerto `3306`
- BD: `restaurant_system_db`
- Tablas web (MySQL): `categorias`, `clientes`, `delivery`, `detalles_pedido`, `inventario`, `mesas`, `pedidos`, `productos`, `puestos_cocina`, `usuarios`, + tabla legacy `asignacion_puestos_categorias` (en desuso tras la migración 010).
- **Reparto categoría→puesto**: columna `categorias.puesto_cocina_id` (1 categoría → 1 puesto) en vez de la tabla puente.

### Credenciales (por defecto)
- Backend `.env`: host `localhost`, user `root`, password `nano123`, BD `restaurant_system_db`
- Usuario admin: `admin` / `admin123` (rol admin, schema.sql:175)

### Datos actuales (diagnóstico 2026-08-11)
- En ese momento: **0 productos, 0 pedidos, 0 inventario** (solo 5 categorías y 1 admin)
- El kiosco/cocina/display no muestran nada hasta que exista catálogo.
- Probar el flujo de pedido E2E requiere productos cargados primero.
- (Estado posterior: el catálogo se fue cargando en la BD viva conforme se validó el flujo de cocina/kiosco.)

### Estado de módulos
- Backend: `.env` configurado, dependencias instaladas, arranca con `npm run dev`
- Frontends: usan fallback hardcodeado `http://localhost:3006` (o `/api`) si no hay `.env`; `.env.example` disponibles.
- Ningún dev server corriendo por defecto.

### ✅ Bug resuelto: ruta pública del kiosco (2026-08-12)
- El kiosco (`Sistema_Pedidos_Automatico/src/api.ts`) envía `POST /api/pedidos/publico`
- **Fix aplicado**: se añadió `router.post('/publico', create)` en `routes/pedidos.ts`, reutilizando el controlador `create` (que ya tolera la ausencia de token con `req.user?.id || null`).
- Resultado: el pago simulado del kiosco ya crea el pedido en `detalles_pedido` y emite `kitchen:new_order`.
- ⚠️ **Pendiente a futuro (pagos reales)**: ver `SEGUIMIENTO_PAGOS_KIOSCO.md`.

### ✅ Pantallas Categorías y Puestos de Cocina (2026-08-12)
- **Modelo nuevo**: 1 categoría → 1 puesto (`categorias.puesto_cocina_id`); la tabla `asignacion_puestos_categorias` quedó EN DESUSO (migración `010_categorias_puesto.sql` aplicada con backfill).
- **Backend**: `CategoriaController` soporta `puesto_cocina_id` (getAll/getById/create/update). Nuevo `PuestoController` (getAll/getById/create/update/remove/toggleStatus) montado en `/api/cocina/puestos` (rutas de admin: POST/PUT/DELETE/PATCH con `isAdmin`). `CocinaController.asignarItemsAPuestos` ahora consulta `categorias.puesto_cocina_id` directo (determinista, menor id, puesto 6 excluido). Se emiten sockets `categories:changed` y `puestos:changed`.
- **Reglas**: no se puede desactivar/eliminar un puesto que tenga categorías activas asignadas (409 con aviso). Un puesto desactivado no aparece en la app cocina ni en los selects.
- **Frontend admin**: páginas `Categorias.jsx` (CRUD + puesto) y `Puestos.jsx` (CRUD + chips de categorías asociadas) bajo el grupo **Configuración** de la Sidebar (visible solo para rol `admin`). `Productos.jsx` ya no usa IDs hardcodeados: carga categorías reales desde `/categorias`.

### Rutas del backend (resumen)
| Ruta | Acceso |
|------|--------|
| `/api/auth/login`, `/api/auth/register` | Público |
| `/api/auth/profile` | Token |
| `/api/productos` `GET`, `/:id`, `/categoria/:catId` | Público |
| `/api/productos` `POST/PUT/DELETE` | Token + isEmpleado |
| `/api/categorias` | — (revisar según controlador) |
| `/api/pedidos/display` | Público |
| `/api/pedidos` `GET/:id` | Token |
| `/api/pedidos/publico` `POST` | Público (kiosco) |
| `/api/pedidos` `POST`, `PUT /:id/estado` | Token + isEmpleado |
| `/api/cocina/puestos` GET | Token + isCocinero |
| `/api/cocina/mi-puesto` | Token + isCocinero |
| `/api/cocina/pedidos/:puestoId` | Token + isCocinero |
| `/api/cocina/item/:detalleId/estado` | Token + isCocinero |
| `/api/cocina/resumen` | Token + isAdmin |
| `/api/health` | Público |
| Socket.IO `kitchen:new_order`, `kitchen:order_updated` | Tiempo real |

Eventos Socket.IO emitidos: `kitchen:new_order` (al crear pedido) y `kitchen:order_updated` (al cambiar estado de items).

### ✅ App Cocina: login de cocineros + puesto fijo (2026-08-12)
- **Rutas de cocina ahora protegidas** con `verifyToken` + `isCocinero` (eran públicas).
- **Nuevo endpoint** `GET /api/cocina/mi-puesto`: devuelve el puesto fijo del usuario autenticado.
- **Nueva columna** `usuarios.puesto_cocina_id` (FK → `puestos_cocina.id`): cada cocinero queda fijo a UN puesto; su app entra directo sin seleccionar.
- Los roles `admin`/`empleado` SIN puesto asignado aún pueden elegir puesto manualmente (`requiereSeleccion: true`).
- `cambiarEstadoItem` ya usa `req.user.id` desde el JWT (ya NO confía en `cocineroId` del body que antes venía hardcodeado como 1).
- Admins: crear cocinero desde `Usuarios` (rol Cocinero + puesto) o backend `POST /api/usuarios` con `puesto_cocina_id`.
- **App Cocina ahora es PWA** (manifest + iconos + theme-color): "Añadir a pantalla de inicio" en el celular.
- **Frontend**: `App_Cocina/.env` → `VITE_API_URL=http://192.168.1.100:3006` (IP fija, una vez por celular).

---

## 3. Problema de IPs (explicación)

- La red usa **DHCP**: el router presta IPs por tiempo limitado (*lease*, ej. 24 h).
- Al reconectar WiFi (o reiniciar el router) se entrega otra IP → los sistemas con IP vieja en `.env` dejan de encontrar el backend.
- Eso causó las desconexiones al cambiar de red.

### Resumen de conceptos
| Concepto | Qué es | Quién lo hace |
|----------|--------|---------------|
| **DHCP** | El router presta IPs que cambian | Automático |
| **IP fija (servidor)** | Windows Server usa siempre la misma IP | Se configura 1 vez |
| **VITE_API_URL** | Cada pantalla guarda esa IP fija en `.env` | Se configura 1 vez por dispositivo |

---

## 4. Solución 1 — IP fija en el servidor (Windows Server 2022)

### Opción A: IP estática manual (recomendada, no depende del router)
1. Panel de control → Centro de redes → Cambiar configuración del adaptador
2. Clic derecho en Ethernet → Propiedades
3. Doble clic en "Protocolo de Internet versión 4 (TCP/IPv4)"
4. Marcar "Usar la siguiente dirección IP":
   - IP: `192.168.1.100` (alta, evita choques con las automáticas)
   - Máscara: `255.255.255.0`
   - Puerta de enlace: IP del router (típica `192.168.1.1`)
   - DNS: `8.8.8.8` y `1.1.1.1`
5. Aceptar. El servidor SIEMPRE tendrá `192.168.1.100`.

### Opción B: Reserva DHCP (en el router)
1. Entrar a `192.168.1.1` en el navegador (credenciales en el router).
2. Sección "DHCP" / "Reservas" / "Asignación de IP estática".
3. Asociar la **MAC** del servidor (verla con `ipconfig /all` → "Dirección física") a la IP `192.168.1.100`.
4. Guardar y reiniciar el servidor.

### Recomendación
Conectar el servidor por **cable** y apagar su WiFi (WiFi y Ethernet son adaptadores con MAC distintas → pueden tener IPs distintas). La IP fija aplica igual con cable o WiFi.

---

## 5. Solución 2 — Hostname en la LAN (alternativa/refuerzo)

- Poner nombre de equipo fijo al servidor (ej. `paccioli-server`).
- Con "Detección de redes" activado, los clientes usan `http://paccioli-server:3006` en vez de IP.
- Notable: Android a veces resuelve mal `.local`; el nombre simple suele funcionar.
- La IP cambie o no, **el nombre nunca cambia**.

---

## 6. Solución 3 — Túnel Cloudflare (para Delivery_app externa)

- El túnel **no** corrige la IP de la LAN: resuelve el acceso **desde fuera** (Delivery_app en otra red).
- `cloudflared` en el servidor abre una conexión saliente hacia Cloudflare y la mantiene; si la IP cambia, reconecta solo.
- Cloudflare da una URL pública fija (ej. `https://paccioli.trycloudflare.com`) que no depende de la IP interna.
- La Delivery_app usaría esa URL; los dispositivos internos siguen con la IP fija/hostname.

### Pasos futuros (pendientes)
1. Instalar `cloudflared` en el Windows Server.
2. Ejecutar `cloudflared tunnel --url http://localhost:3006`.
3. Tomar la URL generada y configurarla en la Delivery_app.

---

## 7. Config de cada sistema para la IP fija/hostname

Con el servidor fijo en `192.168.1.100`, esto se configura **1 sola vez**:

| Sistema | Archivo | Valor |
|---------|---------|-------|
| Kiosco | `Sistema_Pedidos_Automatico/.env` | `VITE_API_URL=http://192.168.1.100:3006/api` |
| Cocina | `App_Cocina/.env` | `VITE_API_URL=http://192.168.1.100:3006` |
| Display | `App_Display_Clientes/.env` | `VITE_API_URL=http://192.168.1.100:3006` |
| Admin (caja) | `frontend/src/services/api.js` | `http://192.168.1.100:3006/api` (hardcodeado) |

### ✅ Actualizado (2026-08-20): IP auto-detectada — ya NO hace falta configurar por dispositivo
- Los **4 frontends** ahora usan `window.location.hostname` (API y Socket.IO): conectan al backend usando la misma IP/hostname con el que se abrió la página. El `VITE_API_URL` en `.env` está **comentado/opcional**.
- El **backend** auto-detecta su IP local (`os.networkInterfaces()`) para `PUBLIC_BASE_URL` (imágenes del catálogo hacia Supabase). `PUBLIC_BASE_URL` en `backend/.env` está comentada.
- **Efecto**: si el servidor cambia de IP por DHCP, los dispositivos que abran la página por la IP nueva siguen conectando (ya no dependen de IP vieja en `.env`).

Notas:
- Kiosco usa sufijo `/api`; cocina/display NO.
- Existen fallback hardcodeados en: `App_Cocina/src/App.tsx`, `App_Display_Clientes/src/App.tsx`, `Sistema_Pedidos_Automatico/src/api.ts` y `src/App.tsx`, `frontend/src/services/api.js`, `frontend/src/pages/Productos.jsx` (imágenes), `frontend/src/pages/Pedidos.jsx` (socket). Revisar al pasar a producción con IP fija.

---

## 8. Integración Delivery (Supabase) ↔ POS — estado (2026-08-20)

Ver detalle completo en [`INTEGRACION_DELIVERY_POS.md`](INTEGRACION_DELIVERY_POS.md).

- **Puente de pedidos** (`DeliverySyncService.ts`): polling a Supabase cada 7 s → crea `pedidos`/`delivery` en MySQL y emite Socket.IO (`kitchen:new_order`, `pedidos:changed`, `delivery:changed`). La cocina y el display muestran los pedidos delivery con distintivo **🛵 Delivery**.
- **Fix cocina**: los items de delivery se vinculan por `products.pos_id` → reutilizan el producto real del catálogo POS con su **categoría/puesto reales** (ya no caen en el fallback Puesto 6 / categoría "Delivery" sin puesto).
- **Catálogo POS→Supabase** (`CatalogoSyncService.ts`): upsert cada 15 s (`onConflict: 'pos_id'`), disparo inmediato desde `ProductoController`, y desactivación de productos obsoletos. Migración `05_catalogo_pos.sql` (agrega `products.pos_id` + `updated_at`).
- **Moneda**: la app de delivery usa **bolivianos (Bs)** en todas las pantallas (antes mostraba `$`).
- **Checkout con ubicación obligatoria**: el pedido se bloquea si el cliente no provee coordenadas (necesarias para el repartidor). En Flutter Web por IP/HTTP la geolocalización puede estar bloqueada por el navegador.
- **Imagen de inicio**: se reemplazó el logo de la app (splash/ícono) por un PNG real (`assets/images/iconico.png`, regenerado con `flutter_native_splash` + `flutter_launcher_icons`).

---

## 9. Próximos pasos / pendientes

- [ ] **Inventario** (prioridad actual): cargar catálogo (categorías, productos, inventario/stock) para que kiosco/cocina/display tengan datos.
- [x] **Fix bug 404**: crear ruta pública `POST /api/pedidos/publico` en el backend. ✅ (2026-08-12)
- [x] **App Cocina con login y puesto fijo por cocinero** ✅ (2026-08-12). Pendiente: crear cuentas de cocinero reales + poner IP fija en `.env`.
- [x] **Pantallas Categorías + Puestos de Cocina** (admin, grupo Configuración) ✅ (2026-08-12). Modelo `categorias.puesto_cocina_id`; tabla puente en desuso. Refactor: quitar ids hardcodeados de `Productos.jsx`.
- [x] **Integración Delivery↔POS** (puente + catálogo + fix cocina) ✅ (2026-08-20). Ver sección 8.
- [x] **IP auto-detectada en frontends y backend** ✅ (2026-08-20). Ver sección 7.
- [ ] **Pagos reales kiosco**: validación de payload y registro de pagos. Ver `SEGUIMIENTO_PAGOS_KIOSCO.md`.
- [ ] Prueba E2E completa: pedido kiosco → cocina (socket) → display → cambio de estados en cadena (requiere productos).
- [ ] IP fija en Windows Server 2022 + actualizar `.env` de los 4 sistemas.
- [ ] Túnel Cloudflare para Delivery_app.
- [ ] Presentación 3D (`Documentacion_Visual/`): puerta doble + Caja/POS física ya implementadas; reordenar sistemas usando la puerta como referencia; modelo 3D de referencia del usuario (estilo HomeByMe) pendiente de integrar.