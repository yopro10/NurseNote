-- Script para crear usuarios de prueba en la base de datos geriatric_app
-- Ejecutar: psql -U postgres -d geriatric_app -f database/insert_usuarios.sql

-- Enfermera de prueba (contraseña: enfermera123)
INSERT INTO usuarios (nombre, apellido, email, password, rol) 
VALUES ('María', 'García', 'maria.garcia@geriatric.com', '$2a$10$YourHashedPasswordHereForEnfermera', 'enfermera');

-- Jefe de Enfermería de prueba (contraseña: jefe123)
INSERT INTO usuarios (nombre, apellido, email, password, rol) 
VALUES ('Carlos', 'Rodríguez', 'carlos.rodriguez@geriatric.com', '$2a$10$YourHashedPasswordHereForJefe', 'jefe_enfermeria');

-- Segunda enfermera de prueba (contraseña: ana123)
INSERT INTO usuarios (nombre, apellido, email, password, rol) 
VALUES ('Ana', 'Martínez', 'ana.martinez@geriatric.com', '$2a$10$YourHashedPasswordHereForAna', 'enfermera');

-- Para ver los usuarios creados
SELECT id, nombre, apellido, email, rol, fecha_creacion FROM usuarios;