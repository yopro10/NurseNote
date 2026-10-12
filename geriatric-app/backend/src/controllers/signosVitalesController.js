import { SignosVitalesModel as M } from '../models/signosVitalesModel.js';
import pool from '../config/database.js';
import { asyncHandler, bad, forbidden, notFound, vacio } from '../utils/http.js';
import { auditar } from '../middleware/auditMiddleware.js';
import { esGestorRol } from '../middleware/authMiddleware.js';
import { evaluarSignos, LIMITES } from '../services/rangos.js';
import { recalcularEstado } from '../services/estadoPaciente.js';

const ENTEROS = ['presion_sistolica', 'presion_diastolica', 'frecuencia_cardiaca', 'saturacion_oxigeno', 'frecuencia_respiratoria', 'glucosa', 'altura'];

function limpiar(d, { crear }) {
  const out = {};
  for (const k of [...Object.keys(LIMITES), 'observaciones']) {
    if (d[k] === undefined) continue;
    if (k === 'observaciones') { out[k] = vacio(d[k]) ? null : String(d[k]).trim().slice(0, 1000); continue; }
    if (vacio(d[k])) { out[k] = null; continue; }
    const n = Number(d[k]);
    if (Number.isNaN(n)) throw bad(`${k.replace(/_/g, ' ')} debe ser numérico`);
    if (ENTEROS.includes(k) && !Number.isInteger(n)) throw bad(`${k.replace(/_/g, ' ')} debe ser un número entero`);
    const [min, max] = LIMITES[k];
    if (n < min || n > max) throw bad(`${k.replace(/_/g, ' ')} fuera del rango posible (${min}–${max}). Revisa el valor digitado.`);
    out[k] = n;
  }
  const medidas = Object.keys(LIMITES).filter((k) => out[k] !== null && out[k] !== undefined);
  if (crear && !medidas.some((k) => !['peso', 'altura'].includes(k))) throw bad('Registra al menos un signo vital (presión, pulso, temperatura, saturación, respiración o glucosa)');
  if ((out.presion_sistolica ?? null) !== null && (out.presion_diastolica ?? null) !== null && out.presion_sistolica <= out.presion_diastolica) {
    throw bad('La presión sistólica debe ser mayor que la diastólica');
  }
  if (crear && ((out.presion_sistolica ?? null) === null) !== ((out.presion_diastolica ?? null) === null)) throw bad('Registra presión sistólica y diastólica juntas');
  return out;
}

const puedeModificar = (sv, user) => esGestorRol(user.rol) || (sv.usuario_id === user.id && Date.now() - Date.parse(sv.fecha_registro) < 24 * 3600 * 1000);

export const SignosVitalesController = {
  create: asyncHandler(async (req, res) => {
    const pid = Number(req.body?.paciente_id);
    if (!Number.isInteger(pid)) throw bad('Selecciona un residente');
    const { rows } = await pool.query('SELECT id, activo FROM pacientes WHERE id = $1', [pid]);
    if (!rows[0]) throw notFound('Residente no encontrado');
    if (!rows[0].activo) throw bad('No se pueden registrar signos de un residente egresado');
    const datos = limpiar(req.body, { crear: true });
    const registro = await M.create(pid, req.user.id, datos);
    const evaluacion = evaluarSignos(registro);
    const estado = await recalcularEstado(pid, pool, req.user.id);
    await auditar(req, { accion: 'crear', tabla: 'signos_vitales', registroId: registro.id, despues: { paciente_id: pid } });
    res.status(201).json({ message: 'Signos vitales registrados', registro, alertas: evaluacion.hallazgos, nivel: evaluacion.nivel, estado });
  }),

  resumen: asyncHandler(async (_req, res) => {
    const filas = await M.ultimosPorResidente();
    res.json(filas.map((f) => ({ ...f, evaluacion: f.fecha_registro ? evaluarSignos(f) : null })));
  }),

  getById: asyncHandler(async (req, res) => {
    const r = await M.findById(req.params.id);
    if (!r) throw notFound('Registro no encontrado');
    res.json({ ...r, evaluacion: evaluarSignos(r) });
  }),

  getByPaciente: asyncHandler(async (req, res) => {
    const filas = await M.getByPaciente(req.params.pacienteId, req.query);
    res.json(filas.map((f) => ({ ...f, evaluacion: evaluarSignos(f) })));
  }),

  getUltimos: asyncHandler(async (req, res) => {
    const filas = await M.getByPaciente(req.params.pacienteId, { limit: Math.min(Number(req.query.limite) || 5, 50) });
    res.json(filas.map((f) => ({ ...f, evaluacion: evaluarSignos(f) })));
  }),

  getAlertas: asyncHandler(async (req, res) => {
    const filas = await M.getByPaciente(req.params.pacienteId, { limit: 60 });
    res.json(filas.map((f) => ({ ...f, evaluacion: evaluarSignos(f) })).filter((f) => f.evaluacion.nivel > 0).slice(0, 20));
  }),

  getTendencias: asyncHandler(async (req, res) => {
    const dias = Math.min(Math.max(Number(req.query.dias) || 30, 1), 365);
    res.json(await M.tendencias(req.params.pacienteId, dias));
  }),

  update: asyncHandler(async (req, res) => {
    const antes = await M.findById(req.params.id);
    if (!antes) throw notFound('Registro no encontrado');
    if (!puedeModificar(antes, req.user)) throw forbidden('Solo el autor (primeras 24 h) o un jefe/administrador puede corregir este registro');
    const merged = { ...antes, ...limpiar(req.body, { crear: false }) };
    limpiar(merged, { crear: true }); // valida coherencia del conjunto
    const registro = await M.update(antes.id, limpiar(req.body, { crear: false }));
    const estado = await recalcularEstado(antes.paciente_id, pool, req.user.id);
    await auditar(req, { accion: 'actualizar', tabla: 'signos_vitales', registroId: antes.id, antes, despues: req.body });
    res.json({ message: 'Registro actualizado', registro, estado });
  }),

  delete: asyncHandler(async (req, res) => {
    const antes = await M.findById(req.params.id);
    if (!antes) throw notFound('Registro no encontrado');
    if (!puedeModificar(antes, req.user)) throw forbidden('No tienes permiso para eliminar este registro');
    await M.delete(antes.id);
    const estado = await recalcularEstado(antes.paciente_id, pool, req.user.id);
    await auditar(req, { accion: 'eliminar', tabla: 'signos_vitales', registroId: antes.id, antes });
    res.json({ message: 'Registro eliminado', estado });
  }),
};
