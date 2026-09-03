# Sistema Principal Administrador - Paccioli

Panel de administración completo para la gestión del restaurante. Incluye **backend API** y **frontend dashboard**.

## Requisitos previos (primera vez)

| Programa | Versión | Dónde descargar |
|----------|---------|----------------|
| **Node.js** | v18+ | https://nodejs.org |
| **MySQL** | v5.7+ | https://dev.mysql.com/downloads/ |
| **npm** | v9+ | (viene con Node.js) |
| **Git** | - | https://git-scm.com/ |

## Tecnologías

### Backend
- **Runtime:** Node.js + Express 4
- **Base de datos:** MySQL (mysql2/promise + pool)
- **Autenticación:** JWT (`jsonwebtoken`) + bcrypt — **mismo `JWT_SECRET` que GastroStock** para SSO
- **Tiempo real:** Socket.IO 4
- **Idioma:** TypeScript 5 (arquitectura Laravel-style)
- **Sync:** `DeliverySyncService.ts` (Supabase → MySQL, 7s) + `CatalogoSyncService.ts` (POS → Supabase, 15s). Ver `INTEGRACION_DELIVERY_POS.md`

> ⚠️ **SSO con GastroStock:** Debes configurar el mismo valor en `JWT_SECRET` en ambos `.env` (3006 y 3007) para que el login compartido funcione.

### Frontend
- **Framework:** React 18
- **Build:** Vite 5
- **Estilos:** Tailwind CSS 3
- **Gráficos:** Recharts
- **Íconos:** Lucide React
- **HTTP:** Axios

## Funcionalidades

- **Dashboard** con KPIs, gráficos de ventas y alertas de inventario
- **Gestión de Productos** (CRUD con imágenes)
- **Categorías** de menú
- **Inventario** con movimientos y alertas de stock crítico
- **Pedidos** en tiempo real (mesa, delivery, para llevar)
- **Delivery** con asignación de repartidores
- **Usuarios** con roles (admin, empleado, cocinero, delivery)
- **Cocina** con 6 puestos de trabajo y asignación automática
- **Reportes** con exportación de datos

## Instalación paso a paso

### 1. Base de Datos

```bash
# Crear la base de datos y ejecutar el schema
mysql -u root -p < Sistema_Principal_Administrador/backend/database/schema.sql
```

> Si prefieres migraciones individuales, ejecuta los archivos de `database/migrations/` en orden numérico.

### 2. Backend

```bash
cd Sistema_Principal_Administrador/backend
npm install
cp .env.example .env

# Editar .env:
# DB_HOST=localhost
# DB_USER=root
# DB_PASSWORD=tu_contraseña
# DB_NAME=restaurant_system_db
# JWT_SECRET=tu_clave_secreta (¡mismo valor que GastroStock!)
# PORT=3006

npm run dev
```

- Puerto: `http://localhost:3006`
- Typecheck: `npm run typecheck`

### 3. Frontend Admin

```bash
cd Sistema_Principal_Administrador/frontend
npm install
npm run dev
```

- Puerto: `http://localhost:5173` (fijo en `vite.config.js`)
- Acceso LAN: `--host 0.0.0.0` ya incluido

## Estructura del Backend (Laravel-style)

```
backend/
├── app/
│   ├── Exceptions/          ← Manejador de errores
│   ├── Http/
│   │   ├── Controllers/     ← Lógica de cada endpoint
│   │   ├── Middleware/      ← Auth, roles, uploads
│   │   └── Requests/       ← Validaciones
│   ├── Models/              ← Interfaces TypeScript
│   ├── Providers/           ← Proveedores de servicios
│   └── Services/            ← Lógica de negocio
├── bootstrap/               ← Inicialización
├── config/                  ← Configuración centralizada
├── database/
│   ├── migrations/          ← SQL versionados
│   └── seeds/               ← Datos de ejemplo
├── public/                  ← Entry point
├── resources/lang/          ← Traducciones
├── routes/                  ← Definición de rutas API
├── storage/                 ← Logs y archivos subidos
└── tests/                   ← Pruebas
```

## Roles de Usuario

| Rol | Permisos |
|-----|----------|
| `admin` | Acceso total al sistema |
| `empleado` | Gestión de productos, pedidos, inventario |
| `cocinero` | Visualización y actualización de pedidos en cocina |
| `delivery` | Gestión de entregas |

## API Endpoints

### Autenticación
- `POST /api/auth/login` — Iniciar sesión
- `POST /api/auth/register` — Registrar usuario (admin)
- `GET /api/auth/profile` — Obtener perfil

### Productos
- `GET /api/productos` — Listar productos
- `POST /api/productos` — Crear producto
- `PUT /api/productos/:id` — Actualizar producto
- `DELETE /api/productos/:id` — Desactivar producto

### Pedidos
- `GET /api/pedidos` — Listar pedidos
- `POST /api/pedidos` — Crear pedido
- `PUT /api/pedidos/:id/estado` — Cambiar estado

### Cocina
- `GET /api/cocina/puestos` — Listar puestos
- `GET /api/cocina/pedidos/:puestoId` — Pedidos por puesto
- `PUT /api/cocina/item/:detalleId/estado` — Cambiar estado item

[Ver documentación completa →](backend/README.md)
