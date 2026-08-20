# Delivery App — Restaurante Paccioli

Aplicación móvil de **pedidos y reparto a domicilio** del restaurante Paccioli. Flutter + Supabase.

## Descripción

App para clientes (pedir con entrega a domicilio) y repartidores (aceptar y completar entregas). La moneda del sistema es **bolivianos (Bs)**.

- **Clientes**: exploran el catálogo, arman el carrito y crean pedidos con **ubicación obligatoria** (el repartidor la necesita).
- **Repartidores**: ven pedidos disponibles, los aceptan, navegan al destino y marcan la entrega.
- **Admin**: gestión de productos y pedidos.

## Integración con el POS (local)

La app NO está aislada: se conecta al sistema local del restaurante vía **Supabase** y un **puente en el backend Express**:

- **Catálogo**: los productos se sincronizan del POS (MySQL) a Supabase (`CatalogoSyncService.ts`, polling 15 s + disparo inmediato al crear/editar un producto). Enlace por `products.pos_id`.
- **Pedidos**: el puente (`DeliverySyncService.ts`, polling 7 s) copia cada pedido al MySQL del restaurante y lo emite por Socket.IO para que aparezcan en la **cocina (KDS)**, el **display de clientes** y el **panel admin**, con distintivo 🛵 Delivery.
- **Estados**: los cambios de estado del pedido en la app se reflejan en el POS en tiempo real.

> Ver `INTEGRACION_DELIVERY_POS.md` (raíz del repo) para la arquitectura, configuración y mapeo de datos.

## Configuración inicial

1. **Supabase**: ejecutar los scripts de `supabase_sql/` en orden (01 → 05) en el SQL Editor. El `05_catalogo_pos.sql` agrega `products.pos_id` y `updated_at` (requerido por el catálogo del POS).
2. **Credenciales**: editar `lib/config/supabase_config.dart` con `supabaseUrl` y `supabaseAnonKey` de tu proyecto.
3. **Backend (opcional, para el puente)**: configurar `SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY` en `Sistema_Principal_Administrador/backend/.env`.
4. **Imagen de inicio**: el splash e ícono se generan desde `assets/images/iconico.png` (debe ser un PNG real; regenerar con `flutter_native_splash` y `flutter_launcher_icons` si cambia).

## Ejecutar

```bash
flutter pub get
flutter run
```

## Build APK

```bash
flutter build apk --release
# APK en: build/app/outputs/flutter-apk/app-release.apk
```

## Notas

- La moneda es **Bs** en toda la app (tienda, carrito, historial, admin).
- El checkout exige la ubicación del cliente; en Flutter Web por HTTP/IP la geolocalización puede quedar bloqueada por el navegador (usa HTTPS o localhost para pruebas web).