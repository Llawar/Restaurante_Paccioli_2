-- GASTROSTOCK - Esquema de base de datos
-- Sistema de gestión de inventario para almacén de restaurante gourmet
-- BD independiente: restaurante_inventarios_db (separada de restaurant_system_db del POS)
-- Tablas con prefijo gastro_ | usuario_id sin FK cross-DB, validado via JWT compartido

-- ============================================================
-- 1. CATEGORIAS
-- ============================================================
CREATE TABLE IF NOT EXISTS gastro_categorias (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL,
    codigo VARCHAR(5) NOT NULL,
    descripcion TEXT,
    activo TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uq_gastro_cat_codigo (codigo),
    UNIQUE KEY uq_gastro_cat_nombre (nombre)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- 2. SUBCATEGORIAS
-- ============================================================
CREATE TABLE IF NOT EXISTS gastro_subcategorias (
    id INT AUTO_INCREMENT PRIMARY KEY,
    categoria_id INT NOT NULL,
    nombre VARCHAR(50) NOT NULL,
    codigo VARCHAR(5) NOT NULL,
    activo TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uq_gastro_subcat_codigo (codigo),
    FOREIGN KEY (categoria_id) REFERENCES gastro_categorias(id) ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- 3. UNIDADES DE MEDIDA
-- ============================================================
CREATE TABLE IF NOT EXISTS gastro_unidades_medida (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL,
    abreviatura VARCHAR(10) NOT NULL,
    activo TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uq_gastro_um_abrev (abreviatura)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- 4. PRODUCTOS
-- ============================================================
CREATE TABLE IF NOT EXISTS gastro_productos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    codigo VARCHAR(20) NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    subcategoria_id INT,
    unidad_id INT,
    controla_vencimiento TINYINT(1) DEFAULT 0,
    stock_minimo DECIMAL(12,3) DEFAULT 0,
    stock_actual DECIMAL(12,3) DEFAULT 0,
    activo TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uq_gastro_prod_codigo (codigo),
    KEY idx_gastro_prod_subcat (subcategoria_id),
    FOREIGN KEY (subcategoria_id) REFERENCES gastro_subcategorias(id) ON UPDATE CASCADE ON DELETE SET NULL,
    FOREIGN KEY (unidad_id) REFERENCES gastro_unidades_medida(id) ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- 5. PROVEEDORES
-- ============================================================
CREATE TABLE IF NOT EXISTS gastro_proveedores (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    nit VARCHAR(30),
    telefono VARCHAR(30),
    correo VARCHAR(100),
    direccion VARCHAR(200),
    contacto VARCHAR(100),
    activo TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uq_gastro_prov_nombre (nombre)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- 6. UBICACIONES (estanterías / refrigeradores / congeladores)
-- ============================================================
CREATE TABLE IF NOT EXISTS gastro_ubicaciones (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(20) NOT NULL,
    tipo ENUM('ESTANTERIA','REFRIGERADOR','CONGELADOR') DEFAULT 'ESTANTERIA',
    activo TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uq_gastro_ubic_nombre (nombre)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- 7. PRODUCTO - UBICACION (un producto puede estar en varias ubicaciones)
-- ============================================================
CREATE TABLE IF NOT EXISTS gastro_producto_ubicacion (
    id INT AUTO_INCREMENT PRIMARY KEY,
    producto_id INT NOT NULL,
    ubicacion_id INT NOT NULL,
    activo TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (producto_id) REFERENCES gastro_productos(id) ON UPDATE CASCADE ON DELETE CASCADE,
    FOREIGN KEY (ubicacion_id) REFERENCES gastro_ubicaciones(id) ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- 8. COMPRAS
-- ============================================================
CREATE TABLE IF NOT EXISTS gastro_compras (
    id INT AUTO_INCREMENT PRIMARY KEY,
    proveedor_id INT NOT NULL,
    usuario_id INT COMMENT 'ID de usuarios de restaurant_system_db, sin FK cross-DB',
    fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    total DECIMAL(14,2) DEFAULT 0,
    estado ENUM('REGISTRADA','CANCELADA') DEFAULT 'REGISTRADA',
    activo TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (proveedor_id) REFERENCES gastro_proveedores(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- 9. DETALLE COMPRAS
-- ============================================================
CREATE TABLE IF NOT EXISTS gastro_detalle_compras (
    id INT AUTO_INCREMENT PRIMARY KEY,
    compra_id INT NOT NULL,
    producto_id INT NOT NULL,
    cantidad DECIMAL(12,3) NOT NULL,
    costo_unitario DECIMAL(12,3) NOT NULL,
    vencimiento DATE,
    subtotal DECIMAL(14,2) NOT NULL,
    FOREIGN KEY (compra_id) REFERENCES gastro_compras(id) ON UPDATE CASCADE ON DELETE CASCADE,
    FOREIGN KEY (producto_id) REFERENCES gastro_productos(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- 10. LOTES (LT-YYYYMMDD-NNNN)
-- ============================================================
CREATE TABLE IF NOT EXISTS gastro_lotes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    producto_id INT NOT NULL,
    detalle_compra_id INT,
    numero_lote VARCHAR(20) NOT NULL,
    cantidad_ingreso DECIMAL(12,3) NOT NULL,
    cantidad_disponible DECIMAL(12,3) NOT NULL,
    costo_unitario DECIMAL(12,3) NOT NULL,
    fecha_ingreso TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    vencimiento DATE,
    activo TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uq_gastro_lote_numero (numero_lote),
    KEY idx_gastro_lote_producto (producto_id),
    FOREIGN KEY (producto_id) REFERENCES gastro_productos(id),
    FOREIGN KEY (detalle_compra_id) REFERENCES gastro_detalle_compras(id) ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- 11. MOVIMIENTOS KARDEX
-- ============================================================
CREATE TABLE IF NOT EXISTS gastro_movimientos_kardex (
    id INT AUTO_INCREMENT PRIMARY KEY,
    fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    tipo ENUM('ENTRADA','SALIDA','AJUSTE') NOT NULL,
    concepto ENUM('COMPRA','DONACION','DEVOLUCION','CONSUMO','MERMA','VENCIDO','AJUSTE_POSITIVO','AJUSTE_NEGATIVO','INVENTARIO_FISICO') NOT NULL,
    producto_id INT NOT NULL,
    lote_id INT,
    entrada DECIMAL(12,3) DEFAULT 0,
    salida DECIMAL(12,3) DEFAULT 0,
    saldo DECIMAL(12,3) DEFAULT 0,
    costo_unitario DECIMAL(12,3) DEFAULT 0,
    usuario_id INT COMMENT 'ID de usuarios de restaurant_system_db, sin FK cross-DB',
    referencia VARCHAR(200),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    KEY idx_gastro_kardex_producto (producto_id),
    FOREIGN KEY (producto_id) REFERENCES gastro_productos(id),
    FOREIGN KEY (lote_id) REFERENCES gastro_lotes(id) ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- 12. INVENTARIO FISICO (conteo)
-- ============================================================
CREATE TABLE IF NOT EXISTS gastro_inventario_fisico (
    id INT AUTO_INCREMENT PRIMARY KEY,
    fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    usuario_id INT COMMENT 'ID de usuarios de restaurant_system_db, sin FK cross-DB',
    estado ENUM('EN_PROGRESO','COMPLETADO','CANCELADO') DEFAULT 'EN_PROGRESO',
    activo TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- 13. INVENTARIO FISICO DETALLE
-- ============================================================
CREATE TABLE IF NOT EXISTS gastro_inventario_fisico_detalle (
    id INT AUTO_INCREMENT PRIMARY KEY,
    inventario_id INT NOT NULL,
    producto_id INT NOT NULL,
    stock_sistema DECIMAL(12,3) NOT NULL,
    stock_real DECIMAL(12,3) NOT NULL,
    diferencia DECIMAL(12,3) NOT NULL,
    motivo ENUM('DERRAME','ERROR_REGISTRO','PERDIDA','OTRO') DEFAULT 'OTRO',
    FOREIGN KEY (inventario_id) REFERENCES gastro_inventario_fisico(id) ON UPDATE CASCADE ON DELETE CASCADE,
    FOREIGN KEY (producto_id) REFERENCES gastro_productos(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- 14. ALERTAS (logs de alertas generadas)
-- ============================================================
CREATE TABLE IF NOT EXISTS gastro_alertas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    producto_id INT NOT NULL,
    tipo ENUM('STOCK_MINIMO','AGOTADO','PROXIMO_VENCER') NOT NULL,
    mensaje VARCHAR(255) NOT NULL,
    leida TINYINT(1) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    KEY idx_gastro_alerta_producto (producto_id),
    FOREIGN KEY (producto_id) REFERENCES gastro_productos(id) ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- 15. AUDITORIA
-- ============================================================
CREATE TABLE IF NOT EXISTS gastro_auditoria (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT COMMENT 'ID de usuarios de restaurant_system_db, sin FK cross-DB',
    accion VARCHAR(100) NOT NULL,
    entidad VARCHAR(50) NOT NULL,
    entidad_id INT,
    detalle TEXT,
    fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
