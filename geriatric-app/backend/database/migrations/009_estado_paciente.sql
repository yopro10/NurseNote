-- 009_estado_paciente.sql
-- Agregar estado calculado a pacientes
-- Fecha: 2025-01-XX

-- Agregar campos de estado calculado a pacientes
DO $$
BEGIN
    -- Verificar si la columna existe antes de agregarla
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'pacientes' AND column_name = 'estado_calculado'
    ) THEN
        ALTER TABLE pacientes ADD COLUMN estado_calculado VARCHAR(50) DEFAULT 'Estable';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'pacientes' AND column_name = 'fecha_ultimo_estado'
    ) THEN
        ALTER TABLE pacientes ADD COLUMN fecha_ultimo_estado TIMESTAMP;
    END IF;
END $$;

-- Índice para estado
CREATE INDEX IF NOT EXISTS idx_pacientes_estado ON pacientes(estado_calculado);
