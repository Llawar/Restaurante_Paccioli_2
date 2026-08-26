-- ==================================================
-- [5] CATÁLOGO POS → SUPABASE
-- Agrega la llave de mapeo entre productos del POS (MySQL)
-- y la tabla products de Supabase, para sincronizar el catálogo.
-- Ejecuta ENTERO en el SQL Editor de Supabase.
-- Idempotente: puedes re-ejecutarlo sin romper nada.
-- ==================================================

alter table public.products
  add column if not exists pos_id bigint unique;

create index if not exists idx_products_pos_id on public.products(pos_id);

-- Columna de última sincronización (usada por CatalogoSyncService.ts en el upsert).
alter table public.products
  add column if not exists updated_at timestamptz default now();