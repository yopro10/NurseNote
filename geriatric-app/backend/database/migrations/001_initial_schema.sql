-- 001_initial_schema.sql
-- Tablas base del sistema
-- Fecha: 2025-01-XX

-- Tabla de usuarios
CREATE TABLE IF NOT EXISTS usuarios (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    apellido VARCHAR(100),
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    rol VARCHAR(50) NOT NULL CHECK (rol IN ('administrador', 'enfermera', 'jefe_enfermeria')),
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP,
    activo BOOLEAN DEFAULT true
);

-- Tabla de pacientes
CREATE TABLE IF NOT EXISTS pacientes (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    apellido VARCHAR(100) NOT NULL,
    fecha_nacimiento DATE,
    genero VARCHAR(20) CHECK (genero IN ('masculino', 'femenino', 'otro')),
    direccion TEXT,
    telefono VARCHAR(20),
    contacto_emergencia VARCHAR(100),
    telefono_emergencia VARCHAR(20),
    alergias TEXT,
    enfermedades_cronicas TEXT,
    habitacion VARCHAR(20),
    fecha_ingreso TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_egreso TIMESTAMP,
    activo BOOLEAN DEFAULT true
);

-- Tabla de medicamentos
CREATE TABLE IF NOT EXISTS medicamentos (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(200) NOT NULL,
    descripcion TEXT,
    presentacion VARCHAR(100),
    dosis VARCHAR(100),
    via_administracion VARCHAR(50),
    cantidad_disponible INTEGER DEFAULT 0,
    fecha_caducidad DATE NOT NULL,
    lote VARCHAR(50),
    proveedor VARCHAR(100),
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP,
    activo BOOLEAN DEFAULT true
);

-- Índices iniciales
CREATE INDEX IF NOT EXISTS idx_usuarios_email ON usuarios(email);
CREATE INDEX IF NOT EXISTS idx_usuarios_rol ON usuarios(rol);
CREATE INDEX IF NOT EXISTS idx_pacientes_activo ON pacientes(activo);
CREATE INDEX IF NOT EXISTS idx_pacientes_habitacion ON pacientes(habitacion);
CREATE INDEX IF NOT EXISTS idx_medicamentos_activo ON medicamentos(activo);
CREATE INDEX IF NOT EXISTS idx_medicamentos_caducidad ON medicamentos(fecha_caducidad);
CREATE INDEX IF NOT EXISTS idx_medicamentos_cantidad ON medicamentos(cantidad_disponible);
