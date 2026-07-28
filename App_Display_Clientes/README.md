# App Display Clientes - Paccioli

**Monitor público de pedidos** — Pantalla grande para que los clientes vean el estado de sus pedidos en tiempo real.

## Requisitos previos (primera vez)

| Programa | Versión | Dónde descargar |
|----------|---------|----------------|
| **Node.js** | v18+ | https://nodejs.org |
| **npm** | v9+ | (viene con Node.js) |
| **Git** | - | https://git-scm.com/ |

## Tecnologías

- **Framework:** React 18
- **Build:** Vite 5
- **Estilos:** Tailwind CSS 3
- **Tiempo real:** Socket.IO Client
- **Íconos:** Lucide React
- **Idioma:** TypeScript

## Funcionalidades

- **3 columnas de estado:**
  - Pendientes
  - En Preparación
  - Listos para Recoger
- **Notificación sonora** (5 pitidos) cuando un pedido está listo
- **Auto-ocultar** pedidos listos después de 20 segundos
- **Reloj digital** en vivo con fecha actual
- **Botón de silencio** para mutear la alerta sonora
- **Actualización en tiempo real** vía REST + WebSocket

## Instalación paso a paso

```bash
# 1. Clonar (si no lo has hecho)
git clone https://github.com/tu-usuario/paccioli-pos.git
cd paccioli-pos/App_Display_Clientes

# 2. Instalar dependencias
npm install

# 3. Configurar URL del Backend
cp .env.example .env
# Editar .env con la IP del servidor backend
# Ejemplo: VITE_API_URL=http://192.168.1.100:3006

# 4. Iniciar
npm run dev
```

## Configuración del Backend

Esta app se conecta al backend central del restaurante en **dos formas**:

1. **API REST** → para cargar la lista de pedidos
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

| Servicio | Puerto |
|----------|--------|
| Dev server (esta app) | `5176` |
| Backend API | `3006` |
