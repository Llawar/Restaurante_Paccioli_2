# Kiosco de Pedidos Automático - Paccioli

**Sistema de autoservicio** — Kiosco táctil para que los clientes realicen sus pedidos sin necesidad de un mesero. Ideal para tablets en modo horizontal (landscape).

> 📖 Documentación completa:
> - 👤 [**MANUAL_USUARIO.md**](./MANUAL_USUARIO.md) — guía para clientes y personal del restaurante.
> - ⚙️ [**MANUAL_TECNICO.md**](./MANUAL_TECNICO.md) — instalación, estructura, configuración y solución de problemas técnicos.

## Requisitos previos (primera vez)

| Programa | Versión | Dónde descargar |
|----------|---------|----------------|
| **Node.js** | v18+ | https://nodejs.org |
| **npm** | v9+ | (viene con Node.js) |
| **Git** | - | https://git-scm.com/ |

## Tecnologías

- **Framework:** React 19
- **Build:** Vite 6
- **Estilos:** Tailwind CSS 4
- **Animaciones:** Motion (Framer Motion)
- **Tiempo real:** Socket.IO Client
- **Íconos:** Lucide React
- **Idioma:** TypeScript

## Funcionalidades

- **Pantalla de inicio** con splash y acceso al menú
- **Menú categorizado:** Platos, Bebidas, Postres
- **Búsqueda** de productos por nombre
- **Modal de detalle** con imagen, descripción y selector de cantidad
- **Carrito de compras** con resumen y ajuste de cantidades
- **Checkout** con cálculo de impuestos (10%)
- **Simulación de pago QR** con temporizador de 10 minutos
- **Confirmación** con número de pedido
- **Actualización en tiempo real** de productos vía WebSocket
- **Placeholder de imagen local** (SVG) si un producto no tiene imagen

## Instalación paso a paso

```bash
# 1. Clonar (si no lo has hecho)
git clone https://github.com/tu-usuario/paccioli-pos.git
cd paccioli-pos/Sistema_Pedidos_Automatico

# 2. Instalar dependencias
npm install

# 3. Configurar URL del Backend (opcional)
cp .env.example .env
# Editar .env solo si el backend está en otra IP distinta a la de la página
# Ejemplo: VITE_API_URL=http://192.168.1.100:3006/api

# 4. Iniciar
npm run dev
```

## Configuración del Backend

Esta app se conecta al backend central del restaurante. Detecta automáticamente la **IP/hostname con el que se abrió la página** (`window.location.hostname`); `VITE_API_URL` es opcional y solo se define si el backend está en otra IP:

```env
VITE_API_URL=http://192.168.1.100:3006/api
```

Además, se suscribe por **WebSocket** (Socket.IO) para recibir actualizaciones de productos en tiempo real, con reconexión automática infinita.

## Variables de entorno

| Variable | Descripción | Ejemplo |
|----------|-------------|---------|
| `VITE_API_URL` | URL base de la API del backend (opcional) | `http://192.168.1.100:3006/api` |
| `GEMINI_API_KEY` | Clave de API usada en el build (`vite.config.ts`) | - |
| `DISABLE_HMR` | Si es `true`, desactiva el Hot Module Replacement (útil en producción) | `true` |

## Puertos

| Servicio | Puerto |
|----------|--------|
| Dev server (esta app, Vite) | **`5174`** (fijo) |
| Backend API | `3006` |

## Configuración de red (vite.config.ts)

- **`host: '0.0.0.0'`** → el servidor se abre a toda la **red LAN** (varias tablets pueden acceder).
- **`port: 5174`** → puerto fijo para el kiosco.
- **`allowedHosts: ['restaurante-paccioli-server.duckdns.org']`** → permite el acceso mediante el subdominio de **DuckDNS**.
- **`hmr`** → controlado por la variable `DISABLE_HMR`.

## Scripts disponibles

| Comando | Descripción |
|---------|-------------|
| `npm run dev` | Arranca el servidor de desarrollo (puerto 5174) |
| `npm run build` | Compila la aplicación para producción |
| `npm run preview` | Previsualiza la compilación de producción |
| `npm run clean` | Elimina la carpeta `dist/` |
| `npm run lint` | Verificación de tipos con TypeScript (`tsc --noEmit`) |
