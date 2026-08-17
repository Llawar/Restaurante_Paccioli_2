# 🚀 Configuración de Supabase - Delivery App

## Paso 1: Crear Proyecto en Supabase

1. Ve a [https://supabase.com](https://supabase.com)
2. Haz click en "Sign Up" y crea tu cuenta (puedes usar Google)
3. Haz click en "New Project"
4. Completa los campos:
   - **Project Name**: `delivery-app` (o el nombre que prefieras)
   - **Database Password**: Crea una contraseña segura
   - **Region**: Elige la más cercana a ti (ej: América del Sur)
   - **Pricing Plan**: Free (está bien para desarrollo)
5. Espera a que se cree el proyecto (toma unos minutos)

## Paso 2: Obtener Credenciales

1. Una vez creado, ve a **Settings > API**
2. Copia:
   - **Project URL** → Esto es tu `supabaseUrl`
   - **anon public** key → Esto es tu `supabaseAnonKey`

## Paso 3: Actualizar el Código

1. Abre el archivo `lib/config/supabase_config.dart`
2. Reemplaza:
   ```dart
   static const String supabaseUrl = 'https://YOUR_SUPABASE_URL.supabase.co';
   static const String supabaseAnonKey = 'YOUR_SUPABASE_ANON_KEY';
   ```
   Con tus credenciales reales

## Paso 4: Crear Tablas en la BD

1. En Supabase, ve a **SQL Editor**
2. Haz click en "New Query"
3. Copia y pega el siguiente SQL:

```sql
-- Tabla de Usuarios
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  nombre TEXT NOT NULL,
  telefono TEXT,
  rol TEXT CHECK (rol IN ('admin', 'client', 'delivery')) DEFAULT 'client',
  foto_perfil TEXT,
  estado BOOLEAN DEFAULT true,
  fecha_creacion TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Tabla de Perfiles de Cliente
CREATE TABLE client_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  direccion_principal TEXT,
  ciudad TEXT,
  latitud FLOAT,
  longitud FLOAT,
  metodoPago_preferido TEXT,
  calificacion_promedio FLOAT DEFAULT 0
);

-- Tabla de Perfiles de Repartidor
CREATE TABLE delivery_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  numero_vehiculo TEXT,
  tipo_vehiculo TEXT CHECK (tipo_vehiculo IN ('motorcycle', 'car', 'bicycle')),
  documento TEXT,
  estado_disponibilidad TEXT CHECK (estado_disponibilidad IN ('available', 'busy', 'offline')) DEFAULT 'offline',
  calificacion_promedio FLOAT DEFAULT 0,
  entregas_completadas INT DEFAULT 0
);

-- Tabla de Productos
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL,
  descripcion TEXT,
  precio DECIMAL(10, 2) NOT NULL,
  categoria TEXT NOT NULL,
  imagen_url TEXT,
  stock INT DEFAULT 0,
  estado BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Tabla de Pedidos
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id UUID NOT NULL REFERENCES users(id),
  repartidor_id UUID REFERENCES users(id),
  estado TEXT CHECK (estado IN ('pending', 'assigned', 'in_transit', 'delivered', 'cancelled')) DEFAULT 'pending',
  direccion_entrega TEXT NOT NULL,
  latitud FLOAT,
  longitud FLOAT,
  total DECIMAL(10, 2) NOT NULL,
  fecha_creacion TIMESTAMP DEFAULT NOW(),
  fecha_entrega_estimada TIMESTAMP,
  calificacion INT CHECK (calificacion >= 1 AND calificacion <= 5)
);

-- Tabla de Items del Pedido
CREATE TABLE order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pedido_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  producto_id UUID NOT NULL REFERENCES products(id),
  cantidad INT NOT NULL,
  precio_unitario DECIMAL(10, 2) NOT NULL,
  subtotal DECIMAL(10, 2) NOT NULL
);

-- Crear índices para mejor rendimiento
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_orders_cliente ON orders(cliente_id);
CREATE INDEX idx_orders_repartidor ON orders(repartidor_id);
CREATE INDEX idx_order_items_pedido ON order_items(pedido_id);
```

4. Haz click en "Run" para ejecutar el SQL

## Paso 5: Habilitar RLS (Row Level Security)

1. Ve a **Authentication > Policies**
2. Para la tabla `users`, crea estas políticas:
   - Usuarios pueden ver su propio registro
   - Solo admin puede ver todos

3. Para la tabla `orders`:
   - Clientes ven solo sus órdenes
   - Repartidores ven sus órdenes asignadas
   - Admin ve todas

## Paso 6: (Opcional) Cargar Datos de Prueba

Ejecuta este SQL para agregar productos de ejemplo:

```sql
INSERT INTO products (nombre, descripcion, precio, categoria, stock) VALUES
('Hamburguesa Clásica', 'Hamburguesa con queso y vegetales', 8.99, 'Comida Rápida', 50),
('Pizza Margarita', 'Pizza con queso y tomate', 12.99, 'Pizzas', 30),
('Ensalada Cesar', 'Ensalada fresca con pollo', 9.99, 'Ensaladas', 25),
('Pasta Carbonara', 'Pasta cremosa con jamón', 11.99, 'Pastas', 20),
('Refresco 2L', 'Refresco variado', 3.99, 'Bebidas', 100);
```

## ¡Listo! 🎉

Tu base de datos está configurada y lista para usar. Ahora podemos:
1. Implementar las pantallas de Login/Registro
2. Crear el panel de Admin
3. Implementar la pantalla del Cliente
4. Implementar la pantalla del Repartidor

¿Quieres que continuemos?
