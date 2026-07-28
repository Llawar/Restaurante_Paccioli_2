-- Sistema de Administración para Restaurante - Esquema de Base de Datos
-- Base de datos: restaurant_system_db

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

-- Tabla: asignacion_puestos_categorias (qué categorías prepara cada puesto)
CREATE TABLE asignacion_puestos_categorias (
    id INT AUTO_INCREMENT PRIMARY KEY,
    puesto_id INT NOT NULL,
    categoria_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (puesto_id) REFERENCES puestos_cocina(id) ON DELETE CASCADE,
    FOREIGN KEY (categoria_id) REFERENCES categorias(id) ON DELETE CASCADE,
    UNIQUE KEY unique_puesto_categoria (puesto_id, categoria_id)
);

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

-- Insertar usuario admin por defecto (password: admin123)
-- La contraseña está encriptada con bcrypt (10 rounds)
INSERT INTO usuarios (nombre, usuario, password, email, rol, activo) VALUES 
('Administrador', 'admin', '$2b$10$9dV6sI1xNxN9YzJmGYQm3O.hLbVrO7McaKVqxhYWqXY8yEXH2XqG.', 'admin@restaurante.com', 'admin', 1);

-- Insertar algunas categorías de ejemplo
INSERT INTO categorias (nombre, descripcion, icono, color) VALUES
('Entradas', 'Aperitivos y entradas', 'utensils', '#FF6B6B'),
('Platos Principales', 'Platos fuertes y principales', 'utensils', '#4ECDC4'),
('Bebidas', 'Bebidas refrescantes', 'glass-water', '#45B7D1'),
('Postres', 'Dulces y postres', 'ice-cream', '#F7DC6F'),
('Bebidas Alcohólicas', 'Cervezas, vinos y cocktails', 'wine-glass', '#BB8FCE');

-- Insertar los 6 puestos de cocina
INSERT INTO puestos_cocina (nombre, descripcion, activo) VALUES
('Puesto 1 - Carnes y Parrilla', 'Especializado en carnes rojas, pollo, parrilla', 1),
('Puesto 2 - Pastas y Guarniciones', 'Pastas, arroces, papas y acompañamientos', 1),
('Puesto 3 - Entradas y Ensaladas', 'Ensaladas, sopas, aperitivos fríos', 1),
('Puesto 4 - Bebidas y Bar', 'Bebidas sin alcohol, jugos, café', 1),
('Puesto 5 - Postres', 'Postres, dulces, helados', 1),
('Puesto 6 - Especial y Apoyo', 'Platos especiales, apoyo a otros puestos', 1);

-- Asignar categorías a puestos (configurable según tu restaurante)
-- Puesto 1: Platos Principales
INSERT INTO asignacion_puestos_categorias (puesto_id, categoria_id) VALUES (1, 2);
-- Puesto 2: Platos Principales (compartido)
INSERT INTO asignacion_puestos_categorias (puesto_id, categoria_id) VALUES (2, 2);
-- Puesto 3: Entradas
INSERT INTO asignacion_puestos_categorias (puesto_id, categoria_id) VALUES (3, 1);
-- Puesto 4: Bebidas
INSERT INTO asignacion_puestos_categorias (puesto_id, categoria_id) VALUES (4, 3);
-- Puesto 5: Postres
INSERT INTO asignacion_puestos_categorias (puesto_id, categoria_id) VALUES (5, 4);
-- Puesto 6: Todas las categorías (apoyo)
INSERT INTO asignacion_puestos_categorias (puesto_id, categoria_id) VALUES (6, 1);
INSERT INTO asignacion_puestos_categorias (puesto_id, categoria_id) VALUES (6, 2);
INSERT INTO asignacion_puestos_categorias (puesto_id, categoria_id) VALUES (6, 3);
INSERT INTO asignacion_puestos_categorias (puesto_id, categoria_id) VALUES (6, 4);
INSERT INTO asignacion_puestos_categorias (puesto_id, categoria_id) VALUES (6, 5);
