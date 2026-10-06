-- Script para crear usuarios de prueba con contraseñas hasheadas
-- Ejecutar: psql -U postgres -d geriatric_app -f database/create_test_users.sql

-- Nota: Las contraseñas están en texto plano para demostración
-- En producción usar bcrypt para hashear las contraseñas

-- Enfermera María García
INSERT INTO usuarios (nombre, apellido, email, password, rol) 
VALUES ('María', 'García', 'maria.garcia@geriatric.com', 'enfermera123', 'enfermera')
ON CONFLICT (email) DO UPDATE SET 
  nombre = EXCLUDED.nombre,
  apellido = EXCLUDED.apellido,
  password = EXCLUDED.password,
  rol = EXCLUDED.rol;

-- Jefe de Enfermería Carlos Rodríguez
INSERT INTO usuarios (nombre, apellido, email, password, rol) 
VALUES ('Carlos', 'Rodríguez', 'carlos.rodriguez@geriatric.com', 'jefe123', 'jefe_enfermeria')
ON CONFLICT (email) DO UPDATE SET 
  nombre = EXCLUDED.nombre,
  apellido = EXCLUDED.apellido,
  password = EXCLUDED.password,
  rol = EXCLUDED.rol;

-- Enfermera Ana Martínez
INSERT INTO usuarios (nombre, apellido, email, password, rol) 
VALUES ('Ana', 'Martínez', 'ana.martinez@geriatric.com', 'ana123', 'enfermera')
ON CONFLICT (email) DO UPDATE SET 
  nombre = EXCLUDED.nombre,
  apellido = EXCLUDED.apellido,
  password = EXCLUDED.password,
  rol = EXCLUDED.rol;

-- Verificar usuarios creados
SELECT id, nombre, apellido, email, rol, fecha_creacion FROM usuarios;