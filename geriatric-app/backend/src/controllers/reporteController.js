import pool from '../config/database.js';
import { asyncHandler, bad, notFound, rangoFechas } from '../utils/http.js';
import { auditar } from '../middleware/auditMiddleware.js';
import { generarPDF, generarXLSX } from '../services/documentos.js';
import { evaluarSignos } from '../services/rangos.js';
import { calcularEstadisticas } from './estadisticasController.js';

const fmt = (ts) => (ts ? `${String(ts).slice(8, 10)}/${String(ts).slice(5, 7)}/${String(ts).slice(0, 4)} ${String(ts).slice(11, 16)}`.trim() : '');
const fmtF = (d) => (d ? `${String(d).slice(8, 10)}/${String(d).slice(5, 7)}/${String(d).slice(0, 4)}` : '');
const ahora = () => new Date().toLocaleString('es-CO');
const edad = (f) => {
  if (!f) return '';
  const n = new Date(f);
  const h = new Date();
  let e = h.getFullYear() - n.getFullYear();
  if (h.getMonth() < n.getMonth() || (h.getMonth() === n.getMonth() && h.getDate() < n.getDate())) e--;
  return e;
};
const q = (sql, v = []) => pool.query(sql, v).then((r) => r.rows);
const ETIQ_ESTADO = { programada: 'Pendiente', administrada: 'Administrada', omitida: 'Omitida', rechazada: 'Rechazada', cancelada: 'Cancelada' };
const ETIQ_INV = { ok: 'Disponible', stock_bajo: 'Stock bajo', por_vencer: 'Por vencer', vencido: 'Vencido', agotado: 'Agotado' };

