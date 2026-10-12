import pool from '../config/database.js';
import { asyncHandler, rangoFechas } from '../utils/http.js';
import { evaluarSignos } from '../services/rangos.js';

/** Estadísticas del hogar para un rango de fechas (inclusive). */
export async function calcularEstadisticas(query) {
  const { desde, hasta, dias } = rangoFechas(query, 30);
  const q = (sql, v = [desde, hasta]) => pool.query(sql, v).then((r) => r.rows);

  const [[k], porDia, notasPorTipo, estadoResidentes, adminPorEstado, topResidentes, porUsuario, vitales, [inv], [mov]] = await Promise.all([
    q(`SELECT (SELECT COUNT(*) FROM notas_enfermeria WHERE fecha_registro::date BETWEEN $1 AND $2 AND anulada = false) AS notas,
              (SELECT COUNT(*) FROM signos_vitales WHERE fecha_registro::date BETWEEN $1 AND $2) AS signos,
              (SELECT COUNT(*) FROM administraciones_medicamentos WHERE horario_programado::date BETWEEN $1 AND $2 AND estado <> 'cancelada' AND horario_programado <= NOW()) AS dosis_vencidas_o_resueltas,
              (SELECT COUNT(*) FROM administraciones_medicamentos WHERE horario_programado::date BETWEEN $1 AND $2 AND estado = 'administrada') AS administradas,
              (SELECT COUNT(*) FROM administraciones_medicamentos WHERE horario_programado::date BETWEEN $1 AND $2 AND estado IN ('omitida', 'rechazada')) AS omitidas,
              (SELECT COUNT(*) FROM pacientes WHERE activo = true) AS residentes_activos`),
    q(`SELECT d::date AS fecha,
         (SELECT COUNT(*) FROM notas_enfermeria n WHERE n.fecha_registro::date = d::date AND n.anulada = false) AS notas,
         (SELECT COUNT(*) FROM signos_vitales s WHERE s.fecha_registro::date = d::date) AS signos,
         (SELECT COUNT(*) FROM administraciones_medicamentos a WHERE a.horario_programado::date = d::date AND a.estado = 'administrada') AS administradas,
         (SELECT COUNT(*) FROM administraciones_medicamentos a WHERE a.horario_programado::date = d::date AND a.estado IN ('omitida', 'rechazada')) AS omitidas
       FROM generate_series($1::date, $2::date, interval '1 day') d ORDER BY d`),
    q(`SELECT tipo_nota AS tipo, COUNT(*) AS total FROM notas_enfermeria WHERE fecha_registro::date BETWEEN $1 AND $2 AND anulada = false GROUP BY 1 ORDER BY 2 DESC`),
    q(`SELECT estado_calculado AS estado, COUNT(*) AS total FROM pacientes WHERE activo = true GROUP BY 1`, []),
    q(`SELECT estado, COUNT(*) AS total FROM administraciones_medicamentos WHERE horario_programado::date BETWEEN $1 AND $2 AND estado <> 'cancelada' AND horario_programado <= NOW() GROUP BY 1`),
    q(`SELECT p.id, p.nombre || ' ' || p.apellido AS nombre, p.habitacion,
         (SELECT COUNT(*) FROM notas_enfermeria n WHERE n.paciente_id = p.id AND n.fecha_registro::date BETWEEN $1 AND $2 AND n.anulada = false)
         + (SELECT COUNT(*) FROM signos_vitales s WHERE s.paciente_id = p.id AND s.fecha_registro::date BETWEEN $1 AND $2) AS registros
       FROM pacientes p WHERE p.activo = true ORDER BY registros DESC, p.nombre LIMIT 8`),
    q(`SELECT u.nombre || ' ' || COALESCE(u.apellido, '') AS nombre, COUNT(*) AS total FROM (
         SELECT usuario_id FROM notas_enfermeria WHERE fecha_registro::date BETWEEN $1 AND $2 AND anulada = false
         UNION ALL SELECT usuario_id FROM signos_vitales WHERE fecha_registro::date BETWEEN $1 AND $2
         UNION ALL SELECT usuario_id FROM administraciones_medicamentos WHERE horario_administracion::date BETWEEN $1 AND $2 AND estado = 'administrada') r
       JOIN usuarios u ON u.id = r.usuario_id GROUP BY 1 ORDER BY 2 DESC LIMIT 8`),
    q(`SELECT sv.* FROM signos_vitales sv JOIN pacientes p ON p.id = sv.paciente_id WHERE sv.fecha_registro::date BETWEEN $1 AND $2`),
    q(`SELECT COUNT(*) FILTER (WHERE fecha_caducidad <= CURRENT_DATE) AS vencidos,
              COUNT(*) FILTER (WHERE fecha_caducidad > CURRENT_DATE AND fecha_caducidad <= CURRENT_DATE + 30) AS por_vencer,
              COUNT(*) FILTER (WHERE fecha_caducidad > CURRENT_DATE + 30 AND cantidad_disponible <= COALESCE(stock_minimo, 10)) AS bajo_stock,
              COUNT(*) FILTER (WHERE fecha_caducidad > CURRENT_DATE + 30 AND cantidad_disponible > COALESCE(stock_minimo, 10)) AS ok
       FROM medicamentos WHERE activo = true`, []),
    q(`SELECT COUNT(*) FILTER (WHERE fecha_ingreso::date BETWEEN $1 AND $2) AS ingresos, COUNT(*) FILTER (WHERE fecha_egreso::date BETWEEN $1 AND $2) AS egresos FROM pacientes`),
  ]);

  const evals = vitales.map((v) => evaluarSignos(v));
  const alertasPorParametro = {};
  evals.forEach((e) => e.hallazgos.forEach((h) => { alertasPorParametro[h.etiqueta] = (alertasPorParametro[h.etiqueta] || 0) + 1; }));
  const resueltas = k.administradas + k.omitidas;

  return {
    rango: { desde, hasta, dias },
    kpis: {
      notas: k.notas, signos: k.signos, administradas: k.administradas, omitidas: k.omitidas,
      cumplimiento: k.dosis_vencidas_o_resueltas ? Math.round((k.administradas / k.dosis_vencidas_o_resueltas) * 100) : null,
      residentesActivos: k.residentes_activos, ingresos: mov.ingresos, egresos: mov.egresos,
      alertasVitales: evals.filter((e) => e.nivel > 0).length, alertasCriticas: evals.filter((e) => e.nivel === 2).length, resueltas,
    },
    porDia, notasPorTipo, estadoResidentes, administracionesPorEstado: adminPorEstado, topResidentes, porUsuario,
    alertasPorParametro: Object.entries(alertasPorParametro).map(([parametro, total]) => ({ parametro, total })).sort((a, b) => b.total - a.total),
    inventario: inv,
  };
}

export const EstadisticasController = {
  get: asyncHandler(async (req, res) => res.json(await calcularEstadisticas(req.query))),
};
