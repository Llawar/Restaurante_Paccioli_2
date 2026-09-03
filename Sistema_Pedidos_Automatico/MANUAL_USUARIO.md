# 📱 Manual de Usuario — Kiosco de Pedidos Automático Paccioli

> **¿A quién está dirigido este manual?**
> A los **clientes** del restaurante que realizan pedidos en el kiosco táctil, y al **personal/encargado** del local que opera y supervisa el sistema diariamente.
>
> ⚙️ Si buscas información de instalación o configuración técnica, consulta el [MANUAL_TECNICO.md](./MANUAL_TECNICO.md).

---

# 🟢 PARTE 1 — Guía para el Cliente

Esta sección explica cómo hacer tu pedido en el kiosco, paso a paso. **No necesitas ayuda de un mesero.**

## 1. ¿Qué es el kiosco?

El kiosco es una pantalla táctil ubicada en el restaurante desde la cual puedes ver el menú completo, armar tu pedido y pagarlo por ti mismo con un código QR.

## 2. Paso a paso: cómo hacer tu pedido

### Paso 1 — Pantalla de inicio 🏠
Al acercarte al kiosco verás una pantalla de bienvenida.
👉 **Toca la pantalla** (o el botón de inicio) para acceder al menú.

### Paso 2 — Explora el menú 🍽️
El menú está organizado en **3 categorías** que puedes ver como pestañas o botones:

| Categoría | ¿Qué encontrarás? |
|-----------|-------------------|
| 🍝 **Platos** | Comidas principales, entradas y platos fuertes |
| 🥤 **Bebidas** | Refrescos, jugos, aguas y bebidas sin alcohol |
| 🍰 **Postres** | Dulces y postres para terminar tu comida |

- **Toca una categoría** para ver sus productos.
- 🔍 **¿Buscas algo específico?** Usa la **barra de búsqueda** escribiendo el nombre del producto (por ejemplo: "pizza" o "limonada").
- Los productos **no disponibles** estarán desactivados o marcados; no podrás agregarlos.

### Paso 3 — Ver el detalle de un producto 🔎
Toca **cualquier producto** para abrir su ficha de detalle, donde verás:
- 📷 **Foto** del producto
- 📝 **Descripción** (ingredientes, tamaño, etc.)
- 💲 **Precio**
- ➕➖ **Selector de cantidad**: toca **+** para sumar y **−** para restar.

> 💡 Si un producto no tiene foto, verás una imagen genérica que dice "Sin imagen". Esto es normal y no afecta tu pedido.

### Paso 4 — Agregar al carrito 🛒
Cuando hayas elegido la cantidad, toca el botón **"Agregar"**.
- Verás que el **carrito** (en la parte superior o lateral de la pantalla) se actualiza con tu producto y la cantidad.
- Puedes seguir navegando y agregando más productos. **Tu carrito se conserva.**

### Paso 5 — Revisa tu carrito 🧾
Abre el **carrito** tocando su ícono (🛒). Ahí podrás:
- ➕➖ **Aumentar o disminuir** la cantidad de cada producto.
- ❌ **Eliminar** un producto que ya no quieras.
- Ver el **subtotal** (suma de los precios) y el **total con impuestos (10%)**.

### Paso 6 — Confirmar y pasar al pago 💳
Cuando tu carrito esté listo, toca el botón para **confirmar / pagar** (checkout).
- Verás el **resumen final** con el total a pagar.
- Confirma para continuar.

### Paso 7 — Paga con el código QR 📲
La pantalla mostrará un **código QR** para realizar el pago:

1. Abre tu **app de billetera o banca móvil** en tu celular.
2. **Escanea el código QR** de la pantalla.
3. Completa el pago en tu celular.

> ⏱️ **¡IMPORTANTE! Tienes 10 minutos para pagar.**
> La pantalla muestra una **cuenta regresiva**. Si el tiempo se agota, deberás volver a iniciar el pedido.

