-- ==================================================
-- [2] ACTIVAR ROW LEVEL SECURITY
-- Ejecuta DESPUÉS de 01_tablas.sql (o antes, no importa).
-- SOLO activa la protección; las políticas reales van en 03_politicas.sql
-- ==================================================

alter table public.users enable row level security;
alter table public.client_profiles enable row level security;
alter table public.delivery_profiles enable row level security;
alter table public.products enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;