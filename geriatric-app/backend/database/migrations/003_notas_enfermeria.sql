-- 003_notas_enfermeria.sql
-- Notas de enfermería
-- Fecha: 2025-01-XX

-- Tabla de notas de enfermería
CREATE TABLE IF NOT EXISTS notas_enfermeria (
    id SERIAL PRIMARY KEY,
    paciente_id INTEGER NOT NULL REFERENCES pacientes(id) ON DELETE CASCADE,
    usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    tipo_nota VARCHAR(50) CHECK (tipo_nota IN ('ingreso', 'evolucion', 'egreso', 'medicacion', 'signos_vitales', 'observacion', 'correccion')),
    contenido TEXT,
    signos_vitales JSONB,
    administracion_medicamentos JSONB,
    observaciones TEXT,
    estado_paciente VARCHAR(100),
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_notas_paciente ON notas_enfermeria(paciente_id);
CREATE INDEX IF NOT EXISTS idx_notas_usuario ON notas_enfermeria(usuario_id);
CREATE INDEX IF NOT EXISTS idx_notas_fecha ON notas_enfermeria(fecha_registro);
CREATE INDEX IF NOT EXISTS idx_notas_tipo ON notas_enfermeria(tipo_nota);
