-- ==================================================
-- [4] PERMISOS (GRANT) + TRIGGER de auto-creación de perfil
-- Ejecuta DESPUÉS de 03_politicas.sql
-- ==================================================

-- --------- 1. PERMISOS a los roles de la app ---------
-- La app usa la clave "anon" que actúa como rol 'anon' una vez
-- autenticado, y como 'authenticated' cuando hay sesión.

grant usage on schema public to anon, authenticated;

grant all on public.users                to anon, authenticated;
grant all on public.client_profiles      to anon, authenticated;
grant all on public.delivery_profiles    to anon, authenticated;
grant all on public.products             to anon, authenticated;
grant all on public.orders               to anon, authenticated;
grant all on public.order_items          to anon, authenticated;

-- Funciones
grant execute on function public.delete_user()  to authenticated, anon;
grant execute on function public.is_admin()     to authenticated, anon;
grant execute on function public.is_delivery()  to authenticated, anon;

-- ==================================================
-- 2) TRIGGER: crea la fila en public.users al registrarse
-- ==================================================
-- El trigger corre cuando se inserta un usuario en auth.users,
-- así el perfil en public.users SIEMPRE existe (sin depender
-- del INSERT manual de la app).

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.users (id, email, nombre, rol, estado, fecha_creacion)
  values (
    new.id,
    new.email,
    '',
    'client',          -- rol por defecto hasta que se promueva
    true,
    now()
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();