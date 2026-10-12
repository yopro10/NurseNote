import pool from '../config/database.js';
import { evaluarSignos, NIVEL_ESTADO } from './rangos.js';

/** Horas hacia atrás en las que un signo vital se considera "vigente" para calcular el estado. */
const VIGENCIA_HORAS = 48;

/**
 * Calcula el estado de un residente a partir de:
 *  - su último registro de signos vitales (vigente en las últimas 48 h),
 *  - medicación omitida o rechazada en las últimas 24 h (2 o más → al menos "En Observación").
 */
export async function calcularEstado(pacienteId, db = pool) {
  const { rows: vit } = await db.query(
    `SELECT * FROM signos_vitales
     WHERE paciente_id = $1 AND fecha_registro >= NOW() - ($2 || ' hours')::interval
     ORDER BY fecha_registro DESC LIMIT 1`,
    [pacienteId, String(VIGENCIA_HORAS)]
  );
  const { rows: meds } = await db.query(
    `SELECT COUNT(*) AS total FROM administraciones_medicamentos
     WHERE paciente_id = $1 AND estado IN ('omitida', 'rechazada')
       AND horario_programado >= NOW() - INTERVAL '24 hours'`,
    [pacienteId]
  );

  let nivel = 0;
  const motivos = [];
  if (vit[0]) {
    const ev = evaluarSignos(vit[0]);
    nivel = ev.nivel;
    ev.hallazgos.forEach((h) => motivos.push(h.texto));
  }
  if (meds[0].total >= 2) {
    nivel = Math.max(nivel, 1);
    motivos.push(`${meds[0].total} dosis omitidas o rechazadas en 24 h`);
  }
  return { estado: NIVEL_ESTADO[nivel], nivel, motivo: motivos.join(' · ') || 'Signos vitales dentro de rangos' };
}

/**
 * Recalcula y persiste el estado. Si cambió, deja una fila en el historial.
 * Devuelve { estado, cambio, anterior }.
 */
export async function recalcularEstado(pacienteId, db = pool, usuarioId = null) {
  const { estado, motivo } = await calcularEstado(pacienteId, db);
  const { rows } = await db.query('SELECT estado_calculado FROM pacientes WHERE id = $1', [pacienteId]);
  if (!rows[0]) return null;
  const anterior = rows[0].estado_calculado || 'Estable';
  if (anterior === estado) {
    await db.query('UPDATE pacientes SET estado_motivo = $2 WHERE id = $1', [pacienteId, motivo]);
    return { estado, cambio: false, anterior };
  }
  await db.query(
    'UPDATE pacientes SET estado_calculado = $2, estado_motivo = $3, fecha_ultimo_estado = NOW() WHERE id = $1',
    [pacienteId, estado, motivo]
  );
  await db.query(
    `INSERT INTO historial_estado_paciente (paciente_id, estado_anterior, estado_nuevo, origen, motivo, usuario_id)
     VALUES ($1, $2, $3, 'automatico', $4, $5)`,
    [pacienteId, anterior, estado, motivo, usuarioId]
  );
  return { estado, cambio: true, anterior };
}
