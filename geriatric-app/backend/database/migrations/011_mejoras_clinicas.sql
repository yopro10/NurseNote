-- 011_mejoras_clinicas.sql
-- Estado calculado con historial, sistema de medicación completo, entrega de turno,
-- notificaciones, movimientos de inventario y anulación de notas. Idempotente.

DROP TRIGGER IF EXISTS trigger_alertas_medicamentos ON medicamentos;
DROP FUNCTION IF EXISTS generar_alertas_caducidad();

-- ---------- Pacientes ----------
ALTER TABLE pacientes ADD COLUMN IF NOT EXISTS documento VARCHAR(30);
ALTER TABLE pacientes ADD COLUMN IF NOT EXISTS estado_motivo TEXT;
ALTER TABLE pacientes ADD COLUMN IF NOT EXISTS motivo_egreso TEXT;
UPDATE pacientes SET estado_calculado = 'Estable' WHERE estado_calculado IS NULL;

CREATE TABLE IF NOT EXISTS historial_estado_paciente (
    id SERIAL PRIMARY KEY,
    paciente_id INTEGER NOT NULL REFERENCES pacientes(id) ON DELETE CASCADE,
    estado_anterior VARCHAR(50),
    estado_nuevo VARCHAR(50) NOT NULL,
    origen VARCHAR(20) NOT NULL DEFAULT 'automatico',
    motivo TEXT,
    usuario_id INTEGER REFERENCES usuarios(id) ON DELETE SET NULL,
    fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_hist_estado_paciente ON historial_estado_paciente(paciente_id, fecha DESC);

-- ---------- Inventario ----------
ALTER TABLE medicamentos ADD COLUMN IF NOT EXISTS stock_minimo INTEGER DEFAULT 10;

CREATE TABLE IF NOT EXISTS movimientos_inventario (
    id SERIAL PRIMARY KEY,
    medicamento_id INTEGER NOT NULL REFERENCES medicamentos(id) ON DELETE CASCADE,
    usuario_id INTEGER REFERENCES usuarios(id) ON DELETE SET NULL,
    tipo VARCHAR(20) NOT NULL,
    cantidad INTEGER NOT NULL,
    stock_resultante INTEGER NOT NULL,
    motivo TEXT,
    fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_mov_inventario_med ON movimientos_inventario(medicamento_id, fecha DESC);

-- ---------- Prescripciones ----------
ALTER TABLE medicamentos_pacientes ADD COLUMN IF NOT EXISTS horarios VARCHAR(100);
ALTER TABLE medicamentos_pacientes ADD COLUMN IF NOT EXISTS unidades_por_dosis INTEGER DEFAULT 1;
ALTER TABLE medicamentos_pacientes ADD COLUMN IF NOT EXISTS prescrito_por INTEGER REFERENCES usuarios(id) ON DELETE SET NULL;
ALTER TABLE medicamentos_pacientes ADD COLUMN IF NOT EXISTS motivo_suspension TEXT;
ALTER TABLE medicamentos_pacientes ADD COLUMN IF NOT EXISTS fecha_suspension TIMESTAMP;

-- ---------- Administraciones ----------
ALTER TABLE administraciones_medicamentos ALTER COLUMN usuario_id DROP NOT NULL;
ALTER TABLE administraciones_medicamentos ADD COLUMN IF NOT EXISTS unidades_descontadas INTEGER DEFAULT 0;
ALTER TABLE administraciones_medicamentos DROP CONSTRAINT IF EXISTS administraciones_medicamentos_estado_check;
ALTER TABLE administraciones_medicamentos ADD CONSTRAINT administraciones_medicamentos_estado_check
    CHECK (estado IN ('programada', 'administrada', 'omitida', 'rechazada', 'cancelada'));
CREATE UNIQUE INDEX IF NOT EXISTS uq_admin_prescripcion_horario
    ON administraciones_medicamentos(medicamento_paciente_id, horario_programado)
    WHERE medicamento_paciente_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_administraciones_fecha_admin ON administraciones_medicamentos(horario_administracion);

-- ---------- Notas ----------
ALTER TABLE notas_enfermeria ADD COLUMN IF NOT EXISTS anulada BOOLEAN DEFAULT false;
ALTER TABLE notas_enfermeria ADD COLUMN IF NOT EXISTS motivo_anulacion TEXT;
ALTER TABLE notas_enfermeria ADD COLUMN IF NOT EXISTS anulada_por INTEGER REFERENCES usuarios(id) ON DELETE SET NULL;
ALTER TABLE notas_enfermeria ADD COLUMN IF NOT EXISTS fecha_anulacion TIMESTAMP;

-- ---------- Entrega de turno ----------
ALTER TABLE entregas_turno ALTER COLUMN usuario_saliente_id DROP NOT NULL;
ALTER TABLE entregas_turno ALTER COLUMN usuario_entrante_id DROP NOT NULL;
ALTER TABLE entregas_turno ADD COLUMN IF NOT EXISTS turno VARCHAR(20);
ALTER TABLE entregas_turno ADD COLUMN IF NOT EXISTS resumen JSONB;
ALTER TABLE entregas_turno ADD COLUMN IF NOT EXISTS fecha_confirmacion TIMESTAMP;

-- ---------- Notificaciones ----------
CREATE TABLE IF NOT EXISTS notificaciones_leidas (
    usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    clave VARCHAR(120) NOT NULL,
    fecha_lectura TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (usuario_id, clave)
);

-- ---------- Auditoría ----------
ALTER TABLE auditoria DROP CONSTRAINT IF EXISTS auditoria_accion_check;
ALTER TABLE auditoria ADD CONSTRAINT auditoria_accion_check CHECK (accion IN (
    'crear', 'actualizar', 'eliminar', 'desactivar', 'reactivar', 'login', 'logout', 'relevo',
    'administrar', 'omitir', 'ajustar_stock', 'exportar', 'estado_manual', 'anular', 'confirmar_relevo'));
