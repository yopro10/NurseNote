import pool from '../config/database.js';
import { evaluarSignos } from './rangos.js';

export function turnoActual(fecha = new Date()) {
  const h = fecha.getHours();
  return h >= 6 && h < 14 ? 'mañana' : h >= 14 && h < 22 ? 'tarde' : 'noche';
}

const hhmm = (ts) => String(ts).slice(11, 16);

/** Resumen automático que se entrega al siguiente turno. Cubre desde la última entrega (o las últimas 8 h). */
export async function construirResumenTurno() {
  const { rows: ult } = await pool.query('SELECT fecha_entrega FROM entregas_turno ORDER BY fecha_entrega DESC LIMIT 1');
  const { rows: ahora } = await pool.query(`SELECT NOW()::timestamp AS ahora, GREATEST(COALESCE((SELECT MAX(fecha_entrega) FROM entregas_turno), NOW()::timestamp - INTERVAL '8 hours'), NOW()::timestamp - INTERVAL '24 hours')::timestamp AS desde`);
  const desde = ahora[0].desde;
  const hasta = ahora[0].ahora;

  const { rows: residentes } = await pool.query(
    `SELECT id, nombre, apellido, habitacion, estado_calculado, estado_motivo, alergias FROM pacientes WHERE activo = true ORDER BY habitacion NULLS LAST, nombre`);
  const crit = residentes.filter((r) => r.estado_calculado === 'Crítico');
  const obs = residentes.filter((r) => r.estado_calculado === 'En Observación');
  const mapR = (r) => ({ id: r.id, nombre: `${r.nombre} ${r.apellido}`, habitacion: r.habitacion, motivo: r.estado_motivo });

  const { rows: meds } = await pool.query(
    `SELECT a.id, a.estado, a.horario_programado, a.motivo_omision, p.nombre, p.apellido, p.habitacion, m.nombre AS medicamento
     FROM administraciones_medicamentos a JOIN pacientes p ON p.id = a.paciente_id AND p.activo JOIN medicamentos m ON m.id = a.medicamento_id
     WHERE a.horario_programado >= $1 AND a.horario_programado <= NOW() + INTERVAL '4 hours' AND a.estado <> 'cancelada'
     ORDER BY a.horario_programado`, [desde]);
  const filaMed = (a) => ({ id: a.id, residente: `${a.nombre} ${a.apellido}`, habitacion: a.habitacion, medicamento: a.medicamento, hora: hhmm(a.horario_programado), motivo: a.motivo_omision });
  const ahoraMs = Date.parse(hasta);
  const medicacion = {
    administradas: meds.filter((a) => a.estado === 'administrada').length,
    omitidas: meds.filter((a) => a.estado === 'omitida' || a.estado === 'rechazada').map((a) => ({ ...filaMed(a), estado: a.estado })),
    atrasadas: meds.filter((a) => a.estado === 'programada' && Date.parse(a.horario_programado) < ahoraMs).map(filaMed),
    proximas: meds.filter((a) => a.estado === 'programada' && Date.parse(a.horario_programado) >= ahoraMs).map(filaMed),
  };

  const { rows: vit } = await pool.query(
    `SELECT DISTINCT ON (sv.paciente_id) sv.*, p.nombre, p.apellido, p.habitacion FROM signos_vitales sv
     JOIN pacientes p ON p.id = sv.paciente_id AND p.activo WHERE sv.fecha_registro >= $1
     ORDER BY sv.paciente_id, sv.fecha_registro DESC`, [desde]);
  const signosAlterados = vit.map((v) => ({ v, ev: evaluarSignos(v) })).filter((x) => x.ev.nivel > 0)
    .map(({ v, ev }) => ({ residente: `${v.nombre} ${v.apellido}`, habitacion: v.habitacion, nivel: ev.nivel, hallazgos: ev.hallazgos.map((h) => h.texto), hora: hhmm(v.fecha_registro) }));

  const { rows: notas } = await pool.query(
    `SELECT n.id, n.tipo_nota, n.contenido, n.fecha_registro, p.nombre, p.apellido, u.nombre AS autor FROM notas_enfermeria n
     JOIN pacientes p ON p.id = n.paciente_id JOIN usuarios u ON u.id = n.usuario_id
     WHERE n.fecha_registro >= $1 AND n.anulada = false ORDER BY n.fecha_registro DESC LIMIT 200`, [desde]);

  const { rows: inv } = await pool.query(
    `SELECT COUNT(*) FILTER (WHERE fecha_caducidad <= CURRENT_DATE) AS vencidos,
            COUNT(*) FILTER (WHERE fecha_caducidad > CURRENT_DATE AND fecha_caducidad <= CURRENT_DATE + 30) AS por_vencer,
            COUNT(*) FILTER (WHERE cantidad_disponible <= COALESCE(stock_minimo, 10)) AS bajo_stock
     FROM medicamentos WHERE activo = true`);
  const { rows: mov } = await pool.query(
    `SELECT nombre, apellido, habitacion, fecha_ingreso, fecha_egreso, activo FROM pacientes WHERE fecha_ingreso >= $1 OR fecha_egreso >= $1`, [desde]);

  return {
    desde, hasta, turnoSugerido: turnoActual(), ultimaEntrega: ult[0]?.fecha_entrega ?? null,
    residentes: { total: residentes.length, estables: residentes.length - crit.length - obs.length, observacion: obs.length, criticos: crit.length },
    criticos: crit.map(mapR), observacion: obs.map(mapR),
    alergias: residentes.filter((r) => r.alergias && !/^ning/i.test(r.alergias)).length,
    medicacion, signosAlterados,
    notas: { total: notas.length, recientes: notas.slice(0, 8).map((n) => ({ id: n.id, residente: `${n.nombre} ${n.apellido}`, tipo: n.tipo_nota, resumen: (n.contenido || '').slice(0, 140), autor: n.autor, hora: hhmm(n.fecha_registro) })) },
    inventario: { vencidos: inv[0].vencidos, porVencer: inv[0].por_vencer, bajoStock: inv[0].bajo_stock },
    movimientos: { ingresos: mov.filter((m) => m.fecha_ingreso >= desde).length, egresos: mov.filter((m) => !m.activo && m.fecha_egreso >= desde).length },
  };
}

/** Texto plano del resumen (para las columnas de texto y para PDF). */
export function resumenATexto(r) {
  const l = [];
  l.push(`Residentes: ${r.residentes.total} (${r.residentes.criticos} críticos, ${r.residentes.observacion} en observación).`);
  if (r.criticos.length) l.push(`Críticos: ${r.criticos.map((c) => `${c.nombre} (hab. ${c.habitacion ?? '—'})`).join('; ')}.`);
  if (r.medicacion.atrasadas.length) l.push(`Dosis atrasadas: ${r.medicacion.atrasadas.map((m) => `${m.residente} – ${m.medicamento} ${m.hora}`).join('; ')}.`);
  if (r.medicacion.omitidas.length) l.push(`Dosis omitidas/rechazadas: ${r.medicacion.omitidas.map((m) => `${m.residente} – ${m.medicamento}`).join('; ')}.`);
  if (r.signosAlterados.length) l.push(`Signos alterados: ${r.signosAlterados.map((s) => `${s.residente} (${s.hallazgos.join(', ')})`).join('; ')}.`);
  return l.join('\n');
}
