-- 010_triggers_alertas.sql
-- Triggers para alertas automáticas
-- Fecha: 2025-01-XX

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
DROP TRIGGER IF EXISTS trigger_alertas_medicamentos ON medicamentos;
CREATE TRIGGER trigger_alertas_medicamentos
AFTER INSERT OR UPDATE ON medicamentos
FOR EACH ROW
EXECUTE FUNCTION generar_alertas_caducidad();
