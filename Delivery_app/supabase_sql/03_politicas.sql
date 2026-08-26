-- ==================================================
-- [3] POLÍTICAS RLS
-- Ejecuta DESPUÉS de 02_rls_enable.sql
-- Define helpers de rol + reglas por tabla.
-- Idempotente: puedes re-ejecutarlo sin romper nada.
-- ==================================================

-- --------- Funciones auxiliares de rol ---------
-- (security definer: pueden leer public.users sin chocar con RLS)

create or replace function public.is_admin()
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (select 1 from public.users where id = auth.uid() and rol = 'admin');
$$;

create or replace function public.is_delivery()
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (select 1 from public.users where id = auth.uid() and rol = 'delivery');
$$;

-- ==================================================
-- USERS
-- ==================================================

drop policy if exists "users_insert_self" on public.users;
create policy "users_insert_self" on public.users
  for insert with check (auth.uid() = id);

drop policy if exists "users_select_self" on public.users;
create policy "users_select_self" on public.users
  for select using (auth.uid() = id);

drop policy if exists "users_select_admin" on public.users;
create policy "users_select_admin" on public.users
  for select using (public.is_admin());

drop policy if exists "users_update_self" on public.users;
create policy "users_update_self" on public.users
  for update using (auth.uid() = id)
  with check (auth.uid() = id);

drop policy if exists "users_update_admin" on public.users;
create policy "users_update_admin" on public.users
  for update using (public.is_admin())
  with check (public.is_admin());

-- ==================================================
   CLIENT_PROFILES
-- ==================================================

drop policy if exists "client_profiles_insert_self" on public.client_profiles;
create policy "client_profiles_insert_self" on public.client_profiles
  for insert with check (user_id = auth.uid());

drop policy if exists "client_profiles_select_self" on public.client_profiles;
create policy "client_profiles_select_self" on public.client_profiles
  for select using (user_id = auth.uid());

drop policy if exists "client_profiles_update_self" on public.client_profiles;
create policy "client_profiles_update_self" on public.client_profiles
  for update using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- ==================================================
   DELIVERY_PROFILES
-- ==================================================

drop policy if exists "delivery_profiles_insert_self" on public.delivery_profiles;
create policy "delivery_profiles_insert_self" on public.delivery_profiles
  for insert with check (user_id = auth.uid());

drop policy if exists "delivery_profiles_select_self" on public.delivery_profiles;
create policy "delivery_profiles_select_self" on public.delivery_profiles
  for select using (user_id = auth.uid());

drop policy if exists "delivery_profiles_select_admin" on public.delivery_profiles;
create policy "delivery_profiles_select_admin" on public.delivery_profiles
  for select using (public.is_admin());

drop policy if exists "delivery_profiles_update_self" on public.delivery_profiles;
create policy "delivery_profiles_update_self" on public.delivery_profiles
  for update using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists "delivery_profiles_update_admin" on public.delivery_profiles;
create policy "delivery_profiles_update_admin" on public.delivery_profiles
  for update using (public.is_admin())
  with check (public.is_admin());

-- ==================================================
   PRODUCTS
-- ==================================================

drop policy if exists "products_select_all" on public.products;
create policy "products_select_all" on public.products
  for select using (true);

drop policy if exists "products_insert_admin" on public.products;
create policy "products_insert_admin" on public.products
  for insert with check (public.is_admin());

drop policy if exists "products_update_admin" on public.products;
create policy "products_update_admin" on public.products
  for update using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "products_delete_admin" on public.products;
create policy "products_delete_admin" on public.products
  for delete using (public.is_admin());

-- ==================================================
   ORDERS
-- ==================================================

-- Crear pedido: el cliente es dueño de su pedido
drop policy if exists "orders_insert_self" on public.orders;
create policy "orders_insert_self" on public.orders
  for insert with check (auth.uid() = cliente_id);

-- Ver: el cliente ve el suyo; el repartidor ve el asignado a él y los pendientes
drop policy if exists "orders_select" on public.orders;
create policy "orders_select" on public.orders
  for select using (
    auth.uid() = cliente_id
    or repartidor_id = auth.uid()
    or public.is_admin()
    or public.is_delivery()
  );

-- Actualizar: repartidor (estado/ruta) y admin (asignación)
drop policy if exists "orders_update" on public.orders;
create policy "orders_update" on public.orders
  for update using (
    auth.uid() = cliente_id
    or repartidor_id = auth.uid()
    or public.is_admin()
    or public.is_delivery()
  ) with check (
    auth.uid() = cliente_id
    or repartidor_id = auth.uid()
    or public.is_admin()
    or public.is_delivery()
  );

-- ==================================================
   ORDER_ITEMS
-- ==================================================

drop policy if exists "order_items_select" on public.order_items;
create policy "order_items_select" on public.order_items
  for select using (
    public.is_admin()
    or public.is_delivery()
    or exists (
      select 1 from public.orders o
      where o.id = order_items.pedido_id and o.cliente_id = auth.uid()
    )
  );

drop policy if exists "order_items_insert" on public.order_items;
create policy "order_items_insert" on public.order_items
  for insert with check (
    exists (
      select 1 from public.orders o
      where o.id = order_items.pedido_id and o.cliente_id = auth.uid()
    )
  );

drop policy if exists "order_items_delete_admin" on public.order_items;
create policy "order_items_delete_admin" on public.order_items
  for delete using (public.is_admin());