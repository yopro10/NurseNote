import pool from '../config/database.js';

/**
 * Genera (de forma idempotente) las dosis "programadas" de las prescripciones activas
 * entre dos fechas. El índice único (prescripción, horario) evita duplicados.
 */
export async function generarProgramadas({ desde, hasta, pacienteId = null, prescripcionId = null }, db = pool) {
  const { rowCount } = await db.query(
    `INSERT INTO administraciones_medicamentos (paciente_id, medicamento_id, medicamento_paciente_id, estado, horario_programado, dosis_administrada)
     SELECT mp.paciente_id, mp.medicamento_id, mp.id, 'programada', (d.dia::date + trim(h.hora)::time), mp.dosis_prescrita
     FROM medicamentos_pacientes mp
     JOIN pacientes p ON p.id = mp.paciente_id AND p.activo
     JOIN medicamentos m ON m.id = mp.medicamento_id AND m.activo
     CROSS JOIN generate_series($1::date, $2::date, interval '1 day') AS d(dia)
     CROSS JOIN LATERAL unnest(string_to_array(mp.horarios, ',')) AS h(hora)
     WHERE mp.activo AND mp.horarios IS NOT NULL AND mp.horarios <> ''
       AND mp.fecha_inicio <= d.dia::date AND (mp.fecha_fin IS NULL OR mp.fecha_fin >= d.dia::date)
       AND ($3::int IS NULL OR mp.paciente_id = $3) AND ($4::int IS NULL OR mp.id = $4)
       AND (d.dia::date + trim(h.hora)::time) >= mp.fecha_asignacion /* sin dosis retroactivas */
     ON CONFLICT (medicamento_paciente_id, horario_programado) WHERE medicamento_paciente_id IS NOT NULL DO NOTHING`,
    [desde, hasta, pacienteId, prescripcionId]
  );
  return rowCount;
}

export const HORARIO_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

export function normalizarHorarios(valor) {
  if (valor === undefined || valor === null || valor === '') return '';
  const lista = (Array.isArray(valor) ? valor : String(valor).split(',')).map((h) => String(h).trim()).filter(Boolean);
  const unicos = [...new Set(lista)].sort();
  return unicos.join(',');
}
