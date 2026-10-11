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

-- Tabla de auditoría (quién hizo qué y cuándo)
CREATE TABLE auditoria (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER REFERENCES usuarios(id) ON DELETE SET NULL,
    accion VARCHAR(50) NOT NULL CHECK (accion IN ('crear', 'actualizar', 'eliminar', 'desactivar', 'reactivar', 'login', 'logout', 'relevo')),
    tabla_afectada VARCHAR(50) NOT NULL,
    registro_id INTEGER,
    datos_anteriores JSONB,
    datos_nuevos JSONB,
    ip_address VARCHAR(45),
    user_agent TEXT,
    fecha_accion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de signos vitales (estructura separada para mejor análisis)
CREATE TABLE signos_vitales (
    id SERIAL PRIMARY KEY,
    paciente_id INTEGER NOT NULL REFERENCES pacientes(id) ON DELETE CASCADE,
    usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    presion_sistolica INTEGER,
    presion_diastolica INTEGER,
    frecuencia_cardiaca INTEGER,
    temperatura DECIMAL(4,2),
    saturacion_oxigeno INTEGER,
    frecuencia_respiratoria INTEGER,
    glucosa INTEGER,
    peso DECIMAL(5,2),
    altura INTEGER,
    observaciones TEXT,
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de administraciones de medicamentos
CREATE TABLE administraciones_medicamentos (
    id SERIAL PRIMARY KEY,
    paciente_id INTEGER NOT NULL REFERENCES pacientes(id) ON DELETE CASCADE,
    medicamento_id INTEGER NOT NULL REFERENCES medicamentos(id) ON DELETE CASCADE,
    usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    medicamento_paciente_id INTEGER REFERENCES medicamentos_pacientes(id) ON DELETE SET NULL,
    estado VARCHAR(50) NOT NULL CHECK (estado IN ('programada', 'administrada', 'omitida', 'rechazada')),
    motivo_omision TEXT,
    horario_programado TIMESTAMP NOT NULL,
    horario_administracion TIMESTAMP,
    dosis_administrada VARCHAR(100),
    observaciones TEXT,
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de entregas de turno
CREATE TABLE entregas_turno (
    id SERIAL PRIMARY KEY,
    usuario_saliente_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE SET NULL,
    usuario_entrante_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE SET NULL,
    fecha_entrega TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    notas_relevo TEXT,
    alertas_pendientes TEXT,
    pacientes_criticos TEXT,
    pendientes_medicacion TEXT,
    confirmada BOOLEAN DEFAULT false
);

-- Agregar campo de estado calculado a pacientes
ALTER TABLE pacientes ADD COLUMN estado_calculado VARCHAR(50) DEFAULT 'Estable';
ALTER TABLE pacientes ADD COLUMN fecha_ultimo_estado TIMESTAMP;

-- Índices para mejorar el rendimiento
CREATE INDEX idx_usuarios_email ON usuarios(email);
CREATE INDEX idx_usuarios_rol ON usuarios(rol);
CREATE INDEX idx_pacientes_activo ON pacientes(activo);
CREATE INDEX idx_pacientes_habitacion ON pacientes(habitacion);
CREATE INDEX idx_pacientes_estado ON pacientes(estado_calculado);
CREATE INDEX idx_medicamentos_activo ON medicamentos(activo);
CREATE INDEX idx_medicamentos_caducidad ON medicamentos(fecha_caducidad);
CREATE INDEX idx_medicamentos_cantidad ON medicamentos(cantidad_disponible);
CREATE INDEX idx_medicamentos_pacientes_paciente ON medicamentos_pacientes(paciente_id);
CREATE INDEX idx_medicamentos_pacientes_medicamento ON medicamentos_pacientes(medicamento_id);
CREATE INDEX idx_notas_paciente ON notas_enfermeria(paciente_id);
CREATE INDEX idx_notas_usuario ON notas_enfermeria(usuario_id);
CREATE INDEX idx_notas_fecha ON notas_enfermeria(fecha_registro);
CREATE INDEX idx_notas_tipo ON notas_enfermeria(tipo_nota);
CREATE INDEX idx_alertas_medicamento ON alertas_medicamentos(medicamento_id);
CREATE INDEX idx_alertas_leida ON alertas_medicamentos(leida);
CREATE INDEX idx_auditoria_usuario ON auditoria(usuario_id);
CREATE INDEX idx_auditoria_tabla ON auditoria(tabla_afectada);
CREATE INDEX idx_auditoria_fecha ON auditoria(fecha_accion);
CREATE INDEX idx_signos_paciente ON signos_vitales(paciente_id);
CREATE INDEX idx_signos_fecha ON signos_vitales(fecha_registro);
CREATE INDEX idx_administraciones_paciente ON administraciones_medicamentos(paciente_id);
CREATE INDEX idx_administraciones_estado ON administraciones_medicamentos(estado);
CREATE INDEX idx_administraciones_horario ON administraciones_medicamentos(horario_programado);
CREATE INDEX idx_entregas_fecha ON entregas_turno(fecha_entrega);

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