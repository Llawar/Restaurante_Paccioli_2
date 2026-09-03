-- GASTROSTOCK - Índices adicionales
-- Mejoran el rendimiento de filtros por fecha en el kardex

ALTER TABLE gastro_movimientos_kardex
  ADD INDEX idx_kardex_producto_fecha (producto_id, fecha);
