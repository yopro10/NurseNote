-- 004_signos_vitales.sql
-- Signos vitales de pacientes
-- Fecha: 2025-01-XX

-- Tabla de signos vitales
CREATE TABLE IF NOT EXISTS signos_vitales (
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

-- Índices
CREATE INDEX IF NOT EXISTS idx_signos_paciente ON signos_vitales(paciente_id);
CREATE INDEX IF NOT EXISTS idx_signos_fecha ON signos_vitales(fecha_registro);
