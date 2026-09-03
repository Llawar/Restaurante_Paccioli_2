-- Sistema de Administración para Restaurante - Esquema de Base de Datos
-- Base de datos: restaurant_system_db
-- VERSIÓN LIMPIA: solo estructura + datos base mínimos (admin, puestos, unidades).
-- Sin datos de ejemplo: categorías, productos, mesas, clientes, proveedores, etc. se
-- crean desde el panel de administración.

-- Crear base de datos
CREATE DATABASE IF NOT EXISTS restaurant_system_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE restaurant_system_db;

-- Tabla: usuarios
CREATE TABLE usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    usuario VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    email VARCHAR(100),
    rol ENUM('admin', 'empleado', 'cocinero', 'delivery') DEFAULT 'empleado',
    puesto_cocina_id INT,
    activo TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Tabla: categorias
CREATE TABLE categorias (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL,
    descripcion TEXT,
    icono VARCHAR(50),
    color VARCHAR(7),
    puesto_cocina_id INT,
    activo TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Tabla: productos
CREATE TABLE productos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT,
    precio DECIMAL(10, 2) NOT NULL,
    categoria_id INT NOT NULL,
    imagen VARCHAR(255),
    disponible TINYINT(1) DEFAULT 1,
    requiere_inventario TINYINT(1) DEFAULT 0,
    unidad_medida VARCHAR(20) DEFAULT 'unidad',
    activo TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (categoria_id) REFERENCES categorias(id)
);

-- Tabla: inventario
CREATE TABLE inventario (
    id INT AUTO_INCREMENT PRIMARY KEY,
    producto_id INT NOT NULL UNIQUE,
    cantidad DECIMAL(10, 2) DEFAULT 0,
    stock_minimo DECIMAL(10, 2) DEFAULT 10,
    stock_maximo DECIMAL(10, 2) DEFAULT 100,
    proveedor VARCHAR(100),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (producto_id) REFERENCES productos(id) ON DELETE CASCADE
);

-- Tabla: movimientos_inventario
CREATE TABLE movimientos_inventario (
    id INT AUTO_INCREMENT PRIMARY KEY,
    producto_id INT NOT NULL,
    tipo_movimiento ENUM('entrada', 'salida', 'ajuste') NOT NULL,
    cantidad DECIMAL(10, 2) NOT NULL,
    observaciones TEXT,
    usuario_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (producto_id) REFERENCES productos(id) ON DELETE CASCADE,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
);

-- Tabla: mesas
CREATE TABLE mesas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    numero_mesa INT NOT NULL UNIQUE,
    capacidad INT DEFAULT 4,
    estado ENUM('libre', 'ocupada', 'reservada') DEFAULT 'libre',
    ubicacion VARCHAR(50),
    activo TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Tabla: clientes
CREATE TABLE clientes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    telefono VARCHAR(20),
    email VARCHAR(100),
    direccion TEXT,
    notas TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Tabla: pedidos
CREATE TABLE pedidos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    tipo ENUM('mesa', 'delivery', 'para_llevar') NOT NULL,
    mesa_id INT,
    cliente_id INT,
    delivery_id INT,
    usuario_id INT,
    estado ENUM('pendiente', 'preparando', 'listo', 'entregado', 'cancelado') DEFAULT 'pendiente',
    total DECIMAL(10, 2) DEFAULT 0,
    notas TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (mesa_id) REFERENCES mesas(id),
    FOREIGN KEY (cliente_id) REFERENCES clientes(id),
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
);

-- Tabla: delivery
CREATE TABLE delivery (
    id INT AUTO_INCREMENT PRIMARY KEY,
    pedido_id INT NOT NULL,
    repartidor_id INT,
    direccion TEXT NOT NULL,
    telefono VARCHAR(20) NOT NULL,
    nombre_cliente VARCHAR(100) NOT NULL,
    estado ENUM('pendiente', 'asignado', 'en_camino', 'entregado', 'cancelado') DEFAULT 'pendiente',
    notas TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (pedido_id) REFERENCES pedidos(id),
    FOREIGN KEY (repartidor_id) REFERENCES usuarios(id)
);

