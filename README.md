# Restaurante Paccioli POS

Sistema completo de **Punto de Venta (POS)** y **Gestión de Restaurante** para **Paccioli**. Compuesto por 4 módulos independientes que se comunican con un backend central en tiempo real.

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
│  │  http://192.168.1.100:3000              │     │
│  └──────────────────────────────────────────────┘ │
│                                                   │
│  ┌────────── TV Display ───────────────────┐     │
│  │  http://192.168.1.100:5176              │     │
│  └──────────────────────────────────────────────┘ │
│                                                   │
│  ┌────────── Celular Cocina ──────────────┐      │
│  │  http://192.168.1.100:5175             │      │
│  └──────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────┘
```

Todos los módulos se conectan al **mismo backend** mediante REST API + WebSocket (Socket.IO).

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
cp .env.example .env
# Editar: VITE_API_URL=http://192.168.1.100:3006
npm run dev
```

### 5. Display Clientes (TV)

```bash
cd App_Display_Clientes
npm install
cp .env.example .env
# Editar: VITE_API_URL=http://192.168.1.100:3006
npm run dev
```

### 6. Kiosco Autoservicio (Tablet)

```bash
cd Sistema_Pedidos_Automatico
npm install
cp .env.example .env
# Editar: VITE_API_URL=http://192.168.1.100:3006/api
npm run dev
```

> **Importante:** En cada dispositivo (tablet, TV, celular) reemplaza `localhost` por la **IP real** de la PC donde corre el backend.

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

Cada proyecto frontend lee la URL del backend desde un archivo `.env`:

```env
VITE_API_URL=http://IP_DEL_SERVIDOR:3006
```

- **Sistema_Principal_Administrador/backend** → `.env` (credenciales MySQL + JWT)
- **App_Cocina** → `.env` (solo `VITE_API_URL`)
- **App_Display_Clientes** → `.env` (solo `VITE_API_URL`)
- **Sistema_Pedidos_Automatico** → `.env` (solo `VITE_API_URL`)

Cada proyecto incluye un `.env.example` como plantilla. Copia y renombra a `.env`:

```bash
cp .env.example .env
```

## Contribuir

1. Haz fork del proyecto
2. Crea tu rama (`git checkout -b feature/nueva-funcionalidad`)
3. Commit (`git commit -m 'feat: agrega nueva funcionalidad'`)
4. Push (`git push origin feature/nueva-funcionalidad`)
5. Abre un Pull Request

## Licencia

MIT © Restaurante Paccioli
