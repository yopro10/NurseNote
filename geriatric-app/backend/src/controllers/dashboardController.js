import pool from '../config/database.js';
import { asyncHandler } from '../utils/http.js';
import { evaluarSignos } from '../services/rangos.js';
import { generarProgramadas } from '../services/programacion.js';

const hoy = () => new Date().toLocaleDateString('sv-SE');

export const DashboardController = {
  /** Todo el panel principal sale de aquí, con datos reales de la BD. */
  resumen: asyncHandler(async (_req, res) => {
    await generarProgramadas({ desde: hoy(), hasta: hoy() });
    const q = (sql, v = []) => pool.query(sql, v).then((r) => r.rows);

    const [[pac], [reg], [inv], [dosis], prioritarios, proximas, serie, vitales, [turno]] = await Promise.all([
      q(`SELECT COUNT(*) AS total, COUNT(*) FILTER (WHERE estado_calculado = 'Crítico') AS criticos,
                COUNT(*) FILTER (WHERE estado_calculado = 'En Observación') AS observacion,
                COUNT(*) FILTER (WHERE estado_calculado = 'Estable') AS estables FROM pacientes WHERE activo = true`),
      q(`SELECT (SELECT COUNT(*) FROM notas_enfermeria WHERE fecha_registro::date = CURRENT_DATE AND anulada = false) AS notas,
                (SELECT COUNT(*) FROM signos_vitales WHERE fecha_registro::date = CURRENT_DATE) AS signos,
                (SELECT COUNT(*) FROM administraciones_medicamentos WHERE horario_administracion::date = CURRENT_DATE AND estado = 'administrada') AS administraciones`),
      q(`SELECT COUNT(*) FILTER (WHERE fecha_caducidad <= CURRENT_DATE) AS vencidos,
                COUNT(*) FILTER (WHERE fecha_caducidad > CURRENT_DATE AND fecha_caducidad <= CURRENT_DATE + 30) AS por_vencer,
                COUNT(*) FILTER (WHERE cantidad_disponible <= COALESCE(stock_minimo, 10)) AS bajo_stock,
                COUNT(*) AS total FROM medicamentos WHERE activo = true`),
      q(`SELECT COUNT(*) FILTER (WHERE estado = 'administrada') AS administradas,
                COUNT(*) FILTER (WHERE estado = 'programada' AND horario_programado >= NOW() - INTERVAL '60 minutes') AS pendientes,
                COUNT(*) FILTER (WHERE estado = 'programada' AND horario_programado < NOW() - INTERVAL '60 minutes') AS atrasadas,
                COUNT(*) FILTER (WHERE estado IN ('omitida', 'rechazada')) AS omitidas,
                COUNT(*) FILTER (WHERE estado <> 'cancelada') AS total
         FROM administraciones_medicamentos a JOIN pacientes p ON p.id = a.paciente_id AND p.activo WHERE horario_programado::date = CURRENT_DATE`),
      q(`SELECT id, nombre, apellido, habitacion, estado_calculado AS estado, estado_motivo AS motivo, fecha_ultimo_estado
         FROM pacientes WHERE activo = true AND estado_calculado <> 'Estable'
         ORDER BY (estado_calculado = 'Crítico') DESC, fecha_ultimo_estado DESC NULLS LAST LIMIT 6`),
      q(`SELECT a.id, a.horario_programado, p.id AS paciente_id, p.nombre, p.apellido, p.habitacion, m.nombre AS medicamento, mp.dosis_prescrita,
                (a.horario_programado < NOW() - INTERVAL '60 minutes') AS atrasada
         FROM administraciones_medicamentos a JOIN pacientes p ON p.id = a.paciente_id AND p.activo JOIN medicamentos m ON m.id = a.medicamento_id
         LEFT JOIN medicamentos_pacientes mp ON mp.id = a.medicamento_paciente_id
         WHERE a.estado = 'programada' AND a.horario_programado::date = CURRENT_DATE ORDER BY a.horario_programado LIMIT 8`),
      q(`SELECT d::date AS fecha,
           (SELECT COUNT(*) FROM notas_enfermeria n WHERE n.fecha_registro::date = d::date AND n.anulada = false) AS notas,
           (SELECT COUNT(*) FROM signos_vitales s WHERE s.fecha_registro::date = d::date) AS signos,
           (SELECT COUNT(*) FROM administraciones_medicamentos a WHERE a.horario_administracion::date = d::date AND a.estado = 'administrada') AS administraciones
         FROM generate_series(CURRENT_DATE - 6, CURRENT_DATE, interval '1 day') d ORDER BY d`),
      q(`SELECT DISTINCT ON (sv.paciente_id) sv.*, p.nombre, p.apellido, p.habitacion FROM signos_vitales sv
         JOIN pacientes p ON p.id = sv.paciente_id AND p.activo WHERE sv.fecha_registro >= NOW() - INTERVAL '24 hours'
         ORDER BY sv.paciente_id, sv.fecha_registro DESC`),
      q(`SELECT e.id, e.fecha_entrega, e.turno, e.confirmada, us.nombre AS saliente, ue.nombre AS entrante
         FROM entregas_turno e LEFT JOIN usuarios us ON us.id = e.usuario_saliente_id LEFT JOIN usuarios ue ON ue.id = e.usuario_entrante_id
         ORDER BY e.fecha_entrega DESC LIMIT 1`),
    ]);

    const alertasVitales = vitales
      .map((v) => ({ ...evaluarSignos(v), residente: `${v.nombre} ${v.apellido}`, habitacion: v.habitacion, paciente_id: v.paciente_id, fecha: v.fecha_registro }))
      .filter((v) => v.nivel > 0).sort((a, b) => b.nivel - a.nivel).slice(0, 5);

    const resueltas = dosis.administradas + dosis.omitidas;
    res.json({
      pacientes: pac,
      registrosHoy: { ...reg, total: reg.notas + reg.signos + reg.administraciones },
      inventario: inv,
      medicacion: { ...dosis, cumplimiento: dosis.total ? Math.round((dosis.administradas / dosis.total) * 100) : null, resueltas },
      prioritarios, proximasDosis: proximas, ultimos7dias: serie, alertasVitales,
      ultimoTurno: turno ?? null,
    });
  }),
};