-- Tabla: puestos_cocina (para los 6 puestos de cocina)
CREATE TABLE puestos_cocina (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL,
    descripcion VARCHAR(100),
    activo TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Relación: cocinero fijo a un puesto de cocina
ALTER TABLE usuarios
  ADD CONSTRAINT fk_usuarios_puesto_cocina
  FOREIGN KEY (puesto_cocina_id) REFERENCES puestos_cocina(id);

-- Relación: 1 categoría → 1 puesto de cocina (reemplaza la tabla puente)
ALTER TABLE categorias
  ADD CONSTRAINT fk_categorias_puesto_cocina
  FOREIGN KEY (puesto_cocina_id) REFERENCES puestos_cocina(id);

-- Tabla: detalles_pedido actualizada con estado de cocina
CREATE TABLE detalles_pedido (
    id INT AUTO_INCREMENT PRIMARY KEY,
    pedido_id INT NOT NULL,
    producto_id INT NOT NULL,
    cantidad INT NOT NULL,
    precio_unitario DECIMAL(10, 2) NOT NULL,
    subtotal DECIMAL(10, 2) NOT NULL,
    notas TEXT,
    -- Campos para gestión de cocina
    estado_cocina ENUM('pendiente', 'en_preparacion', 'listo') DEFAULT 'pendiente',
    puesto_asignado_id INT,
    cocinero_id INT,
    hora_inicio_preparacion TIMESTAMP NULL,
    hora_fin_preparacion TIMESTAMP NULL,
    FOREIGN KEY (pedido_id) REFERENCES pedidos(id) ON DELETE CASCADE,
    FOREIGN KEY (producto_id) REFERENCES productos(id),
    FOREIGN KEY (puesto_asignado_id) REFERENCES puestos_cocina(id),
    FOREIGN KEY (cocinero_id) REFERENCES usuarios(id)
);

-- ============================================================
-- ============ GASTROSTOCK — GESTIÓN DE INVENTARIO ============
-- ============================================================
-- Módulo de almacén: proveedores, compras, lotes, Kardex (PEPS),
-- inventario físico, alertas y auditoría.

-- Tabla: unidades_medida
CREATE TABLE unidades_medida (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL,
    abreviatura VARCHAR(10) NOT NULL
);

-- Tabla: proveedores
CREATE TABLE proveedores (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    nit VARCHAR(20),
    telefono VARCHAR(20),
    correo VARCHAR(100),
    direccion TEXT,
    contacto VARCHAR(100),
    activo TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Tabla: compras (Compra → Entrada directa, sin orden de compra)
CREATE TABLE compras (
    id INT AUTO_INCREMENT PRIMARY KEY,
    proveedor_id INT NOT NULL,
    usuario_id INT,
    fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    total DECIMAL(12, 2) DEFAULT 0,
    notas TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (proveedor_id) REFERENCES proveedores(id),
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
);

-- Tabla: detalle_compras
CREATE TABLE detalle_compras (
    id INT AUTO_INCREMENT PRIMARY KEY,
    compra_id INT NOT NULL,
    producto_id INT NOT NULL,
    cantidad DECIMAL(10, 2) NOT NULL,
    costo_unitario DECIMAL(10, 2) NOT NULL,
    vencimiento DATE NULL,
    subtotal DECIMAL(12, 2) NOT NULL,
    FOREIGN KEY (compra_id) REFERENCES compras(id) ON DELETE CASCADE,
    FOREIGN KEY (producto_id) REFERENCES productos(id)
);

-- Tabla: lotes (LT-YYYYMMDD-NNNN)
CREATE TABLE lotes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    producto_id INT NOT NULL,
    detalle_compra_id INT,
    numero_lote VARCHAR(20) NOT NULL UNIQUE,
    cantidad_ingreso DECIMAL(10, 2) NOT NULL,
    cantidad_disponible DECIMAL(10, 2) NOT NULL,
    costo_unitario DECIMAL(10, 2) NOT NULL,
    fecha_ingreso DATE NOT NULL,
    vencimiento DATE NULL,
    agotado TINYINT(1) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (producto_id) REFERENCES productos(id) ON DELETE CASCADE,
    FOREIGN KEY (detalle_compra_id) REFERENCES detalle_compras(id)
);

-- Tabla: ubicaciones (estanterías A-01, refrigerador REF-01...)
CREATE TABLE ubicaciones (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL UNIQUE,
    tipo ENUM('estanteria', 'refrigerador', 'congelador', 'general') DEFAULT 'general'
);

-- Tabla: producto_ubicacion
CREATE TABLE producto_ubicacion (
    id INT AUTO_INCREMENT PRIMARY KEY,
    producto_id INT NOT NULL,
    ubicacion_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (producto_id) REFERENCES productos(id) ON DELETE CASCADE,
    FOREIGN KEY (ubicacion_id) REFERENCES ubicaciones(id) ON DELETE CASCADE,
    UNIQUE KEY unique_producto_ubicacion (producto_id, ubicacion_id)
);

-- Tabla: movimientos_kardex (entradas/salidas con saldo y costo PEPS)
CREATE TABLE movimientos_kardex (
    id INT AUTO_INCREMENT PRIMARY KEY,
    fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    tipo ENUM('compra', 'donacion', 'devolucion', 'ajuste_positivo', 'consumo', 'merma', 'producto_vencido', 'ajuste_negativo', 'inventario_fisico') NOT NULL,
    producto_id INT NOT NULL,
    lote_id INT,
    entrada DECIMAL(10, 2) DEFAULT 0,
    salida DECIMAL(10, 2) DEFAULT 0,
    saldo DECIMAL(10, 2) NOT NULL,
    costo_unitario DECIMAL(10, 2),
    usuario_id INT,
    referencia VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (producto_id) REFERENCES productos(id) ON DELETE CASCADE,
    FOREIGN KEY (lote_id) REFERENCES lotes(id),
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
);

-- Tabla: inventario_fisico
CREATE TABLE inventario_fisico (
    id INT AUTO_INCREMENT PRIMARY KEY,
    fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    usuario_id INT,
    estado ENUM('en_proceso', 'completado', 'cancelado') DEFAULT 'en_proceso',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
);

-- Tabla: inventario_fisico_detalle
CREATE TABLE inventario_fisico_detalle (
    id INT AUTO_INCREMENT PRIMARY KEY,
    inventario_id INT NOT NULL,
    producto_id INT NOT NULL,
    stock_sistema DECIMAL(10, 2) NOT NULL,
    stock_real DECIMAL(10, 2) NOT NULL,
    diferencia DECIMAL(10, 2) NOT NULL,
    motivo ENUM('derrame', 'error_registro', 'perdida', 'otro') DEFAULT 'otro',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (inventario_id) REFERENCES inventario_fisico(id) ON DELETE CASCADE,
    FOREIGN KEY (producto_id) REFERENCES productos(id)
);

-- Tabla: auditoria
CREATE TABLE auditoria (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT,
    accion VARCHAR(100) NOT NULL,
    entidad VARCHAR(50) NOT NULL,
    entidad_id INT,
    detalle TEXT,
    fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
);

-- ============================================================
-- ============ SEMILLAS BASE MÍNIMAS (re-ejecutables) ========
-- ============================================================
-- Solamente lo indispensable para que el sistema arranque:
--  1) Usuario admin (para poder iniciar sesión)
--  2) Los 6 puestos de cocina (el flujo de cocina los requiere)
--  3) Unidades de medida (referenciadas por el módulo de inventario)
-- SIN datos de ejemplo (categorías, productos, mesas, clientes, proveedores...).

