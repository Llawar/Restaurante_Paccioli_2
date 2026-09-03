-- ============================================
-- REVERTIR 001_gastrostock_schema.sql
-- Ejecutado por error en restaurant_system_db
-- ============================================
-- Este script ELIMINA solo las tablas gastro_* creadas por error
-- NO toca usuarios, productos, pedidos ni ninguna tabla del Principal
-- Seguro para ejecutar en Workbench en restaurant_system_db
-- ============================================

-- 1. Verificar que tablas existen (opcional, para confirmar antes de borrar)
-- SHOW TABLES LIKE 'gastro_%';

-- 2. Desactivar chequeo de FK para borrar sin importar orden de dependencias
SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS gastro_auditoria;
DROP TABLE IF EXISTS gastro_alertas;
DROP TABLE IF EXISTS gastro_inventario_fisico_detalle;
DROP TABLE IF EXISTS gastro_inventario_fisico;
DROP TABLE IF EXISTS gastro_movimientos_kardex;
DROP TABLE IF EXISTS gastro_lotes;
DROP TABLE IF EXISTS gastro_detalle_compras;
DROP TABLE IF EXISTS gastro_compras;
DROP TABLE IF EXISTS gastro_producto_ubicacion;
DROP TABLE IF EXISTS gastro_productos;
DROP TABLE IF EXISTS gastro_ubicaciones;
DROP TABLE IF EXISTS gastro_proveedores;
DROP TABLE IF EXISTS gastro_subcategorias;
DROP TABLE IF EXISTS gastro_categorias;
DROP TABLE IF EXISTS gastro_unidades_medida;

-- NOTA: NO se hace DROP de `usuarios` porque en restaurant_system_db
-- esa tabla ya existia y contiene tus usuarios reales (admin, empleados).
-- El script 001 usa "CREATE TABLE IF NOT EXISTS usuarios", por lo que no la sobreescribio.

SET FOREIGN_KEY_CHECKS = 1;

-- 3. Verificacion final: debe devolver 0 filas
-- SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME LIKE 'gastro_%';

-- Si devuelve 0, la reversión fue exitosa.
-- Luego puedes ejecutar el 001_gastrostock_schema.sql correctamente en restaurante_inventarios_db
