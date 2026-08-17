-- Seed: Puestos de cocina
INSERT IGNORE INTO puestos_cocina (nombre, descripcion, activo) VALUES
('Puesto 1 - Carnes y Parrilla', 'Especializado en carnes rojas, pollo, parrilla', 1),
('Puesto 2 - Pastas y Guarniciones', 'Pastas, arroces, papas y acompañamientos', 1),
('Puesto 3 - Entradas y Ensaladas', 'Ensaladas, sopas, aperitivos fríos', 1),
('Puesto 4 - Bebidas y Bar', 'Bebidas sin alcohol, jugos, café', 1),
('Puesto 5 - Postres', 'Postres, dulces, helados', 1),
('Puesto 6 - Especial y Apoyo', 'Platos especiales, apoyo a otros puestos', 1);

-- Asignar categorías a puestos (configurable según tu restaurante)
-- Puesto 6 (Apoyo) queda SIN asignación automática: se usa solo como refuerzo manual.
-- Modelo actual: 1 categoría → 1 puesto (columna categorias.puesto_cocina_id).
UPDATE categorias SET puesto_cocina_id =
  CASE nombre
    WHEN 'Entradas' THEN 3
    WHEN 'Platos Principales' THEN 1
    WHEN 'Bebidas' THEN 4
    WHEN 'Postres' THEN 5
    WHEN 'Bebidas Alcohólicas' THEN 4
    ELSE puesto_cocina_id
  END
WHERE nombre IN ('Entradas', 'Platos Principales', 'Bebidas', 'Postres', 'Bebidas Alcohólicas');