### Paso 8 — ¡Pedido confirmado! ✅
Cuando el pago se procese, verás la pantalla de **confirmación** con:
- 🎉 Mensaje de éxito
- 🔢 Tu **número de pedido** (un número de 4 dígitos, por ejemplo **#4523**)
- ⏳ Espera a que llamen tu número para recibir tu comida.

> 📌 **Guarda tu número de pedido** — es como se te identificará para entregarte tu orden.

Después de unos segundos, el kiosco **volverá automáticamente** a la pantalla de inicio para el siguiente cliente.

## 3. Consejos útiles para clientes

- ✅ Puedes **volver atrás** en cualquier momento antes de pagar, con los botones de retroceso (◀).
- ✅ Si **te equivocas** en la cantidad, corrígela directamente en el carrito.
- ✅ Los **precios siempre están actualizados**: el kiosco se conecta en tiempo real con el sistema del restaurante.
- ❌ Si el tiempo del QR se agota, **vuelve a armar tu pedido** — el carrito se reinicia.
- ℹ️ Las **bebidas alcohólicas no aparecen** en la sección de "Bebidas" del kiosco por política del sistema.

---

# 🔵 PARTE 2 — Guía para el Personal del Restaurante

Esta sección es para el **encargado del local**: cómo iniciar el kiosco, supervisarlo y resolver situaciones del día a día.

## 4. Operación diaria

### 4.1 Encendido del kiosco (cada mañana) 🌅
1. Enciende la **tablet/pantalla** del kiosco.
2. Asegúrate de que el **backend del restaurante esté encendido** (el servidor central), de lo contrario el menú aparecerá vacío.
3. Abre el navegador en el kiosco y accede a la dirección del sistema.
4. Verifica que en la pantalla aparezca el **indicador de conexión** (ver sección 5).
5. El kiosco queda listo en la **pantalla de inicio** esperando a los clientes.

### 4.2 Indicador de conexión 🌐
El kiosco muestra íconos que indican su estado de comunicación con el sistema:

| Ícono | Significado | ¿Qué hacer? |
|-------|-------------|-------------|
| 📶 **Wifi** (verde/activo) | Conectado al sistema del restaurante | Todo normal ✅ |
| 🚫 **WifiOff** (apagado) | Sin conexión con el backend | Verifica la red/servidor. El kiosco **reconecta solo** cuando la red vuelva. |

### 4.3 Durante el servicio
- El kiosco recibe **actualizaciones automáticas**: si desde la cocina o la administración se cambia el precio o la disponibilidad de un producto, el menú del kiosco **se actualiza solo**, sin reiniciar nada.
- Si marcas un producto como **no disponible** en el sistema central, el kiosco lo mostrará como no disponible de inmediato.

### 4.4 Cierre del día 🌙
1. Verifica que **no haya pedidos en proceso** (pantallas de pago activas).
2. Apaga la tablet/pantalla o deja el kiosco en la pantalla de inicio, según la política del local.

## 5. Situaciones frecuentes y qué hacer

| Situación | Explicación y solución |
|-----------|------------------------|
| **El menú aparece vacío / no cargan productos** | El backend está apagado o sin conexión. Revisa el servidor central y que la tablet esté en la misma red. Cuando se recupere, el kiosco carga los productos automáticamente. |
| **Aparece el ícono de "sin conexión"** | La tablet perdió la red o el backend se cayó. Espera unos segundos: el kiosco intenta reconectarse solo, indefinidamente. |
| **Un cliente dice que el QR "caducó"** | El pago QR tiene un límite de **10 minutos**. Si se agotó, el pedido se canceló y el cliente debe volver a armarlo. |
| **Un producto aparece "Sin imagen"** | Ese producto no tiene foto cargada en el sistema. Agrega la imagen desde el panel de administración del backend. El kiosco sigue funcionando normal. |
| **El cliente no recibió su número de pedido** | Asegúrate de que llegó a la **pantalla de confirmación** (con el ✅ verde). Si se quedó en la pantalla de pago, el pedido no se completó. |
| **La pantalla está "trabada"** | Desliza/toca la pantalla; si no responde, recarga la página del navegador en la tablet. El kiosco volverá a la pantalla de inicio. |
| **Bebidas con alcohol no aparecen en "Bebidas"** | Es un comportamiento **deliberado** del sistema: las bebidas alcohólicas no se muestran en la categoría Bebidas del kiosco. |

## 6. Preguntas frecuentes (FAQ)

**❓ ¿El dueño del restaurante puede cambiar precios o productos del menú sin reiniciar el kiosco?**
Sí. Los cambios hechos en el sistema central llegan al kiosco en **tiempo real**.

**❓ ¿Cuántas mesas/tablets pueden usar el sistema a la vez?**
Varias. El kiosco está preparado para funcionar en toda la red local del restaurante simultáneamente.

**❓ ¿El cliente necesita internet en su celular para pagar con QR?**
Sí, el pago se realiza en la app bancaria del cliente, que requiere internet en su propio celular. El kiosco solo genera el código.

**❓ ¿Qué pasa si se va la luz?**
Cuando regrese la energía, enciende nuevamente la tablet y el servidor. El kiosco se conectará automáticamente. Los pedidos no pagados en ese momento se pierden y deberán repetirse.

**❓ ¿Se puede modificar un pedido ya pagado?**
No desde el kiosco. Cualquier corrección posterior al pago debe gestionarse directamente con el personal del restaurante.

---

## 7. Resumen rápido (chuleta) 🗒️

**Para el cliente:**
> Inicio → Categoría → Producto → Cantidad → Agregar → Carrito → Pagar QR (⏱️ 10 min) → Número de pedido ✅

**Para el personal:**
> Encender tablet → Verificar backend → Confirmar ícono 📶 → Listo. Al final del día: verificar que no haya pagos pendientes y apagar.

---

> ⚙️ **¿Problemas técnicos** (instalación, redes, puertos, configuración)? → Consulta el [MANUAL_TECNICO.md](./MANUAL_TECNICO.md)
