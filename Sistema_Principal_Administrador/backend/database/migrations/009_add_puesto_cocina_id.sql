-- Migration: Asignar puesto de cocina fijo a cada usuario (cocineros)
-- Cada cocinero queda vinculado a UN puesto de cocina; el kiosco de cocina no pide selección.
ALTER TABLE usuarios
  ADD COLUMN IF NOT EXISTS puesto_cocina_id INT NULL AFTER rol;

-- FK (solo si aún no existe)
SET @fk_exists := (SELECT COUNT(*) FROM information_schema.KEY_COLUMN_USAGE
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'usuarios' AND COLUMN_NAME = 'puesto_cocina_id');
SET @sql := IF(@fk_exists = 0,
  'ALTER TABLE usuarios ADD CONSTRAINT fk_usuarios_puesto_cocina FOREIGN KEY (puesto_cocina_id) REFERENCES puestos_cocina(id)',
  'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
