-- Migration: Puente delivery (Supabase) -> POS (MySQL)
-- Agrega la columna supabase_order_id (UNIQUE) a la tabla delivery
-- para identificar los pedidos provenientes de la app de delivery
-- y evitar duplicados en el polling.

ALTER TABLE delivery
  ADD COLUMN supabase_order_id VARCHAR(64) NULL AFTER notas,
  ADD UNIQUE KEY uq_delivery_supabase_order_id (supabase_order_id);