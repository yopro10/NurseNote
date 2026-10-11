-- 006_auditoria.sql
-- Sistema de auditoría
-- Fecha: 2025-01-XX

-- Tabla de auditoría (quién hizo qué y cuándo)
CREATE TABLE IF NOT EXISTS auditoria (
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

-- Índices
CREATE INDEX IF NOT EXISTS idx_auditoria_usuario ON auditoria(usuario_id);
CREATE INDEX IF NOT EXISTS idx_auditoria_tabla ON auditoria(tabla_afectada);
CREATE INDEX IF NOT EXISTS idx_auditoria_fecha ON auditoria(fecha_accion);
