import pool from '../config/database.js';
import { evaluarSignos } from './rangos.js';

const SEV = { critica: 0, alta: 1, media: 2, info: 3 };

/**
 * Construye las alertas vigentes del hogar (se calculan en vivo, sin duplicados).
 * Cada alerta tiene una `clave` estable para poder marcarla como leída por usuario.
 */
export async function construirNotificaciones(usuario) {
  const items = [];

  const { rows: meds } = await pool.query(
    `SELECT id, nombre, cantidad_disponible, COALESCE(stock_minimo, 10) AS stock_minimo, fecha_caducidad,
            (fecha_caducidad - CURRENT_DATE) AS dias
     FROM medicamentos WHERE activo = true
       AND (fecha_caducidad <= CURRENT_DATE + 30 OR cantidad_disponible <= COALESCE(stock_minimo, 10))`
  );
  for (const m of meds) {
    if (m.dias <= 0) {
      items.push({ clave: `med-vencido-${m.id}-${m.fecha_caducidad}`, tipo: 'inventario', severidad: 'critica', titulo: `${m.nombre} vencido`, detalle: `Caducó el ${m.fecha_caducidad}. Retíralo del uso.`, ruta: { vista: 'inventario', id: m.id }, fecha: null });
    } else if (m.dias <= 30) {
      items.push({ clave: `med-porvencer-${m.id}-${m.fecha_caducidad}`, tipo: 'inventario', severidad: 'media', titulo: `${m.nombre} vence en ${m.dias} día${m.dias === 1 ? '' : 's'}`, detalle: `Fecha de caducidad: ${m.fecha_caducidad}.`, ruta: { vista: 'inventario', id: m.id }, fecha: null });
    }
    if (m.cantidad_disponible <= m.stock_minimo) {
      items.push({ clave: `med-stock-${m.id}`, tipo: 'inventario', severidad: m.cantidad_disponible === 0 ? 'alta' : 'media', titulo: m.cantidad_disponible === 0 ? `${m.nombre} sin existencias` : `Stock bajo de ${m.nombre}`, detalle: `Quedan ${m.cantidad_disponible} unidades (mínimo ${m.stock_minimo}).`, ruta: { vista: 'inventario', id: m.id }, fecha: null });
    }
  }

  const { rows: criticos } = await pool.query(
    `SELECT id, nombre, apellido, habitacion, estado_motivo, fecha_ultimo_estado FROM pacientes
     WHERE activo = true AND estado_calculado = 'Crítico'`
  );
  for (const p of criticos) {
    items.push({ clave: `critico-${p.id}-${p.fecha_ultimo_estado ?? ''}`, tipo: 'residente', severidad: 'critica', titulo: `${p.nombre} ${p.apellido} en estado crítico`, detalle: p.estado_motivo || `Habitación ${p.habitacion ?? '—'}`, ruta: { vista: 'ficha', pacienteId: p.id }, fecha: p.fecha_ultimo_estado });
  }

  const { rows: atrasadas } = await pool.query(
    `SELECT a.id, a.horario_programado, p.id AS pid, p.nombre, p.apellido, m.nombre AS medicamento
     FROM administraciones_medicamentos a
     JOIN pacientes p ON p.id = a.paciente_id AND p.activo
     JOIN medicamentos m ON m.id = a.medicamento_id
     WHERE a.estado = 'programada' AND a.horario_programado < NOW() - INTERVAL '60 minutes'
       AND a.horario_programado >= CURRENT_DATE - 1
     ORDER BY a.horario_programado LIMIT 30`
  );
  for (const a of atrasadas) {
    items.push({ clave: `atrasada-${a.id}`, tipo: 'medicacion', severidad: 'alta', titulo: `Dosis atrasada: ${a.medicamento}`, detalle: `${a.nombre} ${a.apellido} · programada ${String(a.horario_programado).slice(11, 16)}`, ruta: { vista: 'medicamentos' }, fecha: a.horario_programado });
  }

  const { rows: vitales } = await pool.query(
    `SELECT DISTINCT ON (sv.paciente_id) sv.*, p.nombre, p.apellido
     FROM signos_vitales sv JOIN pacientes p ON p.id = sv.paciente_id AND p.activo
     WHERE sv.fecha_registro >= NOW() - INTERVAL '24 hours'
     ORDER BY sv.paciente_id, sv.fecha_registro DESC`
  );
  for (const v of vitales) {
    const ev = evaluarSignos(v);
    if (ev.nivel > 0) {
      items.push({ clave: `vital-${v.id}`, tipo: 'signos', severidad: ev.nivel === 2 ? 'alta' : 'media', titulo: `Signos alterados: ${v.nombre} ${v.apellido}`, detalle: ev.hallazgos.map((h) => h.texto).join(' · '), ruta: { vista: 'ficha', pacienteId: v.paciente_id, tab: 'signos' }, fecha: v.fecha_registro });
    }
  }

  const { rows: relevos } = await pool.query(
    `SELECT e.id, e.fecha_entrega, u.nombre, u.apellido FROM entregas_turno e
     LEFT JOIN usuarios u ON u.id = e.usuario_saliente_id
     WHERE e.usuario_entrante_id = $1 AND e.confirmada = false`,
    [usuario.id]
  );
  for (const r of relevos) {
    items.push({ clave: `relevo-${r.id}`, tipo: 'turno', severidad: 'alta', titulo: 'Tienes una entrega de turno por confirmar', detalle: `De ${r.nombre ?? 'personal'} ${r.apellido ?? ''}`.trim(), ruta: { vista: 'turnos' }, fecha: r.fecha_entrega });
  }

  const { rows: leidas } = await pool.query('SELECT clave FROM notificaciones_leidas WHERE usuario_id = $1', [usuario.id]);
  const set = new Set(leidas.map((l) => l.clave));
  const lista = items
    .map((i) => ({ ...i, leida: set.has(i.clave) }))
    .sort((a, b) => Number(a.leida) - Number(b.leida) || SEV[a.severidad] - SEV[b.severidad]);
  return { total: lista.length, sinLeer: lista.filter((i) => !i.leida).length, items: lista.slice(0, 60) };
}
