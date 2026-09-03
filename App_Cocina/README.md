# App Cocina (KDS) - Paccioli

**Kitchen Display System** — Pantalla táctil para el personal de cocina. Muestra los pedidos entrantes en tiempo real y permite cambiar su estado.

## Requisitos previos (primera vez)

| Programa | Versión | Dónde descargar |
|----------|---------|----------------|
| **Node.js** | v18+ | https://nodejs.org |
| **npm** | v9+ | (viene con Node.js) |
| **Git** | - | https://git-scm.com/ |

## Tecnologías

- **Framework:** React **19** (package.json: `react: ^19.0.0`)
- **Build:** Vite **6** (`vite: ^6.0.5`)
- **Estilos:** Tailwind CSS **4** (@tailwindcss/vite)
- **Tiempo real:** Socket.IO Client
- **Íconos:** Lucide React
- **Idioma:** TypeScript

## Funcionalidades

- **Selección de puesto de cocina** (6 puestos disponibles)
- **Visualización de pedidos** en tiempo real por puesto asignado
- **Cambio de estado** de cada item:
  - `pendiente` → `en_preparacion` (Empezar)
  - `en_preparacion` → `listo` (Listo)
- **Notificación sonora** al recibir nuevo pedido
- **Pedidos de delivery** (app móvil) con distintivo 🛵 — llegan vía puente Supabase→POS y se asignan al puesto real de su producto
- **Interfaz táctil** optimizada para tablets y celulares
- **Actualización automática** vía WebSocket

> 💡 **IP automática:** esta app detecta la IP/hostname con el que se abrió la página; no hace falta configurar `.env` por dispositivo (solo si el backend está en otra IP).

## Instalación paso a paso

```bash
cd App_Cocina
npm install

# Opcional: si el backend no está en localhost
cp .env.example .env
# VITE_API_URL=http://IP_DEL_PC:3006

npm run dev
```

**Puerto fijo:** `5175` (definido en `package.json`: `"dev": "vite --host 0.0.0.0 --port 5175"`)

## Configuración del Backend

Esta app se conecta al backend central del restaurante en **dos formas**:

1. **API REST** → para cargar puestos y pedidos
2. **WebSocket (Socket.IO)** → para actualizaciones en tiempo real

Ambas usan la misma URL base definida en `.env`:

```env
VITE_API_URL=http://localhost:3006
```

Si el backend está en otra PC de la red, usa su IP local:
```env
VITE_API_URL=http://192.168.1.100:3006
```

## Puertos

| Servicio | Puerto | Comando |
|----------|--------|---------|
| **Esta app** | `5175` | `npm run dev` |
| Backend Principal | `3006` | En `Sistema_Principal_Administrador/backend` |
