-- Seed: Puestos de cocina
INSERT IGNORE INTO puestos_cocina (nombre, descripcion, activo) VALUES
('Puesto 1 - Carnes y Parrilla', 'Especializado en carnes rojas, pollo, parrilla', 1),
('Puesto 2 - Pastas y Guarniciones', 'Pastas, arroces, papas y acompañamientos', 1),
('Puesto 3 - Entradas y Ensaladas', 'Ensaladas, sopas, aperitivos fríos', 1),
('Puesto 4 - Bebidas y Bar', 'Bebidas sin alcohol, jugos, café', 1),
('Puesto 5 - Postres', 'Postres, dulces, helados', 1),
('Puesto 6 - Especial y Apoyo', 'Platos especiales, apoyo a otros puestos', 1);

-- Asignar categorías a puestos
INSERT IGNORE INTO asignacion_puestos_categorias (puesto_id, categoria_id) VALUES
(1, 2),
(2, 2),
(3, 1),
(4, 3),
(5, 4),
(6, 1), (6, 2), (6, 3), (6, 4), (6, 5);
