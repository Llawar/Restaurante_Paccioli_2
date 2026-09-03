-- ============================================================
-- GASTROSTOCK - INSTALACIÓN DESDE CERO (solo inventario)
-- ------------------------------------------------------------
-- Crea la base de datos, la tabla de usuarios (login) y todas las
-- tablas gastro_* del sistema de inventario, TODO VACÍO.
--
-- Cómo usarlo:
--   C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe -u root -p < install.sql
-- (o pégalo completo en MySQL Workbench y ejecútalo)
--
-- Login por defecto al terminar:  admin / admin123
-- ============================================================

-- 0. Crear la base de datos (si no existe) y usarla
CREATE DATABASE IF NOT EXISTS restaurant_inventarios_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;
USE restaurant_inventarios_db;

-- ============================================================
-- 1. TABLA DE USUARIOS (login de GastroStock)
--    Se crea aquí para que GastroStock funcione sola, sin el POS.
-- ============================================================
CREATE TABLE IF NOT EXISTS usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    usuario VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    email VARCHAR(100),
    rol ENUM('admin', 'empleado', 'cocinero', 'delivery') DEFAULT 'empleado',
    activo TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Usuario administrador por defecto (password: admin123)
INSERT IGNORE INTO usuarios (nombre, usuario, password, email, rol, activo) VALUES
('Administrador', 'admin', '$2b$10$16zzQcLELr0Gqno9yzxyYeevXCMqTyJ2uA6LnrxkumnPzp.UtNRe.', 'admin@restaurante.com', 'admin', 1);

-- ============================================================
-- 2. GASTRO - CATEGORIAS
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
-- 3. GASTRO - SUBCATEGORIAS
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
-- 4. GASTRO - UNIDADES DE MEDIDA
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
-- 5. GASTRO - PRODUCTOS
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
-- 6. GASTRO - PROVEEDORES
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
-- 7. GASTRO - UBICACIONES
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
-- 8. GASTRO - PRODUCTO - UBICACION
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
-- 9. GASTRO - COMPRAS
-- ============================================================
CREATE TABLE IF NOT EXISTS gastro_compras (
    id INT AUTO_INCREMENT PRIMARY KEY,
    proveedor_id INT NOT NULL,
    usuario_id INT,
    fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    total DECIMAL(14,2) DEFAULT 0,
    estado ENUM('REGISTRADA','CANCELADA') DEFAULT 'REGISTRADA',
    activo TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (proveedor_id) REFERENCES gastro_proveedores(id),
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- 10. GASTRO - DETALLE COMPRAS
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
-- 11. GASTRO - LOTES
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
-- 12. GASTRO - MOVIMIENTOS KARDEX
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
    usuario_id INT,
    referencia VARCHAR(200),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    KEY idx_gastro_kardex_producto (producto_id),
    KEY idx_kardex_producto_fecha (producto_id, fecha),
    FOREIGN KEY (producto_id) REFERENCES gastro_productos(id),
    FOREIGN KEY (lote_id) REFERENCES gastro_lotes(id) ON UPDATE CASCADE ON DELETE SET NULL,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- 13. GASTRO - INVENTARIO FISICO
-- ============================================================
CREATE TABLE IF NOT EXISTS gastro_inventario_fisico (
    id INT AUTO_INCREMENT PRIMARY KEY,
    fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    usuario_id INT,
    estado ENUM('EN_PROGRESO','COMPLETADO','CANCELADO') DEFAULT 'EN_PROGRESO',
    activo TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- 14. GASTRO - INVENTARIO FISICO DETALLE
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
-- 15. GASTRO - ALERTAS
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
-- 16. GASTRO - AUDITORIA
-- ============================================================
CREATE TABLE IF NOT EXISTS gastro_auditoria (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT,
    accion VARCHAR(100) NOT NULL,
    entidad VARCHAR(50) NOT NULL,
    entidad_id INT,
    detalle TEXT,
    fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- LISTO. Todas las tablas quedaron VACÍAS (solo el usuario admin).
-- Comienza tu paso a paso desde cero.
-- ============================================================
