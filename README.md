# Restaurante Paccioli POS

Sistema completo de **Punto de Venta (POS)** y **Gestión de Restaurante** para **Paccioli**. Compuesto por 4 módulos web que se comunican con un backend central en tiempo real, más una **app de delivery (Flutter + Supabase)** integrada por un puente.

## Requisitos previos (primera vez)

| Programa | Versión | Dónde descargar |
|----------|---------|----------------|
| **Node.js** | v18+ | https://nodejs.org |
| **MySQL** | v5.7+ | https://dev.mysql.com/downloads/ |
| **npm** | v9+ | (viene con Node.js) |
| **Git** | - | https://git-scm.com/ |

## Módulos del Sistema

| # | Módulo | Propósito | Tecnología |
|---|--------|-----------|------------|
| 1 | **Sistema_Principal_Administrador** | Panel de administración + Backend central | React 18 + Node.js/Express + MySQL |
| 2 | **App_Cocina** | Pantalla de cocina (KDS) para ver pedidos en tiempo real | React 19 + Vite + Socket.IO |
| 3 | **App_Display_Clientes** | Monitor público de pedidos para clientes | React 18 + Vite + Socket.IO |
| 4 | **Sistema_Pedidos_Automatico** | Kiosco de autoservicio para clientes | React 19 + Vite + Tailwind 4 |
| 5 | **Delivery_app** | App móvil de pedidos y reparto a domicilio (clientes + repartidores) | Flutter + Supabase |

> **Delivery_app ↔ POS**: la app móvil usa Supabase como backend propio, pero un **puente** en el backend Express (`DeliverySyncService.ts` + `CatalogoSyncService.ts`) la integra con el restaurante: los pedidos aparecen en cocina/display/admin en tiempo real y el catálogo del POS se sincroniza a la app (moneda en **Bs**). Ver [`INTEGRACION_DELIVERY_POS.md`](INTEGRACION_DELIVERY_POS.md).

## Arquitectura

```
┌─────────────────────────────────────────────────┐
│               RED LOCAL (LAN)                    │
│                                                   │
│  ┌────────── PC Central (Servidor) ───────────┐  │
│  │  Backend Express :3006 ←→ MySQL             │  │
│  │  Admin Frontend :5173                       │  │
│  └─────────────────────────────────────────────┘  │
│                                                   │
│  ┌────────── Tablet Kiosco ────────────────┐     │
│  │  http://IP_DEL_SERVIDOR:3000            │     │
│  └──────────────────────────────────────────────┘ │
│                                                   │
│  ┌────────── TV Display ───────────────────┐     │
│  │  http://IP_DEL_SERVIDOR:5176            │     │
│  └──────────────────────────────────────────────┘ │
│                                                   │
│  ┌────────── Celular Cocina ──────────────┐      │
│  │  http://IP_DEL_SERVIDOR:5175           │      │
│  └──────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────┘
```

Todos los módulos se conectan al **mismo backend** mediante REST API + WebSocket (Socket.IO).

> `IP_DEL_SERVIDOR` es la IP del equipo donde corre el backend. Los frontends **detectan automáticamente** la IP/hostname con el que fueron abiertos (`window.location.hostname`), así que normalmente no necesitas configurar nada por dispositivo. Solo define `VITE_API_URL` en el `.env` si el backend está en otra PC/IP que no coincide con la de la página (ver sección de variables de entorno).

## Instalación paso a paso

### 1. Base de Datos (solo una vez)

```bash
mysql -u root -p < Sistema_Principal_Administrador/backend/database/schema.sql
```

### 2. Backend (PC Central)

```bash
cd Sistema_Principal_Administrador/backend
npm install

# Configurar .env
cp .env.example .env
# Editar: DB_PASSWORD=tu_contraseña_mysql

npm run dev
```

> El backend debe estar **corriendo siempre** en la PC central para que los demás módulos funcionen.

### 3. Frontend Admin (PC Central)

```bash
cd Sistema_Principal_Administrador/frontend
npm install
npm run dev
```

### 4. App Cocina (Tablet/Celular)

```bash
cd App_Cocina
npm install
npm run dev
```

### 5. Display Clientes (TV)

```bash
cd App_Display_Clientes
npm install
npm run dev
```

### 6. Kiosco Autoservicio (Tablet)

```bash
cd Sistema_Pedidos_Automatico
npm install
npm run dev
```

> **Importante:** Los frontends usan `http://localhost:3006` como respaldo. En producción (donde el backend corre en otro equipo o IP), define `VITE_API_URL` con la IP del servidor en el `.env` de cada frontend (ver sección de variables de entorno).

## Tecnologías Compartidas

| Tecnología | Uso |
|------------|-----|
| **React** | Frontend de todos los módulos |
| **Socket.IO** | Comunicación en tiempo real |
| **Tailwind CSS** | Estilos y diseño UI |
| **Vite** | Build tool y dev server |
| **Lucide React** | Íconos |
| **JWT** | Autenticación entre módulos |

## Puertos por Defecto

| Módulo | Puerto |
|--------|--------|
| Backend API | `3006` |
| Admin Frontend | `5173` |
| App Cocina | `5175` |
| Display Clientes | `5176` |
| Kiosco Autoservicio | `3000` |

## Configuración de variables de entorno

Cada proyecto frontend **puede** leer la URL del backend desde un archivo `.env`:

```env
VITE_API_URL=http://IP_DEL_SERVIDOR:3006
```

> **Opcional:** `VITE_API_URL` es opcional. Si no se define, el frontend usa la **IP/hostname con el que se abrió la página** (`window.location.hostname`) contra el puerto del backend (y `http://localhost:3006` como respaldo en desarrollo local). De esta forma, si el servidor cambia de IP por DHCP, los dispositivos siguen conectando mientras abran la página por su IP/hostname actual. En producción con el backend en otra PC define la IP del servidor (ver `GUIA_CONFIGURACION_WINDOWS_SERVER.md`).

- **Sistema_Principal_Administrador/backend** → `.env` (credenciales MySQL + JWT + Supabase para el puente)
- **Sistema_Principal_Administrador/frontend** → `.env` (opcional: `VITE_API_URL`)
- **App_Cocina** → `.env` (opcional: `VITE_API_URL`)
- **App_Display_Clientes** → `.env` (opcional: `VITE_API_URL`)
- **Sistema_Pedidos_Automatico** → `.env` (opcional: `VITE_API_URL`)

Cada proyecto incluye un `.env.example` como plantilla. Copia y renombra a `.env`:

```bash
cp .env.example .env
```

Las imágenes de productos se sirven desde el backend en `/uploads` y se arman con la IP de `VITE_API_URL` (ya no están hardcodeadas a `localhost`). Para la app de delivery, la URL pública de las imágenes la auto-detecta el backend (`PUBLIC_BASE_URL`, opcional en `.env`).

## Despliegue en Windows Server 2022

Ver la guía completa en [`GUIA_CONFIGURACION_WINDOWS_SERVER.md`](GUIA_CONFIGURACION_WINDOWS_SERVER.md): IP fija, MySQL, build de los 4 frontends, `serve`, firewall y auto-arranque con PM2 para el servidor local del restaurante.

## Contribuir

1. Haz fork del proyecto
2. Crea tu rama (`git checkout -b feature/nueva-funcionalidad`)
3. Commit (`git commit -m 'feat: agrega nueva funcionalidad'`)
4. Push (`git push origin feature/nueva-funcionalidad`)
5. Abre un Pull Request

## Licencia

MIT © Restaurante Paccioli
