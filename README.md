# Restaurante Paccioli POS

Sistema completo de **Punto de Venta (POS)** y **Gestión de Restaurante** para **Paccioli**. Compuesto por 4 módulos web que se comunican con un backend central en tiempo real, más una **app de delivery (Flutter + Supabase)** integrada por un puente.

## Requisitos previos (primera vez)

| Programa | Versión | Dónde descargar |
|----------|---------|----------------|
| **Node.js** | v20+ (LTS) | https://nodejs.org |
| **MySQL** | v8.0+ | https://dev.mysql.com/downloads/ |
| **npm** | v10+ | (viene con Node.js) |
| **Git** | - | https://git-scm.com/ |
| **PM2** | Latest | `npm install -g pm2` |
| **serve** | Latest | `npm install -g serve` |

> **Sistema Operativo recomendado:** Linux Debian 12 (Bookworm) / Ubuntu 22.04+ para el servidor. Los frontends funcionan en cualquier navegador moderno.

## Módulos del Sistema

| # | Módulo | Propósito | Tecnología |
|---|--------|-----------|------------|
| 1 | **Sistema_Principal_Administrador** | Panel de administración + Backend central | React 19 + Node.js/Express + TypeScript + MySQL |
| 2 | **App_Cocina** | Pantalla de cocina (KDS) para ver pedidos en tiempo real | React 19 + Vite + Socket.IO + TailwindCSS 4 |
| 3 | **App_Display_Clientes** | Monitor público de pedidos para clientes | React 19 + Vite + Socket.IO + TailwindCSS 4 |
| 4 | **Sistema_Pedidos_Automatico** | Kiosco de autoservicio para clientes | React 19 + Vite + TailwindCSS 4 |
| 5 | **Delivery_app** | App móvil de pedidos y reparto a domicilio (clientes + repartidores) | Flutter + Supabase |
| 6 | **App_GastroStock** | Gestión de inventarios y stock | React + Node.js + MySQL |

> **Delivery_app ↔ POS**: la app móvil usa Supabase como backend propio, pero un **puente** en el backend Express (`DeliverySyncService.ts` + `CatalogoSyncService.ts`) la integra con el restaurante: los pedidos aparecen en cocina/display/admin en tiempo real y el catálogo del POS se sincroniza a la app (moneda en **Bs**). Ver [`INTEGRACION_DELIVERY_POS.md`](INTEGRACION_DELIVERY_POS.md).

## Arquitectura

```
┌─────────────────────────────────────────────────┐
│               RED LOCAL (LAN)                    │
│                                                   │
│  ┌────────── Servidor Linux Debian ───────────┐  │
│  │  Backend Express :3006 ←→ MySQL 8.0        │  │
│  │  Admin Frontend :5173 (servido con serve)  │  │
│  │  Kiosko :3000 (servido con serve)          │  │
│  │  Cocina :5175 (servido con serve)          │  │
│  │  Display :5176 (servido con serve)         │  │
│  │  PM2: gestión de procesos + auto-arranque  │  │
│  └─────────────────────────────────────────────┘  │
│                                                   │
│  ┌────────── Tablet Kiosco ────────────────┐     │
│  │  http://IP_SERVIDOR:3000                │     │
│  └──────────────────────────────────────────────┘ │
│                                                   │
│  ┌────────── TV Display ───────────────────┐     │
│  │  http://IP_SERVIDOR:5176                │     │
│  └──────────────────────────────────────────────┘ │
│                                                   │
│  ┌────────── Tablet/Celular Cocina ────────┐      │
│  │  http://IP_SERVIDOR:5175                │      │
│  └──────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────┘
```

Todos los módulos se conectan al **mismo backend** mediante REST API + WebSocket (Socket.IO).

> `IP_SERVIDOR` es la IP del equipo donde corre el backend (ej: `192.168.137.50`). Los frontends **detectan automáticamente** la IP/hostname con el que fueron abiertos (`window.location.hostname`), así que normalmente no necesitas configurar nada por dispositivo. Solo define `VITE_API_URL` en el `.env` si el backend está en otra PC/IP que no coincide con la de la página (ver sección de variables de entorno).

## Instalación paso a paso (Servidor Linux Debian)

### 1. Preparar el servidor

```bash
# Actualizar sistema
sudo apt update && sudo apt upgrade -y

# Instalar dependencias base
sudo apt install -y git build-essential python3 curl

# Node.js 22 LTS
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs

# MySQL 8.0
sudo apt install -y mysql-server
sudo mysql_secure_installation

# PM2 y serve globales
sudo npm install -g pm2 serve
```

### 2. Base de Datos (solo una vez)

```bash
# Clonar o copiar el proyecto al servidor
cd /home/tu_usuario
git clone <tu-repo> Restaurante_Paccioli
# O copiar la carpeta completa del proyecto

# Crear BD e importar schema limpio
cd /home/tu_usuario/Restaurante_Paccioli/Sistema_Principal_Administrador/backend
sudo mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS restaurant_system_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
sudo mysql -u root -p restaurant_system_db < database/schema_limpio.sql
```

### 3. Backend (Servidor Central)

```bash
cd /home/tu_usuario/Restaurante_Paccioli/Sistema_Principal_Administrador/backend
npm install

# Configurar .env
cp .env.example .env
# Editar: DB_PASSWORD=tu_contraseña_mysql, JWT_SECRET=secreto_seguro, etc.

# Compilar TypeScript (producción)
npm run build

# Iniciar con PM2
pm2 start "npm run start" --name pos-backend
```

