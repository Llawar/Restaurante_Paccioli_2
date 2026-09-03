-- Migration: Puente clientes delivery (Supabase) -> POS (MySQL)
-- Agrega supabase_id a clientes para identificar usuarios provenientes de Supabase
-- y evitar duplicados en el polling de UserSyncService.

ALTER TABLE clientes
  ADD COLUMN supabase_id VARCHAR(64) NULL AFTER email,
  ADD COLUMN supabase_rol VARCHAR(20) NULL AFTER supabase_id,
  ADD COLUMN supabase_sincronizado_at TIMESTAMP NULL AFTER supabase_rol,
  ADD COLUMN origen ENUM('presencial','cajero_automatico','delivery_app') DEFAULT 'presencial' AFTER supabase_sincronizado_at,
  ADD UNIQUE KEY uq_clientes_supabase_id (supabase_id),
  ADD INDEX idx_clientes_supabase_rol (supabase_rol),
  ADD INDEX idx_clientes_origen (origen);
