-- 007_administraciones_medicamentos.sql
-- Sistema de administración de medicamentos
-- Fecha: 2025-01-XX

-- Tabla de administraciones de medicamentos
CREATE TABLE IF NOT EXISTS administraciones_medicamentos (
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

-- Índices
CREATE INDEX IF NOT EXISTS idx_administraciones_paciente ON administraciones_medicamentos(paciente_id);
CREATE INDEX IF NOT EXISTS idx_administraciones_estado ON administraciones_medicamentos(estado);
CREATE INDEX IF NOT EXISTS idx_administraciones_horario ON administraciones_medicamentos(horario_programado);
