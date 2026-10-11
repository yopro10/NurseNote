-- 005_alertas_medicamentos.sql
-- Sistema de alertas de medicamentos
-- Fecha: 2025-01-XX

-- Tabla de alertas de medicamentos
CREATE TABLE IF NOT EXISTS alertas_medicamentos (
    id SERIAL PRIMARY KEY,
    medicamento_id INTEGER NOT NULL REFERENCES medicamentos(id) ON DELETE CASCADE,
    tipo_alerta VARCHAR(50) CHECK (tipo_alerta IN ('caducidad_proxima', 'vencido', 'stock_bajo')),
    mensaje TEXT,
    fecha_alerta TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    leida BOOLEAN DEFAULT false,
    fecha_lectura TIMESTAMP
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_alertas_medicamento ON alertas_medicamentos(medicamento_id);
CREATE INDEX IF NOT EXISTS idx_alertas_leida ON alertas_medicamentos(leida);
