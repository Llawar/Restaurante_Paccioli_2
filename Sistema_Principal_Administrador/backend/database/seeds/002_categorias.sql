-- Seed: Categorías de ejemplo (1 categoría → 1 puesto de cocina)
-- Los puestos de cocina deben existir antes de asignar la categoría (ver 003_puestos_cocina.sql).
UPDATE categorias c
LEFT JOIN puestos_cocina pc ON pc.id = c.puesto_cocina_id
SET c.puesto_cocina_id = NULL
WHERE c.puesto_cocina_id IS NULL;

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