> El backend debe estar **corriendo siempre** en el servidor para que los demás módulos funcionen.

### 4. Frontend Admin (Panel POS)

```bash
cd /home/tu_usuario/Restaurante_Paccioli/Sistema_Principal_Administrador/frontend
npm install
npm run build            # Genera carpeta dist/
pm2 start "serve -s dist -l 5173" --name pos-admin
```

### 5. App Cocina (Tablet/Celular - KDS)

```bash
cd /home/tu_usuario/Restaurante_Paccioli/App_Cocina
npm install
npm run build
pm2 start "serve -s dist -l 5175" --name pos-cocina
```

### 6. Display Clientes (TV)

```bash
cd /home/tu_usuario/Restaurante_Paccioli/App_Display_Clientes
npm install
npm run build
pm2 start "serve -s dist -l 5176" --name pos-display
```

### 7. Kiosco Autoservicio (Tablet)

```bash
cd /home/tu_usuario/Restaurante_Paccioli/Sistema_Pedidos_Automatico
npm install
npm run build
pm2 start "serve -s dist -l 3000" --name pos-kiosko
```

### 8. Configurar auto-arranque (importante)

```bash
# Generar servicio systemd para PM2
pm2 startup systemd -u $USER --hp $HOME
# Ejecuta el comando que te muestra (con sudo)

# Guardar procesos actuales
pm2 save
```

### 9. Firewall (UFW)

```bash
sudo ufw enable
sudo ufw allow 22/tcp      # SSH
sudo ufw allow 3006/tcp    # API + Socket.IO
sudo ufw allow 5173/tcp    # Admin
sudo ufw allow 3000/tcp    # Kiosko
sudo ufw allow 5175/tcp    # Cocina
sudo ufw allow 5176/tcp    # Display
# MySQL 3306 NO se expone (solo localhost)
```

---

## Inicio rápido (después de la instalación completa)

Una vez instalado todo, para iniciar el sistema completo:

```bash
cd /home/tu_usuario/Restaurante_Paccioli
./INICIAR_SISTEMA.sh
```

O manualmente:
```bash
pm2 start all
```

Para ver estado:
```bash
pm2 list
pm2 logs
pm2 monit
```

---

## Tecnologías Compartidas

| Tecnología | Uso |
|------------|-----|
| **React 19** | Frontend de todos los módulos web |
| **Node.js / Express** | Backend API REST |
| **TypeScript** | Tipado estático en backend y frontends |
| **Socket.IO** | Comunicación en tiempo real |
| **Tailwind CSS 4** | Estilos y diseño UI |
| **Vite 6** | Build tool y dev server |
| **Lucide React** | Íconos |
| **JWT + bcrypt** | Autenticación y passwords |
| **MySQL 8 + mysql2** | Base de datos relacional |
| **PM2** | Gestión de procesos en producción |
| **serve** | Servidor estático para frontends compilados |

## Puertos por Defecto

| Módulo | Puerto | Comando PM2 |
|--------|--------|-------------|
| Backend API | `3006` | `pos-backend` |
| Admin Frontend | `5173` | `pos-admin` |
| App Cocina | `5175` | `pos-cocina` |
| Display Clientes | `5176` | `pos-display` |
| Kiosco Autoservicio | `3000` | `pos-kiosko` |

## Configuración de variables de entorno

Cada proyecto frontend **puede** leer la URL del backend desde un archivo `.env`:

```env
VITE_API_URL=http://IP_DEL_SERVIDOR:3006
```

> **Opcional:** `VITE_API_URL` es opcional. Si no se define, el frontend usa la **IP/hostname con el que se abrió la página** (`window.location.hostname`) contra el puerto del backend (y `http://localhost:3006` como respaldo en desarrollo local). De esta forma, si el servidor cambia de IP por DHCP, los dispositivos siguen conectando mientras abran la página por su IP/hostname actual. En producción con el backend en otra PC define la IP del servidor.

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

## Despliegue en Linux Debian (Producción)

Ver la guía completa en [`GUIA_CONFIGURACION_LINUX_DEBIAN.md`](GUIA_CONFIGURACION_LINUX_DEBIAN.md): IP fija, MySQL, build de los 4 frontends, `serve`, firewall UFW y auto-arranque con PM2 para el servidor local del restaurante.

## Scripts útiles

```bash
# Iniciar todo el sistema
./INICIAR_SISTEMA.sh

# Ver estado
pm2 list

# Logs
pm2 logs
pm2 logs pos-backend

# Reiniciar todo
pm2 restart all

# Detener todo
pm2 stop all

# Actualizar y recompilar (tras git pull)
cd /ruta/proyecto
git pull
# Backend
cd Sistema_Principal_Administrador/backend && npm install && npm run build
# Frontends
cd ../frontend && npm install && npm run build
cd ../../Sistema_Pedidos_Automatico && npm install && npm run build
cd ../App_Cocina && npm install && npm run build
cd ../App_Display_Clientes && npm install && npm run build
# Reiniciar PM2
pm2 restart all
```

## Contribuir

1. Haz fork del proyecto
2. Crea tu rama (`git checkout -b feature/nueva-funcionalidad`)
3. Commit (`git commit -m 'feat: agrega nueva funcionalidad'`)
4. Push (`git push origin feature/nueva-funcionalidad`)
5. Abre un Pull Request

## Licencia

MIT © Restaurante Paccioli