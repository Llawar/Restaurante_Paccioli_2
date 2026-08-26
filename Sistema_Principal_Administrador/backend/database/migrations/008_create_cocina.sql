-- Migration: Crear tablas de cocina
CREATE TABLE IF NOT EXISTS puestos_cocina (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL,
    descripcion VARCHAR(100),
    activo TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS asignacion_puestos_categorias (
    id INT AUTO_INCREMENT PRIMARY KEY,
    puesto_id INT NOT NULL,
    categoria_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (puesto_id) REFERENCES puestos_cocina(id) ON DELETE CASCADE,
    FOREIGN KEY (categoria_id) REFERENCES categorias(id) ON DELETE CASCADE,
    UNIQUE KEY unique_puesto_categoria (puesto_id, categoria_id)
);

ALTER TABLE detalles_pedido ADD COLUMN IF NOT EXISTS (
    estado_cocina ENUM('pendiente', 'en_preparacion', 'listo') DEFAULT 'pendiente',
    puesto_asignado_id INT,
    cocinero_id INT,
    hora_inicio_preparacion TIMESTAMP NULL,
    hora_fin_preparacion TIMESTAMP NULL,
    FOREIGN KEY (puesto_asignado_id) REFERENCES puestos_cocina(id),
    FOREIGN KEY (cocinero_id) REFERENCES usuarios(id)
);
