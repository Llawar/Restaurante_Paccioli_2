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
- **Runtime:** Node.js con Express
- **Base de datos:** MySQL (con mysql2 + pool de conexiones)
- **Autenticación:** JWT + bcrypt
- **Tiempo real:** Socket.IO
- **Idioma:** TypeScript (estructura Laravel-style)
- **Integración Delivery↔POS:** `DeliverySyncService.ts` (pedidos de la app móvil → MySQL + Socket.IO) y `CatalogoSyncService.ts` (catálogo POS → Supabase, 15 s). Ver `INTEGRACION_DELIVERY_POS.md`.

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

# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env

# Editar .env con tus credenciales MySQL:
# DB_HOST=localhost
# DB_USER=root
# DB_PASSWORD=tu_contraseña
# DB_NAME=restaurant_system_db

# Iniciar servidor
npm run dev
```

El backend arrancará en `http://localhost:3006`.

### 3. Frontend Admin

```bash
cd Sistema_Principal_Administrador/frontend

# Instalar dependencias
npm install

# Iniciar
npm run dev
```

El frontend arrancará en `http://localhost:5173`.

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
