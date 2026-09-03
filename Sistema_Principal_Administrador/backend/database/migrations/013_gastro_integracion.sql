-- ============================================================
-- INTEGRACIÓN SISTEMA PRINCIPAL <-> GASTROSTOCK (BD separada)
-- BD Principal: restaurant_system_db
-- BD Inventarios: restaurante_inventarios_db (via API HTTP)
-- Fecha: 2026-09-03
-- ============================================================

-- 1. RECETA: Mapea platillo del POS (productos) -> insumo de Gastro (gastro_productos)
-- Permite descontar stock automáticamente al vender. Ej: Milanesa -> 0.250kg Carne
CREATE TABLE IF NOT EXISTS receta_detalle (
    id INT AUTO_INCREMENT PRIMARY KEY,
    producto_id INT NOT NULL COMMENT 'FK a productos.id (platillo del POS)',
    gastro_producto_id INT NOT NULL COMMENT 'ID en restaurante_inventarios_db.gastro_productos (insumo)',
    cantidad DECIMAL(12,3) NOT NULL COMMENT 'Cantidad de insumo por 1 unidad de platillo',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (producto_id) REFERENCES productos(id) ON UPDATE CASCADE ON DELETE CASCADE,
    UNIQUE KEY uq_receta_producto_insumo (producto_id, gastro_producto_id),
    KEY idx_receta_gastro_producto (gastro_producto_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Receta: platillo -> insumos GastroStock';

-- 2. COLA DE CONSUMO (Outbox Pattern): garantiza que ningún pedido se pierda
-- aunque GastroStock esté caído. Un SyncService reintenta los pendientes.
CREATE TABLE IF NOT EXISTS sync_consumo_cola (
    id INT AUTO_INCREMENT PRIMARY KEY,
    pedido_id INT NOT NULL COMMENT 'FK a pedidos.id',
    detalle_pedido_id INT NULL COMMENT 'FK a detalles_pedido.id (opcional, para trazabilidad)',
    gastro_producto_id INT NOT NULL COMMENT 'ID en restaurante_inventarios_db.gastro_productos',
    cantidad DECIMAL(12,3) NOT NULL COMMENT 'Cantidad total a descontar (cantidad_receta * cantidad_pedido)',
    estado ENUM('pendiente','enviado','error') NOT NULL DEFAULT 'pendiente',
    intentos INT NOT NULL DEFAULT 0,
    ultimo_error TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (pedido_id) REFERENCES pedidos(id) ON UPDATE CASCADE ON DELETE CASCADE,
    FOREIGN KEY (detalle_pedido_id) REFERENCES detalles_pedido(id) ON UPDATE CASCADE ON DELETE SET NULL,
    KEY idx_sync_estado (estado),
    KEY idx_sync_pedido (pedido_id),
    KEY idx_sync_gastro_producto (gastro_producto_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Cola outbox para consumo de inventario en GastroStock';
