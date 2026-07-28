# Sistema de Administración para Restaurante - Backend

Backend modular y escalable para sistema de administración de restaurante, construido con Node.js, Express y MySQL.

## 🚀 Características

- **Autenticación JWT**: Sistema seguro de login con tokens JWT
- **Control de Roles**: Admin, empleado, cocinero, delivery
- **Gestión de Categorías**: CRUD completo con soft delete
- **Estructura Modular**: Preparado para escalar a productos, inventario y pedidos
- **Consultas SQL Directas**: Sin ORM, máximo control
- **API RESTful**: Endpoints organizados y documentados

## 📁 Estructura del Proyecto

```
backend/
├── src/
│   ├── config/
│   │   └── db.js              # Conexión a MySQL
│   ├── controllers/           # Lógica de controladores
│   ├── middleware/            # Middleware de auth y roles
│   ├── routes/                # Definición de rutas
│   ├── services/              # Lógica de negocio adicional
│   ├── app.js                 # Configuración Express
│   └── server.js              # Punto de entrada
├── database/
│   └── schema.sql             # Esquema de base de datos
├── .env                       # Variables de entorno
└── package.json
```

## 🛠️ Tecnologías

- Node.js
- Express.js
- MySQL2 (con pool de conexiones)
- bcrypt (encriptación de contraseñas)
- jsonwebtoken (JWT)
- cors
- dotenv

## 📋 Requisitos Previos

- Node.js (v14 o superior)
- MySQL (v5.7 o superior)

## 🔧 Instalación

1. **Clonar o descargar el proyecto**

2. **Instalar dependencias:**
```bash
cd backend
npm install
```

3. **Configurar base de datos:**
   - Crear base de datos `restaurant_system_db`
   - Ejecutar el script `database/schema.sql`
   - (Opcional) Modificar el archivo `.env` con tus credenciales

4. **Configurar variables de entorno:**
El archivo `.env` ya está configurado con valores por defecto:
```env
PORT=3000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=restaurant_system_db
JWT_SECRET=restaurant_jwt_secret_key_2024
JWT_EXPIRES_IN=24h
```

5. **Crear usuario admin:**
Ejecuta este SQL para crear el usuario admin (contraseña: admin123):
```sql
USE restaurant_system_db;
INSERT INTO usuarios (nombre, usuario, password, email, rol, activo) VALUES 
('Administrador', 'admin', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin@restaurante.com', 'admin', 1);
```

6. **Iniciar servidor:**
```bash
# Modo producción
npm start

# Modo desarrollo (con nodemon)
npm run dev
```

## 🌐 Endpoints API

### Autenticación
| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| POST | `/api/auth/login` | Iniciar sesión | No |
| POST | `/api/auth/register` | Registrar usuario | Sí (Admin) |
| GET | `/api/auth/profile` | Obtener perfil | Sí |

### Categorías
| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| GET | `/api/categorias` | Listar categorías | Sí |
| GET | `/api/categorias/:id` | Obtener categoría | Sí |
| POST | `/api/categorias` | Crear categoría | Sí (Empleado+) |
| PUT | `/api/categorias/:id` | Actualizar categoría | Sí (Empleado+) |
| DELETE | `/api/categorias/:id` | Eliminar categoría (soft) | Sí (Empleado+) |

### Productos
| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| GET | `/api/productos` | Listar productos | Sí |
| GET | `/api/productos/:id` | Obtener producto | Sí |
| GET | `/api/productos/categoria/:id` | Por categoría | Sí |
| POST | `/api/productos` | Crear producto | Sí (Empleado+) |
| PUT | `/api/productos/:id` | Actualizar | Sí (Empleado+) |
| DELETE | `/api/productos/:id` | Eliminar (soft) | Sí (Empleado+) |

### Pedidos
| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| GET | `/api/pedidos` | Listar pedidos | Sí |
| GET | `/api/pedidos/:id` | Obtener pedido | Sí |
| POST | `/api/pedidos` | Crear pedido | Sí (Empleado+) |
| PUT | `/api/pedidos/:id/estado` | Cambiar estado | Sí (Empleado+) |

### Inventario
| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| GET | `/api/inventario` | Ver inventario | Sí |
| GET | `/api/inventario/producto/:id` | Por producto | Sí |
| GET | `/api/inventario/producto/:id/movimientos` | Movimientos | Sí |
| PUT | `/api/inventario/producto/:id/stock` | Actualizar stock | Sí (Empleado+) |

### Usuarios (Admin)
| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| GET | `/api/usuarios` | Listar usuarios | Sí (Admin) |
| GET | `/api/usuarios/:id` | Obtener usuario | Sí (Admin) |
| PUT | `/api/usuarios/:id` | Actualizar | Sí (Admin) |
| DELETE | `/api/usuarios/:id` | Desactivar | Sí (Admin) |
| PUT | `/api/usuarios/:id/password` | Cambiar password | Sí (Admin) |

### Delivery
| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| GET | `/api/delivery` | Listar deliveries | Sí (Empleado+) |
| GET | `/api/delivery/:id` | Obtener delivery | Sí (Empleado+) |
| POST | `/api/delivery` | Crear delivery | Sí (Empleado+) |
| PUT | `/api/delivery/:id/asignar` | Asignar repartidor | Sí (Empleado+) |
| PUT | `/api/delivery/:id/estado` | Cambiar estado | Sí (Delivery+) |

## 🔒 Roles y Permisos

| Rol | Permisos |
|-----|----------|
| `admin` | Acceso total a todos los endpoints |
| `empleado` | CRUD de categorías, productos, pedidos, inventario, delivery |
| `cocinero` | Ver pedidos, actualizar estados de preparación |
| `delivery` | Ver y actualizar estados de delivery |

## 🧪 Testing

Para probar el API puedes usar:

1. **Postman** o **Insomnia**
2. **cURL**:
```bash
# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"usuario":"admin","password":"admin123"}'

# Crear categoría
curl -X POST http://localhost:3000/api/categorias \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"nombre":"Nueva Categoria","descripcion":"Descripción"}'
```

## 📝 Notas

- Todas las eliminaciones son **soft delete** (campo `activo = 0`)
- El sistema está preparado para múltiples clientes: admin, POS, delivery, sistema automático
- Usar `async/await` en todas las consultas
- Manejo de errores con `try/catch`

## 🚀 Próximos Pasos

- [ ] Implementar WebSockets para notificaciones en tiempo real
- [ ] Agregar sistema de facturación
- [ ] Implementar reportes y estadísticas
- [ ] Agregar soporte para múltiples sucursales
- [ ] Integrar pasarelas de pago
