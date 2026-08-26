-- Seed: Usuario administrador por defecto (password: admin123)
INSERT IGNORE INTO usuarios (nombre, usuario, password, email, rol, activo) VALUES
('Administrador', 'admin', '$2b$10$16zzQcLELr0Gqno9yzxyYeevXCMqTyJ2uA6LnrxkumnPzp.UtNRe.', 'admin@restaurante.com', 'admin', 1);
