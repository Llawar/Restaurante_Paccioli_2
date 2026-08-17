-- Migration: Puesto de cocina por categoría (1 categoría → 1 puesto)
-- Reemplaza el uso de la tabla puente asignacion_puestos_categorias por una columna directa.
ALTER TABLE categorias
  ADD COLUMN puesto_cocina_id INT NULL AFTER color;

-- FK (idempotente: solo si aún no existe)
SET @fk_exists := (SELECT COUNT(*) FROM information_schema.KEY_COLUMN_USAGE
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'categorias' AND COLUMN_NAME = 'puesto_cocina_id');
SET @sql := IF(@fk_exists = 0,
  'ALTER TABLE categorias ADD CONSTRAINT fk_categorias_puesto_cocina FOREIGN KEY (puesto_cocina_id) REFERENCES puestos_cocina(id)',
  'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Backfill desde la tabla puente (cada categoría toma su puesto de menor id)
UPDATE categorias c
LEFT JOIN (
  SELECT categoria_id, MIN(puesto_id) AS puesto_id
  FROM asignacion_puestos_categorias
  GROUP BY categoria_id
) apc ON apc.categoria_id = c.id
SET c.puesto_cocina_id = apc.puesto_id
WHERE c.puesto_cocina_id IS NULL;