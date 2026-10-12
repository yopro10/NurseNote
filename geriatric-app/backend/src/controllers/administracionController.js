import pool from '../config/database.js';
import { AdministracionModel as M } from '../models/administracionModel.js';
import { asyncHandler, bad, HttpError, paginar, texto, vacio, esFechaISO } from '../utils/http.js';
import { auditar } from '../middleware/auditMiddleware.js';
import { esGestorRol } from '../middleware/authMiddleware.js';
import { detectarAlergias } from '../services/alergias.js';
import { generarProgramadas } from '../services/programacion.js';
import { recalcularEstado } from '../services/estadoPaciente.js';

const hoy = () => new Date().toLocaleDateString('sv-SE');
const falla = (r) => new HttpError(r.error, r.mensaje, r.codigo ? { codigo: r.codigo } : {});

/** Validación de alergia previa a administrar. Solo un jefe/administrador puede confirmar una excepción. */
async function validarAlergia(req, pacienteId, medicamentoId) {
  const { rows: p } = await pool.query('SELECT nombre, apellido, alergias FROM pacientes WHERE id = $1', [pacienteId]);
  const { rows: m } = await pool.query('SELECT nombre, descripcion FROM medicamentos WHERE id = $1', [medicamentoId]);
  if (!p[0] || !m[0]) return;
  const alergias = detectarAlergias(p[0].alergias, m[0]);
  if (!alergias.length) return;
  if (req.body?.forzar_alergia === true && esGestorRol(req.user.rol)) return;
  throw new HttpError(409, `⚠️ ${p[0].nombre} ${p[0].apellido} tiene alergia registrada que coincide con ${m[0].nombre}.`, {
    codigo: 'ALERGIA', alergias, puedeForzar: esGestorRol(req.user.rol),
  });
}

async function despuesDeRegistrar(req, r, accion) {
  const estado = await recalcularEstado(r.paciente_id, pool, req.user.id);
  await auditar(req, { accion, tabla: 'administraciones_medicamentos', registroId: r.id, despues: { ...req.body, paciente_id: r.paciente_id } });
  return estado;
}

export const AdministracionController = {
  pendientes: asyncHandler(async (req, res) => {
    const fecha = esFechaISO(req.query.fecha) ? req.query.fecha.slice(0, 10) : hoy();
    await generarProgramadas({ desde: fecha, hasta: fecha, pacienteId: req.query.paciente_id ? Number(req.query.paciente_id) : null });
    const filas = await M.pendientes({ pacienteId: req.query.paciente_id ? Number(req.query.paciente_id) : null, fecha });
    res.json({ fecha, total: filas.length, atrasadas: filas.filter((f) => f.atrasada).length, items: filas });
  }),

  listar: asyncHandler(async (req, res) => {
    const pag = paginar(req.query, 20);
    const { data, total } = await M.listar(req.query, pag);
    res.json({ data, total, page: pag.page, limit: pag.limit, paginas: Math.max(1, Math.ceil(total / pag.limit)) });
  }),

  administrar: asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    const adm = await M.findById(id);
    if (!adm) throw new HttpError(404, 'Administración no encontrada');
    await validarAlergia(req, adm.paciente_id, adm.medicamento_id);
    const r = await M.administrar(id, req.user.id, { observaciones: texto(req.body?.observaciones) });
    if (r.error) throw falla(r);
    const estado = await despuesDeRegistrar(req, r, 'administrar');
    res.json({ message: 'Dosis administrada', registro: r.registro, stockRestante: r.stockRestante, stockBajo: r.stockRestante <= r.stockMinimo, estado });
  }),

  directa: asyncHandler(async (req, res) => {
    const pid = Number(req.body?.prescripcion_id);
    if (!Number.isInteger(pid)) throw bad('Selecciona la prescripción');
    const { rows } = await pool.query('SELECT paciente_id, medicamento_id FROM medicamentos_pacientes WHERE id = $1 AND activo', [pid]);
    if (!rows[0]) throw new HttpError(404, 'Prescripción activa no encontrada');
    await validarAlergia(req, rows[0].paciente_id, rows[0].medicamento_id);
    const r = await M.directa(pid, req.user.id, { observaciones: texto(req.body?.observaciones) });
    if (r.error) throw falla(r);
    const estado = await despuesDeRegistrar(req, r, 'administrar');
    res.status(201).json({ message: 'Dosis extra registrada', registro: r.registro, stockRestante: r.stockRestante, stockBajo: r.stockRestante <= r.stockMinimo, estado });
  }),

  omitir: asyncHandler(async (req, res) => {
    const motivo = texto(req.body?.motivo);
    if (vacio(motivo) || motivo.length < 3) throw bad('Indica el motivo (mínimo 3 caracteres)');
    const estado = req.body?.estado === 'rechazada' ? 'rechazada' : 'omitida';
    const r = await M.omitir(Number(req.params.id), req.user.id, { motivo, estado });
    if (r.error) throw falla(r);
    const nuevo = await despuesDeRegistrar(req, r, 'omitir');
    res.json({ message: estado === 'rechazada' ? 'Rechazo registrado' : 'Omisión registrada', registro: r.registro, estado: nuevo });
  }),
};
