-- ==================================================
-- [1] TABLAS + INDICES + FUNCION delete_user
-- Ejecuta ENTERO en el SQL Editor de Supabase
-- ==================================================

-- ================= TABLAS =================

create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique not null,
  nombre text not null,
  telefono text,
  direccion text,                     -- leída por User.fromJson
  rol text check (rol in ('admin','client','delivery')) default 'client',
  foto_perfil text,
  estado boolean default true,
  fecha_creacion timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.client_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete cascade,
  direccion_principal text,
  ciudad text,
  latitud float,
  longitud float,
  metodopago_preferido text,
  calificacion_promedio float default 0
);

create table if not exists public.delivery_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique references public.users(id) on delete cascade,
  numero_vehiculo text,
  tipo_vehiculo text check (tipo_vehiculo in ('motorcycle','car','bicycle')),
  documento text,
  estado_disponibilidad text check (estado_disponibilidad in ('available','busy','offline')) default 'offline',
  calificacion_promedio float default 0,
  entregas_completadas int default 0,
  ubicacion_actual jsonb          -- {latitude, longitude}; leído/escrito por la app
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  descripcion text,
  precio numeric(10,2) not null,
  categoria text not null,
  imagen_url text,
  stock int default 0,
  estado boolean default true,
  created_at timestamptz default now()
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid not null references public.users(id),
  repartidor_id uuid references public.users(id),
  estado text check (estado in ('pending','reserved','ready_for_pickup','assigned','in_transit','delivered','cancelled')) default 'pending',
  direccion_entrega text not null,
  metodo_pago text default 'Efectivo',          -- leído por Order.fromJson
  latitud float,
  longitud float,
  total numeric(10,2) not null default 0,
  fecha_creacion timestamptz default now(),
  fecha_entrega_estimada timestamptz,
  calificacion int check (calificacion between 1 and 5)
);

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  pedido_id uuid not null references public.orders(id) on delete cascade,
  producto_id uuid not null references public.products(id),
  nombre_producto text,                          -- leído por OrderItem.fromJson
  cantidad int not null default 1,
  precio_unitario numeric(10,2) not null default 0,
  subtotal numeric(10,2) not null default 0
);

-- ================= INDICES =================

create index if not exists idx_users_email on public.users(email);
create index if not exists idx_orders_cliente on public.orders(cliente_id);
create index if not exists idx_orders_repartidor on public.orders(repartidor_id);
create index if not exists idx_order_items_pedido on public.order_items(pedido_id);

-- ================= FUNCION: borrar cuenta =================
-- Referenciada por auth_service.dart: rpc('delete_user')

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  return new;
end;
$$;

create or replace function public.delete_user()
returns void
language plpgsql
security definer set search_path = public
as $$
begin
  delete from public.client_profiles where user_id = auth.uid();
  delete from public.delivery_profiles where user_id = auth.uid();
  delete from public.users where id = auth.uid();
  -- Nota: eliminar de auth.users suele requerir aceptar el trigger/servicio;
  -- si falla, revisa los permisos de la función (definer) o realiza esta
  -- eliminación desde el panel de Authentication.
  delete from auth.users where id = auth.uid();
end;
$$;