-- Insertar usuario admin por defecto (password: admin123)
INSERT INTO usuarios (id, nombre, usuario, password, email, rol, activo) VALUES
(1, 'Administrador', 'admin', '$2b$10$16zzQcLELr0Gqno9yzxyYeevXCMqTyJ2uA6LnrxkumnPzp.UtNRe.', 'admin@restaurante.com', 'admin', 1)
ON DUPLICATE KEY UPDATE
  nombre = VALUES(nombre),
  password = VALUES(password),
  email = VALUES(email),
  rol = VALUES(rol),
  activo = VALUES(activo);

-- Insertar los 6 puestos de cocina
INSERT INTO puestos_cocina (id, nombre, descripcion, activo) VALUES
(1, 'Puesto 1 - Carnes y Parrilla', 'Especializado en carnes rojas, pollo, parrilla', 1),
(2, 'Puesto 2 - Pastas y Guarniciones', 'Pastas, arroces, papas y acompañamientos', 1),
(3, 'Puesto 3 - Entradas y Ensaladas', 'Ensaladas, sopas, aperitivos fríos', 1),
(4, 'Puesto 4 - Bebidas y Bar', 'Bebidas sin alcohol, jugos, café', 1),
(5, 'Puesto 5 - Postres', 'Postres, dulces, helados', 1),
(6, 'Puesto 6 - Especial y Apoyo', 'Platos especiales, apoyo a otros puestos', 1)
ON DUPLICATE KEY UPDATE
  nombre = VALUES(nombre),
  descripcion = VALUES(descripcion),
  activo = VALUES(activo);

-- Unidades de medida iniciales
INSERT INTO unidades_medida (id, nombre, abreviatura) VALUES
(1, 'Kilogramo', 'Kg'),
(2, 'Gramo', 'g'),
(3, 'Litro', 'L'),
(4, 'Mililitro', 'ml'),
(5, 'Unidad', 'Unidad'),
(6, 'Caja', 'Caja'),
(7, 'Botella', 'Botella')
ON DUPLICATE KEY UPDATE
  nombre = VALUES(nombre),
  abreviatura = VALUES(abreviatura);