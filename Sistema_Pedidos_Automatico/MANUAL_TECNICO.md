# 📖 Manual del Kiosco de Pedidos Automático — Paccioli

> **Módulo:** `Sistema_Pedidos_Automatico`
> **Tipo de sistema:** Autoservicio táctil (kiosco) para tablets en modo horizontal (landscape)
> **Propósito:** Permitir que los clientes realicen sus pedidos sin la intervención de un mesero.

---

## 1. Descripción general

El **Kiosco de Pedidos Automático** es una aplicación web (SPA) pensada para funcionar como un punto de autoservicio dentro del restaurante. Corre en una tablet/frontend y se comunica con el **backend central** del restaurante para obtener el catálogo de productos, registrar pedidos y recibir actualizaciones en tiempo real.

El flujo del cliente es:

```
Pantalla de inicio → Menú → Carrito → Checkout → Pago QR → Confirmación
       (home)      (menu)   (cart)    (checkout)   (payment)   (success)
```

---

## 2. Estructura del proyecto

```
Sistema_Pedidos_Automatico/
├── index.html                 # Entrada HTML (carga el script main.tsx)
├── package.json               # Dependencias y scripts del proyecto
├── package-lock.json          # Bloqueo de versiones de dependencias
├── metadata.json              # Metadatos del prototipo (nombre/descripción)
├── vite.config.ts             # Configuración del servidor Vite (puertos, hosts)
├── tsconfig.json              # Configuración de TypeScript
├── .env.example               # Plantilla de variables de entorno
├── .gitignore                 # Archivos ignorados por Git
└── src/                       # Código fuente de la aplicación
    ├── main.tsx               # Punto de entrada de React
    ├── App.tsx                # Componente principal (toda la lógica y pantallas)
    ├── api.ts                 # Servicio de conexión con el backend
    ├── data.ts                # Datos de producto por defecto/fallback
    ├── types.ts               # Tipos de TypeScript (Product, CartItem, Screen)
    ├── index.css              # Estilos globales (Tailwind + scrollbar)
    └── vite-env.d.ts          # Referencias de tipos de Vite
```

### 2.1 Descripción de cada archivo

| Archivo | Responsabilidad |
|---------|-----------------|
| **`src/main.tsx`** | Monta la aplicación React sobre el nodo `#root` e importa los estilos globales. |
| **`src/App.tsx`** | Componente principal: controla el estado de pantallas, categorías, carrito, búsqueda, productos, conexión WebSocket, temporizador QR y envío del pedido. |
| **`src/api.ts`** | Define la URL de la API y el servicio `apiService` para interactuar con el backend. |
| **`src/data.ts`** | Catálogo de productos local (de respaldo). |
| **`src/types.ts`** | Tipos: `Product`, `CartItem` y el tipo `Screen` (las pantallas de la app). |
| **`src/index.css`** | Estilos de Tailwind y scrollbar personalizado. |
| **`vite.config.ts`** | Configura host, puerto, hosts permitidos y variables de entorno del build. |

---

## 3. Requisitos previos (primera vez)

| Programa | Versión | Dónde descargar |
|----------|---------|-----------------|
| **Node.js** | v18+ | https://nodejs.org |
| **npm** | v9+ | (viene incluido con Node.js) |
| **Git** | - | https://git-scm.com/ |

---

## 4. Tecnologías utilizadas

| Capa | Tecnología |
|------|------------|
| **Framework** | React 19 |
| **Build** | Vite 6 |
| **Estilos** | Tailwind CSS 4 |
| **Animaciones** | Motion (Framer Motion) |
| **Tiempo real** | Socket.IO Client |
| **Íconos** | Lucide React |
| **Lenguaje** | TypeScript |

---

## 5. Instalación paso a paso

```bash
# 1. Clonar el repositorio (si aún no lo tienes)
git clone <URL-del-repositorio>.git
cd <repositorio>/Sistema_Pedidos_Automatico

# 2. Instalar dependencias
npm install

# 3. Configurar variables de entorno (opcional, ver sección 6)
cp .env.example .env

# 4. Iniciar el servidor de desarrollo
npm run dev
```

> ⚠️ **Importante:** el kiosco se inicia de forma fija en el puerto **`5174`** (no en el 3000). Consulta la sección de puertos más abajo.

---

## 6. Variables de entorno

Se definen en el archivo `.env` (copiado desde `.env.example`).

| Variable | Descripción | Ejemplo |
|----------|-------------|---------|
| **`VITE_API_URL`** | URL base de la API del backend. **Opcional**: si se omite, la app usa automáticamente `http://<host>:3006/api` según la IP/hostname con la que se abrió la página. | `http://192.168.1.100:3006/api` |
| **`GEMINI_API_KEY`** | Clave de API usada en el proceso de build (definida como variable de entorno en `vite.config.ts`). | - |
| **`DISABLE_HMR`** | Si se define como `true`, **desactiva** el Hot Module Replacement (recarga en caliente) de Vite. Útil en despliegue de kiosco. | `true` |

---

## 7. Conexión con el Backend

Esta app se conecta al **backend central** del restaurante:

