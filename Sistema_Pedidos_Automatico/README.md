# Kiosco de Pedidos Automático - Paccioli

**Sistema de autoservicio** — Kiosco táctil para que los clientes realicen sus pedidos sin necesidad de un mesero. Ideal para tablets en modo horizontal (landscape).

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

## Instalación paso a paso

```bash
# 1. Clonar (si no lo has hecho)
git clone https://github.com/tu-usuario/paccioli-pos.git
cd paccioli-pos/Sistema_Pedidos_Automatico

# 2. Instalar dependencias
npm install

# 3. Configurar URL del Backend
cp .env.example .env
# Editar .env con la IP del servidor backend
# Ejemplo: VITE_API_URL=http://192.168.1.100:3006/api

# 4. Iniciar
npm run dev
```

## Configuración del Backend

Esta app se conecta al backend central del restaurante. La URL se define en `.env`:

```env
VITE_API_URL=http://localhost:3006/api
```

Si el backend está en otra PC de la red, usa su IP local:
```env
VITE_API_URL=http://192.168.1.100:3006/api
```

## Puertos

| Servicio | Puerto |
|----------|--------|
| Dev server (esta app) | `3000` |
| Backend API | `3006` |
