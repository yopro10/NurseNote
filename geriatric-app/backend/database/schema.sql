-- Schema para Sistema de Gestión de Hogares Geriátricos (NurseNote)
-- Base de datos: PostgreSQL

-- Crear base de datos
-- CREATE DATABASE geriatric_app;

-- Tabla de usuarios
CREATE TABLE usuarios (
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
CREATE TABLE pacientes (
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
CREATE TABLE medicamentos (
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

-- Tabla de medicamentos asignados a pacientes
CREATE TABLE medicamentos_pacientes (
    id SERIAL PRIMARY KEY,
    paciente_id INTEGER NOT NULL REFERENCES pacientes(id) ON DELETE CASCADE,
    medicamento_id INTEGER NOT NULL REFERENCES medicamentos(id) ON DELETE CASCADE,
    dosis_prescrita VARCHAR(100),
    frecuencia VARCHAR(100),
    via_administracion VARCHAR(50),
    fecha_inicio DATE NOT NULL,
    fecha_fin DATE,
    observaciones TEXT,
    activo BOOLEAN DEFAULT true,
    fecha_asignacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(paciente_id, medicamento_id, fecha_inicio)
);

-- Tabla de notas de enfermería
CREATE TABLE notas_enfermeria (
    id SERIAL PRIMARY KEY,
    paciente_id INTEGER NOT NULL REFERENCES pacientes(id) ON DELETE CASCADE,
    usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    tipo_nota VARCHAR(50) CHECK (tipo_nota IN ('ingreso', 'evolucion', 'egreso', 'medicacion', 'signos_vitales', 'observacion')),
    contenido TEXT,
    signos_vitales JSONB,
    administracion_medicamentos JSONB,
    observaciones TEXT,
    estado_paciente VARCHAR(100),
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP
);

-- Tabla de alertas de medicamentos
CREATE TABLE alertas_medicamentos (
    id SERIAL PRIMARY KEY,
    medicamento_id INTEGER NOT NULL REFERENCES medicamentos(id) ON DELETE CASCADE,
    tipo_alerta VARCHAR(50) CHECK (tipo_alerta IN ('caducidad_proxima', 'vencido', 'stock_bajo')),
    mensaje TEXT,
    fecha_alerta TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    leida BOOLEAN DEFAULT false,
    fecha_lectura TIMESTAMP
);

-- Índices para mejorar el rendimiento
CREATE INDEX idx_usuarios_email ON usuarios(email);
CREATE INDEX idx_usuarios_rol ON usuarios(rol);
CREATE INDEX idx_pacientes_activo ON pacientes(activo);
CREATE INDEX idx_pacientes_habitacion ON pacientes(habitacion);
CREATE INDEX idx_medicamentos_activo ON medicamentos(activo);
CREATE INDEX idx_medicamentos_caducidad ON medicamentos(fecha_caducidad);
CREATE INDEX idx_medicamentos_cantidad ON medicamentos(cantidad_disponible);
CREATE INDEX idx_medicamentos_pacientes_paciente ON medicamentos_pacientes(paciente_id);
CREATE INDEX idx_medicamentos_pacientes_medicamento ON medicamentos_pacientes(medicamento_id);
CREATE INDEX idx_notas_paciente ON notas_enfermeria(paciente_id);
CREATE INDEX idx_notas_usuario ON notas_enfermeria(usuario_id);
CREATE INDEX idx_notas_fecha ON notas_enfermeria(fecha_registro);
CREATE INDEX idx_alertas_medicamento ON alertas_medicamentos(medicamento_id);
CREATE INDEX idx_alertas_leida ON alertas_medicamentos(leida);

-- Datos de prueba (opcional)
-- Usuario administrador por defecto
INSERT INTO usuarios (nombre, apellido, email, password, rol) 
VALUES ('Admin', 'Sistema', 'admin@geriatric.com', '$2a$10$YourHashedPasswordHere', 'administrador');

-- Función para generar alertas automáticas de caducidad
CREATE OR REPLACE FUNCTION generar_alertas_caducidad()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.fecha_caducidad <= CURRENT_DATE + INTERVAL '30 days' AND NEW.fecha_caducidad > CURRENT_DATE THEN
        INSERT INTO alertas_medicamentos (medicamento_id, tipo_alerta, mensaje)
        VALUES (NEW.id, 'caducidad_proxima', 'Medicamento próximo a vencer: ' || NEW.nombre);
    ELSIF NEW.fecha_caducidad <= CURRENT_DATE THEN
        INSERT INTO alertas_medicamentos (medicamento_id, tipo_alerta, mensaje)
        VALUES (NEW.id, 'vencido', 'Medicamento vencido: ' || NEW.nombre);
    END IF;
    
    IF NEW.cantidad_disponible <= 10 THEN
        INSERT INTO alertas_medicamentos (medicamento_id, tipo_alerta, mensaje)
        VALUES (NEW.id, 'stock_bajo', 'Stock bajo para medicamento: ' || NEW.nombre);
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para generar alertas automáticamente
CREATE TRIGGER trigger_alertas_medicamentos
AFTER INSERT OR UPDATE ON medicamentos
FOR EACH ROW
EXECUTE FUNCTION generar_alertas_caducidad();