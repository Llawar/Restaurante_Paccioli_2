# GastroStock — Sistema de Gestión de Inventario (Kardex Físico Valorado)

Módulo **independiente** de inventario de almacén: control de insumos, lotes (PEPS), 
compras, kardex físico valorado, inventario físico y auditoría.

## ⚠️ Arquitectura Importante: Base de Datos Separada

| Componente | Valor |
|------------|-------|
| **Base de datos** | `restaurante_inventarios_db` (independiente del POS) |
| **Puerto Backend** | `3007` |
| **Puerto Frontend** | `5177` |
| **Autenticación** | Proxy SSO a `http://localhost:3006` (Principal) |
| **Tabla usuarios** | ❌ **NO existe** — validación vía JWT del Principal |

---

## 1. Requisitos

- **Node.js** (versión 18 o superior)
- **MySQL** (8.0 recomendado)
- **Git** (para clonar el proyecto, si aplica)

---

## 2. Base de datos (restaurante_inventarios_db)

**Importante:** Desde la migración a BD separada, **el script NO crea tabla `usuarios`**. Esa tabla vive en `restaurant_system_db` (Sistema Principal).

### Crear la base de datos

```bash
# Crear BD vacía
mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS restaurante_inventarios_db;"

# Ejecutar migraciones (15 tablas gastro_*)
mysql -u root -p restaurante_inventarios_db < backend/database/migrations/001_gastrostock_schema.sql
mysql -u root -p restaurante_inventarios_db < backend/database/migrations/002_gastrostock_indexes.sql
```

> ⚠️ **Crítico:** El `.env` del backend debe tener el **mismo** `JWT_SECRET` 
> que el Sistema Principal (`Sistema_Principal_Administrador/backend/.env`), 
> ya que el login es proxy.

### Estructura de la BD (15 tablas gastro_*)

No incluye `usuarios` (eliminado FK cross-db). Los `usuario_id` en `gastro_compras`, 
`gastro_movimientos_kardex`, etc., son solo campos INT sin FK (el JWT los valida).

---

## 3. Configuración del entorno

### Backend

1. Copia `backend/.env.example` como `backend/.env` y configura:

```env
# IMPORTANTE: Usar BD separada
DB_NAME=restaurante_inventarios_db
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=tu_password

# CRÍTICO: Mismo secreto que el Principal para SSO
JWT_SECRET=restaurant_jwt_secret_key_2024
PORT=3007

# Proxy de autenticación (opcional, default funciona)
PRINCIPAL_API_URL=http://localhost:3006/api/auth/login
```

2. Instala y corre:
```bash
cd backend
npm install
npm run dev
```

**Login:** El frontend envía credenciales al backend Gastro (3007), y este 
hace **proxy interno** al Principal (3006) para validar. Necesitas que 
ambos backends estén corriendo.

### Frontend

El frontend apunta a `http://localhost:3007/api` por defecto, así que
**no necesitas crear** `.env`. Solo crea `frontend\.env` (desde
`frontend\.env.example`) si tu backend corre en otro host/puerto.

---

## 4. Instalación de dependencias y arranque

Abre **dos terminales**.

### Terminal 1 — Backend

```bash
cd backend
npm install
npm run dev
```

Debes ver: `Conexión a MySQL exitosa (GastroStock)` y el servidor en el
puerto `3007`.

### Terminal 2 — Frontend

```bash
cd frontend
npm install
npm run dev
```

Abre: `http://localhost:5177` (puerto fijo definido en `vite.config.js`)

---

## 5. Iniciar sesión (SSO con el Principal)

No hay usuarios locales. Usa las credenciales del **Sistema Principal**
(ej: `admin` / `admin123` si ese usuario existe en `restaurant_system_db`).

> ⚠️ Si el Sistema Principal (puerto 3006) está apagado, el login devolverá:
> `503 - Sistema Principal no disponible para autenticar`
> Asegúrate de tener ambos backends corriendo.

---

## 6. Orden sugerido para la demostración (paso a paso)

La base está vacía, así que puedes mostrar el ciclo completo ya que
cada módulo depende de los anteriores:

1. **Categorías** → crear una categoría (ej. `Ingredientes`).
2. **Subcategorías** → crear una subcategoría (ej. `Carnes`) asignada a la categoría.
3. **Unidades de medida** → crear una unidad (ej. `Kilogramo` / `Kg`).
4. **Ubicaciones** → crear una ubicación (ej. `A-01`, tipo Estantería/Refrigerador).
5. **Proveedores** → crear un proveedor.
6. **Productos** → crear un producto (definir unidad, stock mínimo, ubicación).
7. **Compras** → registrar una compra con su producto y cantidad (genera el lote).
8. **Lotes** → se generan automáticamente al comprar; se controlan por PEPS.
9. **Kardex** → ver la tarjeta físico valorada del producto (control físico,
   P/U, control valorado, totales y verificación).
10. **Consumo/Salida** → registrar una salida (modifica el kardex, el saldo y el lote).
11. **Inventario físico** → crear un conteo y ajustar diferencias.
12. **Alertas** y **Auditoría** → revisar notificaciones y trazabilidad.

---

## 7. Comandos útiles

| Acción               | Backend (`backend`)          | Frontend (`frontend`) |
|----------------------|------------------------------|-----------------------|
| Instalar dependencias| `npm install`                | `npm install`         |
| Arrancar en dev      | `npm run dev` (puerto 3007)  | `npm run dev` (puerto 5177)  |
| Compilar             | `npm run build`              | `npm run build`       |
| Verificar tipos      | `npm run typecheck`          | —                     |

---

## 8. Integración con el Sistema Principal (POS)

### Consumo de insumos automático

Cuando el **Sistema Principal** (POS) crea un pedido, descuenta automáticamente
de este inventario via **tabla puente**:

1. `receta_detalle` (en `restaurant_system_db`): Mapea platillos del menú → insumos
2. `sync_consumo_cola`: Cola de despacho si GastroStock está caído

**Flujo:**
```
Cliente pide 'Milanesa' en POS → 
Principal lee receta_detalle (Milanesa → 0.25kg Carne, 0.05kg Pan) →
INSERT sync_consumo_cola → GastroRecibe POST /api/gastro/kardex/salida
```

### Archivos clave

- `013_gastro_integracion.sql` (en Principal) crea las tablas puente
- `app/Services/GastroSyncService.ts` — Envía consumos a este backend
- `app/Http/Controllers/RecetaController.ts` — Admin de recetas
