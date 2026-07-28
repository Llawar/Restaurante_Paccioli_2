-- Seed: Usuario administrador por defecto (password: admin123)
INSERT IGNORE INTO usuarios (nombre, usuario, password, email, rol, activo) VALUES
('Administrador', 'admin', '$2b$10$9dV6sI1xNxN9YzJmGYQm3O.hLbVrO7McaKVqxhYWqXY8yEXH2XqG.', 'admin@restaurante.com', 'admin', 1);
