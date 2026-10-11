-- 008_entregas_turno.sql
-- Sistema de entregas de turno
-- Fecha: 2025-01-XX

-- Tabla de entregas de turno
CREATE TABLE IF NOT EXISTS entregas_turno (
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

-- Índices
CREATE INDEX IF NOT EXISTS idx_entregas_fecha ON entregas_turno(fecha_entrega);