const CONSTRUCTORES = {
  async residentes() {
    const f = await q(`SELECT * FROM pacientes WHERE activo = true ORDER BY habitacion NULLS LAST, nombre`);
    return {
      titulo: 'Listado de residentes', subtitulo: `Residentes activos: ${f.length} · Generado ${ahora()}`,
      secciones: [{ titulo: 'Residentes', columnas: [
        { titulo: 'Hab.', clave: 'habitacion', ancho: 0.7 }, { titulo: 'Residente', clave: 'nombre', ancho: 2.2 }, { titulo: 'Documento', clave: 'documento', ancho: 1.2 },
        { titulo: 'Edad', clave: 'edad', ancho: 0.6 }, { titulo: 'Estado', clave: 'estado', ancho: 1.2 }, { titulo: 'Alergias', clave: 'alergias', ancho: 1.6 },
        { titulo: 'Enfermedades crónicas', clave: 'cronicas', ancho: 2.4 }, { titulo: 'Contacto de emergencia', clave: 'contacto', ancho: 2 }],
      filas: f.map((p) => ({ habitacion: p.habitacion, nombre: `${p.nombre} ${p.apellido}`, documento: p.documento, edad: edad(p.fecha_nacimiento), estado: p.estado_calculado, alergias: p.alergias, cronicas: p.enfermedades_cronicas, contacto: [p.contacto_emergencia, p.telefono_emergencia].filter(Boolean).join(' · ') })) }],
    };
  },

  async inventario() {
    const f = await q(`SELECT m.*, (m.fecha_caducidad - CURRENT_DATE) AS dias,
      CASE WHEN m.fecha_caducidad <= CURRENT_DATE THEN 'vencido' WHEN m.cantidad_disponible = 0 THEN 'agotado' WHEN m.fecha_caducidad <= CURRENT_DATE + 30 THEN 'por_vencer'
           WHEN m.cantidad_disponible <= COALESCE(m.stock_minimo, 10) THEN 'stock_bajo' ELSE 'ok' END AS estado
      FROM medicamentos m WHERE activo = true ORDER BY nombre`);
    return {
      titulo: 'Inventario de medicamentos', subtitulo: `${f.length} medicamentos · Generado ${ahora()}`,
      secciones: [
        { titulo: 'Resumen', kv: [['Total de medicamentos', f.length], ['Vencidos', f.filter((m) => m.estado === 'vencido').length], ['Por vencer (30 días)', f.filter((m) => m.estado === 'por_vencer').length], ['Stock bajo o agotado', f.filter((m) => ['stock_bajo', 'agotado'].includes(m.estado)).length]] },
        { titulo: 'Medicamentos', columnas: [{ titulo: 'Medicamento', clave: 'nombre', ancho: 2.4 }, { titulo: 'Presentación', clave: 'presentacion', ancho: 1.3 }, { titulo: 'Stock', clave: 'stock', ancho: 0.8 }, { titulo: 'Mínimo', clave: 'minimo', ancho: 0.8 }, { titulo: 'Caducidad', clave: 'caducidad', ancho: 1.1 }, { titulo: 'Lote', clave: 'lote', ancho: 1 }, { titulo: 'Proveedor', clave: 'proveedor', ancho: 1.6 }, { titulo: 'Estado', clave: 'estado', ancho: 1.1 }],
          filas: f.map((m) => ({ nombre: m.nombre, presentacion: m.presentacion, stock: m.cantidad_disponible, minimo: m.stock_minimo ?? 10, caducidad: fmtF(m.fecha_caducidad), lote: m.lote, proveedor: m.proveedor, estado: ETIQ_INV[m.estado] })) }],
    };
  },

  async notas(query) {
    const { desde, hasta } = rangoFechas(query, 30);
    const v = [desde, hasta];
    let extra = '';
    if (query.paciente_id) { v.push(Number(query.paciente_id)); extra += ` AND n.paciente_id = $${v.length}`; }
    if (query.tipo_nota) { v.push(query.tipo_nota); extra += ` AND n.tipo_nota = $${v.length}`; }
    const f = await q(`SELECT n.*, p.nombre, p.apellido, p.habitacion, u.nombre AS un, u.apellido AS ua FROM notas_enfermeria n JOIN pacientes p ON p.id = n.paciente_id JOIN usuarios u ON u.id = n.usuario_id
      WHERE n.fecha_registro::date BETWEEN $1 AND $2 AND n.anulada = false ${extra} ORDER BY n.fecha_registro DESC`, v);
    return {
      titulo: 'Notas de enfermería', subtitulo: `Del ${fmtF(desde)} al ${fmtF(hasta)} · ${f.length} notas · Generado ${ahora()}`,
      secciones: [{ titulo: 'Notas', columnas: [{ titulo: 'Fecha', clave: 'fecha', ancho: 1.3 }, { titulo: 'Residente', clave: 'residente', ancho: 1.8 }, { titulo: 'Hab.', clave: 'hab', ancho: 0.6 }, { titulo: 'Tipo', clave: 'tipo', ancho: 1 }, { titulo: 'Contenido', clave: 'contenido', ancho: 4 }, { titulo: 'Autor', clave: 'autor', ancho: 1.5 }],
        filas: f.map((n) => ({ fecha: fmt(n.fecha_registro), residente: `${n.nombre} ${n.apellido}`, hab: n.habitacion, tipo: n.tipo_nota, contenido: [n.contenido, n.observaciones && `Obs: ${n.observaciones}`].filter(Boolean).join(' · '), autor: `${n.un} ${n.ua ?? ''}`.trim() })) }],
    };
  },

  async signos(query) {
    const { desde, hasta } = rangoFechas(query, 30);
    const v = [desde, hasta];
    let extra = '';
    if (query.paciente_id) { v.push(Number(query.paciente_id)); extra = ` AND sv.paciente_id = $${v.length}`; }
    const f = await q(`SELECT sv.*, p.nombre, p.apellido, p.habitacion, u.nombre AS un FROM signos_vitales sv JOIN pacientes p ON p.id = sv.paciente_id JOIN usuarios u ON u.id = sv.usuario_id
      WHERE sv.fecha_registro::date BETWEEN $1 AND $2 ${extra} ORDER BY sv.fecha_registro DESC`, v);
    return {
      titulo: 'Signos vitales', subtitulo: `Del ${fmtF(desde)} al ${fmtF(hasta)} · ${f.length} registros · Generado ${ahora()}`,
      secciones: [{ titulo: 'Registros', columnas: [{ titulo: 'Fecha', clave: 'fecha', ancho: 1.3 }, { titulo: 'Residente', clave: 'residente', ancho: 1.8 }, { titulo: 'PA', clave: 'pa', ancho: 0.9 }, { titulo: 'FC', clave: 'fc', ancho: 0.6 }, { titulo: 'Temp', clave: 'temp', ancho: 0.7 }, { titulo: 'SpO2', clave: 'spo2', ancho: 0.7 }, { titulo: 'FR', clave: 'fr', ancho: 0.6 }, { titulo: 'Glucosa', clave: 'glu', ancho: 0.8 }, { titulo: 'Alertas', clave: 'alertas', ancho: 2.4 }, { titulo: 'Registró', clave: 'autor', ancho: 1 }],
        filas: f.map((s) => ({ fecha: fmt(s.fecha_registro), residente: `${s.nombre} ${s.apellido}`, pa: s.presion_sistolica ? `${s.presion_sistolica}/${s.presion_diastolica}` : '', fc: s.frecuencia_cardiaca, temp: s.temperatura, spo2: s.saturacion_oxigeno, fr: s.frecuencia_respiratoria, glu: s.glucosa, alertas: evaluarSignos(s).hallazgos.map((h) => h.texto).join(', ') || 'Normal', autor: s.un })) }],
    };
  },

  async administraciones(query) {
    const { desde, hasta } = rangoFechas(query, 7);
    const v = [desde, hasta];
    let extra = '';
    if (query.paciente_id) { v.push(Number(query.paciente_id)); extra = ` AND a.paciente_id = $${v.length}`; }
    const f = await q(`SELECT a.*, p.nombre, p.apellido, p.habitacion, m.nombre AS med, u.nombre AS un FROM administraciones_medicamentos a JOIN pacientes p ON p.id = a.paciente_id JOIN medicamentos m ON m.id = a.medicamento_id LEFT JOIN usuarios u ON u.id = a.usuario_id
      WHERE a.horario_programado::date BETWEEN $1 AND $2 AND a.estado <> 'cancelada' ${extra} ORDER BY a.horario_programado DESC`, v);
    return {
      titulo: 'Administración de medicamentos', subtitulo: `Del ${fmtF(desde)} al ${fmtF(hasta)} · ${f.length} dosis · Generado ${ahora()}`,
      secciones: [{ titulo: 'Dosis', columnas: [{ titulo: 'Programada', clave: 'prog', ancho: 1.3 }, { titulo: 'Residente', clave: 'residente', ancho: 1.8 }, { titulo: 'Medicamento', clave: 'med', ancho: 2 }, { titulo: 'Dosis', clave: 'dosis', ancho: 1 }, { titulo: 'Estado', clave: 'estado', ancho: 1 }, { titulo: 'Administrada', clave: 'admin', ancho: 1.3 }, { titulo: 'Por', clave: 'por', ancho: 1 }, { titulo: 'Observaciones / motivo', clave: 'obs', ancho: 2 }],
        filas: f.map((a) => ({ prog: fmt(a.horario_programado), residente: `${a.nombre} ${a.apellido}`, med: a.med, dosis: a.dosis_administrada, estado: ETIQ_ESTADO[a.estado], admin: fmt(a.horario_administracion), por: a.un, obs: a.motivo_omision || a.observaciones })) }],
    };
  },

  async estadisticas(query) {
    const e = await calcularEstadisticas(query);
    return {
      titulo: 'Estadísticas del hogar', subtitulo: `Del ${fmtF(e.rango.desde)} al ${fmtF(e.rango.hasta)} (${e.rango.dias} días) · Generado ${ahora()}`,
      secciones: [
        { titulo: 'Indicadores', kv: [['Notas de enfermería', e.kpis.notas], ['Registros de signos vitales', e.kpis.signos], ['Dosis administradas', e.kpis.administradas], ['Dosis omitidas o rechazadas', e.kpis.omitidas], ['Cumplimiento de medicación', e.kpis.cumplimiento === null ? 'Sin dosis' : `${e.kpis.cumplimiento}%`], ['Registros con signos alterados', e.kpis.alertasVitales], ['Ingresos / egresos', `${e.kpis.ingresos} / ${e.kpis.egresos}`]] },
        { titulo: 'Actividad por día', columnas: [{ titulo: 'Fecha', clave: 'fecha' }, { titulo: 'Notas', clave: 'notas' }, { titulo: 'Signos vitales', clave: 'signos' }, { titulo: 'Dosis administradas', clave: 'administradas' }, { titulo: 'Dosis omitidas', clave: 'omitidas' }], filas: e.porDia.map((d) => ({ ...d, fecha: fmtF(d.fecha) })) },
        { titulo: 'Notas por tipo', columnas: [{ titulo: 'Tipo', clave: 'tipo' }, { titulo: 'Total', clave: 'total' }], filas: e.notasPorTipo },
        { titulo: 'Residentes por estado', columnas: [{ titulo: 'Estado', clave: 'estado' }, { titulo: 'Total', clave: 'total' }], filas: e.estadoResidentes },
        { titulo: 'Residentes con más registros', columnas: [{ titulo: 'Residente', clave: 'nombre', ancho: 2 }, { titulo: 'Hab.', clave: 'habitacion' }, { titulo: 'Registros', clave: 'registros' }], filas: e.topResidentes },
      ],
    };
  },

  async turno(query) {
    const { rows } = await pool.query(
      `SELECT e.*, us.nombre AS sn, us.apellido AS sa, ue.nombre AS en, ue.apellido AS ea FROM entregas_turno e
       LEFT JOIN usuarios us ON us.id = e.usuario_saliente_id LEFT JOIN usuarios ue ON ue.id = e.usuario_entrante_id WHERE e.id = $1`, [Number(query.id)]);
    const e = rows[0];
    if (!e) throw notFound('Entrega de turno no encontrada');
    const r = e.resumen || {};
    return {
      titulo: `Entrega de turno · ${e.turno ?? ''}`, subtitulo: `${fmt(e.fecha_entrega)} · Entrega ${e.sn ?? ''} ${e.sa ?? ''} → Recibe ${e.en ?? ''} ${e.ea ?? ''}${e.confirmada ? ' (confirmado)' : ' (pendiente de confirmar)'}`,
      secciones: [
        { titulo: 'Resumen', kv: [['Residentes activos', r.residentes?.total], ['Críticos', r.residentes?.criticos], ['En observación', r.residentes?.observacion], ['Dosis administradas', r.medicacion?.administradas], ['Inventario: vencidos / por vencer / stock bajo', r.inventario ? `${r.inventario.vencidos} / ${r.inventario.porVencer} / ${r.inventario.bajoStock}` : '']] },
        ...(e.notas_relevo ? [{ titulo: 'Notas del relevo', texto: e.notas_relevo }] : []),
        { titulo: 'Residentes críticos', columnas: [{ titulo: 'Residente', clave: 'nombre', ancho: 2 }, { titulo: 'Hab.', clave: 'habitacion', ancho: 0.6 }, { titulo: 'Motivo', clave: 'motivo', ancho: 4 }], filas: r.criticos || [] },
        { titulo: 'En observación', columnas: [{ titulo: 'Residente', clave: 'nombre', ancho: 2 }, { titulo: 'Hab.', clave: 'habitacion', ancho: 0.6 }, { titulo: 'Motivo', clave: 'motivo', ancho: 4 }], filas: r.observacion || [] },
        { titulo: 'Dosis atrasadas', columnas: [{ titulo: 'Residente', clave: 'residente', ancho: 2 }, { titulo: 'Medicamento', clave: 'medicamento', ancho: 2 }, { titulo: 'Hora', clave: 'hora' }], filas: r.medicacion?.atrasadas || [] },
        { titulo: 'Dosis omitidas o rechazadas', columnas: [{ titulo: 'Residente', clave: 'residente', ancho: 2 }, { titulo: 'Medicamento', clave: 'medicamento', ancho: 2 }, { titulo: 'Hora', clave: 'hora' }, { titulo: 'Motivo', clave: 'motivo', ancho: 3 }], filas: r.medicacion?.omitidas || [] },
        { titulo: 'Próximas dosis', columnas: [{ titulo: 'Residente', clave: 'residente', ancho: 2 }, { titulo: 'Medicamento', clave: 'medicamento', ancho: 2 }, { titulo: 'Hora', clave: 'hora' }], filas: r.medicacion?.proximas || [] },
        { titulo: 'Signos vitales alterados', columnas: [{ titulo: 'Residente', clave: 'residente', ancho: 2 }, { titulo: 'Hora', clave: 'hora' }, { titulo: 'Hallazgos', clave: 'hallazgos', ancho: 4 }], filas: (r.signosAlterados || []).map((s) => ({ ...s, hallazgos: s.hallazgos.join(', ') })) },
      ],
    };
  },

  async ficha(query) {
    const id = Number(query.paciente_id);
    const [p] = await q('SELECT * FROM pacientes WHERE id = $1', [id]);
    if (!p) throw notFound('Residente no encontrado');
    const [vit, pres, notas, hist] = await Promise.all([
      q(`SELECT * FROM signos_vitales WHERE paciente_id = $1 ORDER BY fecha_registro DESC LIMIT 15`, [id]),
      q(`SELECT mp.*, m.nombre FROM medicamentos_pacientes mp JOIN medicamentos m ON m.id = mp.medicamento_id WHERE mp.paciente_id = $1 AND mp.activo ORDER BY m.nombre`, [id]),
      q(`SELECT n.*, u.nombre AS un FROM notas_enfermeria n JOIN usuarios u ON u.id = n.usuario_id WHERE n.paciente_id = $1 AND n.anulada = false ORDER BY n.fecha_registro DESC LIMIT 15`, [id]),
      q(`SELECT * FROM historial_estado_paciente WHERE paciente_id = $1 ORDER BY fecha DESC LIMIT 15`, [id]),
    ]);
    return {
      titulo: `Ficha del residente · ${p.nombre} ${p.apellido}`, subtitulo: `Generado ${ahora()}`,
      secciones: [
        { titulo: 'Datos generales', kv: [['Documento', p.documento], ['Habitación', p.habitacion], ['Edad', edad(p.fecha_nacimiento)], ['Género', p.genero], ['Fecha de ingreso', fmtF(p.fecha_ingreso)], ['Estado actual', `${p.estado_calculado}${p.estado_motivo ? ' — ' + p.estado_motivo : ''}`], ['Alergias', p.alergias || 'Ninguna conocida'], ['Enfermedades crónicas', p.enfermedades_cronicas || 'Ninguna registrada'], ['Contacto de emergencia', [p.contacto_emergencia, p.telefono_emergencia].filter(Boolean).join(' · ')]] },
        { titulo: 'Prescripciones activas', columnas: [{ titulo: 'Medicamento', clave: 'nombre', ancho: 2 }, { titulo: 'Dosis', clave: 'dosis_prescrita' }, { titulo: 'Frecuencia', clave: 'frecuencia', ancho: 1.4 }, { titulo: 'Horarios', clave: 'horarios', ancho: 1.4 }], filas: pres },
        { titulo: 'Últimos signos vitales', columnas: [{ titulo: 'Fecha', clave: 'fecha', ancho: 1.4 }, { titulo: 'PA', clave: 'pa' }, { titulo: 'FC', clave: 'fc' }, { titulo: 'Temp', clave: 't' }, { titulo: 'SpO2', clave: 's' }, { titulo: 'Glucosa', clave: 'g' }], filas: vit.map((s) => ({ fecha: fmt(s.fecha_registro), pa: s.presion_sistolica ? `${s.presion_sistolica}/${s.presion_diastolica}` : '', fc: s.frecuencia_cardiaca, t: s.temperatura, s: s.saturacion_oxigeno, g: s.glucosa })) },
        { titulo: 'Últimas notas de enfermería', columnas: [{ titulo: 'Fecha', clave: 'fecha', ancho: 1.3 }, { titulo: 'Tipo', clave: 'tipo_nota', ancho: 1 }, { titulo: 'Contenido', clave: 'contenido', ancho: 4 }, { titulo: 'Autor', clave: 'un', ancho: 1 }], filas: notas.map((n) => ({ ...n, fecha: fmt(n.fecha_registro) })) },
        { titulo: 'Historial de estado', columnas: [{ titulo: 'Fecha', clave: 'fecha', ancho: 1.3 }, { titulo: 'Cambio', clave: 'cambio', ancho: 2 }, { titulo: 'Origen', clave: 'origen' }, { titulo: 'Motivo', clave: 'motivo', ancho: 3 }], filas: hist.map((h) => ({ fecha: fmt(h.fecha), cambio: `${h.estado_anterior ?? '—'} → ${h.estado_nuevo}`, origen: h.origen, motivo: h.motivo })) },
      ],
    };
  },
};

export const ReporteController = {
  generar: asyncHandler(async (req, res) => {
    const tipo = req.params.tipo;
    const formato = req.query.formato === 'pdf' ? 'pdf' : 'xlsx';
    if (!CONSTRUCTORES[tipo]) throw bad(`Reporte desconocido: ${tipo}`);
    const doc = await CONSTRUCTORES[tipo](req.query);
    await auditar(req, { accion: 'exportar', tabla: 'reportes', despues: { tipo, formato, filtros: req.query } });
    const nombre = `nursenote-${tipo}-${new Date().toISOString().slice(0, 10)}`;
    res.setHeader('Access-Control-Expose-Headers', 'Content-Disposition');
    if (formato === 'pdf') generarPDF(res, doc, nombre);
    else await generarXLSX(res, doc, nombre);
  }),
};