- **Detección automática de IP:** usa `window.location.hostname`, es decir, la IP o el nombre de dominio con el que el cliente abrió la página. Por eso, el kiosco funciona en la red local sin configuración extra.
- **Override opcional:** si el backend vive en otra IP distinta a la de la página, se define `VITE_API_URL`.
- **Tiempo real (WebSocket):** la app se suscribe a eventos de Socket.IO para recibir **actualizaciones de productos en tiempo real** (precios disponibles, disponibilidad, etc.) sin recargar la página.
  - Transportes habilitados: `websocket` y `polling`.
  - Reintentos de reconexión: **infinitos**, con demora inicial de 1s y máxima de 5s.

---

## 8. Puertos

> ⚠️ **Corrección con respecto al README original:** el dev server **no usa el puerto 3000**.

| Servicio | Puerto |
|----------|--------|
| Dev server (este kiosco, Vite) | **`5174`** (fijo) |
| Backend API | `3006` |

### 8.1 Configuración de red del servidor Vite

Definida en `vite.config.ts`:

- **`host: '0.0.0.0'`** → el servidor se abre a **toda la red LAN**, permitiendo que varias tablets accedan.
- **`port: 5174`** → puerto fijo para el kiosco.
- **`allowedHosts: ['restaurante-paccioli-server.duckdns.org']`** → autoriza el acceso mediante el subdominio de **DuckDNS**, para acceder desde fuera de la red local o mediante un hostname público.
- **`hmr`** → depende de la variable `DISABLE_HMR`.

---

## 9. Funcionalidades del kiosco

### 9.1 Pantallas (flujo de la app)

El tipo `Screen` define las pantallas disponibles:

1. **`home`** — Pantalla de inicio con splash y acceso al menú.
2. **`menu`** — Menú categorizado con búsqueda.
3. **`checkout`** — Resumen del carrito y datos del pedido.
4. **`payment`** — Simulación de pago QR con temporizador.
5. **`success`** — Confirmación del pedido con número de orden.

### 9.2 Características principales

- **Menú categorizado:** organizado en tres categorías → `platos`, `bebidas`, `postres`.
- **Búsqueda de productos** por nombre.
- **Modal de detalle de producto:** muestra imagen, descripción y selector de cantidad.
- **Carrito de compras:** con resumen total y ajuste de cantidades (sumar/restar/eliminar).
- **Checkout con impuestos:** cálculo de impuesto del **10%** sobre el subtotal.
- **Pago QR simulado:** temporizador de **10 minutos** (600 segundos) para completar el pago.
- **Confirmación:** muestra un número de pedido generado (4 dígitos, entre 1000 y 9999).
- **Actualización en tiempo real** de productos vía WebSocket (indicadores online/offline con los íconos Wifi/WifiOff).
- **Imágenes sin dependencias externas:** si un producto no tiene imagen o falla su carga, se muestra un **placeholder SVG local** (la app no depende de servicios externos de imágenes).

### 9.3 Adaptación de datos de la API

La app **adapta automáticamente** las categorías que envía el backend a las 3 categorías internas del kiosco mediante el mapeo `mapCategory`:

| Condición (nombre de categoría del backend) | Resultado |
|---------------------------------------------|-----------|
| Contiene "bebida" y **no** contiene "alcohol" | `bebidas` |
| Contiene "postre" o "dulce" | `postres` |
| Cualquier otro caso | `platos` |

> 💡 **Nota:** las bebidas alcohólicas (que contienen "alcohol") **no** se clasifican como `bebidas` y caen en `platos`, para evitar mostrarlas en el kiosco general.

---

## 10. Scripts disponibles

Definidos en `package.json`:

| Comando | Descripción |
|---------|-------------|
| `npm run dev` | Arranca el servidor de desarrollo de Vite (puerto 5174). |
| `npm run build` | Compila la aplicación para producción. |
| `npm run preview` | Previsualiza la compilación de producción localmente. |
| `npm run clean` | Elimina la carpeta `dist/` (usa `rimraf`). |
| `npm run lint` | Verificación de tipos con TypeScript (`tsc --noEmit`). |

---

## 11. Solución de problemas comunes

| Problema | Causa probable / Solución |
|----------|---------------------------|
| No se ven productos en el menú | El backend no está accesible. Verifica que la API responda en el puerto `3006` y que las tablets estén en la misma red, o define `VITE_API_URL`. |
| El kiosco no carga desde otra tablet | Confirma que el servidor se inició con `host: 0.0.0.0` y que el puerto `5174` esté abierto en el firewall. |
| No puedo acceder por DuckDNS | Verifica que el hostname esté en `allowedHosts` de `vite.config.ts` y reinicia el dev server tras el cambio. |
| La página se recarga sola al editar y no quiero que lo haga | Define `DISABLE_HMR=true` para desactivar la recarga en caliente. |
| Aparece "Sin imagen" en un producto | El producto no tiene imagen en el backend o la URL falló; la app muestra un placeholder local (no es un error). |
| Bebidas alcohólicas aparecen en "Platos" | Comportamiento intencional del mapeo de categorías (ver sección 9.3). |

---

## 12. Notas finales

- El kiosco está pensado para **tablets en orientación horizontal (landscape)**.
- La app funciona completamente en la **red local** gracias a la auto-detección del hostname; el uso de variables de entorno es solo para casos de backend externo o hosts públicos.
- Este manual refleja la configuración actual verificada en el código (puerto `5174`, host `0.0.0.0`, DuckDNS, `GEMINI_API_KEY`, `DISABLE_HMR`), que difiere de los datos del `README.md` original.
