-- 002_medicamentos_pacientes.sql
-- Asignación de medicamentos a pacientes
-- Fecha: 2025-01-XX

-- Tabla de medicamentos asignados a pacientes
CREATE TABLE IF NOT EXISTS medicamentos_pacientes (
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

-- Índices
CREATE INDEX IF NOT EXISTS idx_medicamentos_pacientes_paciente ON medicamentos_pacientes(paciente_id);
CREATE INDEX IF NOT EXISTS idx_medicamentos_pacientes_medicamento ON medicamentos_pacientes(medicamento_id);
