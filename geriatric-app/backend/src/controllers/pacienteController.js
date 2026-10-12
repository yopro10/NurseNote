import { PacienteModel } from '../models/pacienteModel.js';
import { asyncHandler, bad, conflict, notFound, texto, vacio, esFechaISO } from '../utils/http.js';
import { auditar } from '../middleware/auditMiddleware.js';
import { ESTADOS } from '../services/rangos.js';

function normalizar(d, { crear }) {
  const out = {};
  for (const k of ['nombre', 'apellido', 'documento', 'direccion', 'telefono', 'contacto_emergencia', 'telefono_emergencia', 'alergias', 'enfermedades_cronicas', 'habitacion', 'genero', 'fecha_nacimiento']) {
    if (d[k] !== undefined) out[k] = vacio(d[k]) ? null : texto(d[k]);
  }
  if (crear || out.nombre !== undefined) if (!out.nombre || out.nombre.length < 2) throw bad('El nombre es obligatorio (mínimo 2 caracteres)');
  if (crear || out.apellido !== undefined) if (!out.apellido || out.apellido.length < 2) throw bad('El apellido es obligatorio (mínimo 2 caracteres)');
  if (out.genero && !['masculino', 'femenino', 'otro'].includes(out.genero)) throw bad('Género inválido');
  if (out.fecha_nacimiento) {
    if (!esFechaISO(out.fecha_nacimiento)) throw bad('Fecha de nacimiento inválida');
    if (Date.parse(out.fecha_nacimiento) > Date.now()) throw bad('La fecha de nacimiento no puede ser futura');
  }
  for (const [k, max] of [['habitacion', 20], ['telefono', 20], ['telefono_emergencia', 20], ['documento', 30]]) {
    if (out[k] && out[k].length > max) throw bad(`${k} excede ${max} caracteres`);
  }
  return out;
}

export const PacienteController = {
  getAll: asyncHandler(async (req, res) => res.json(await PacienteModel.getAll(req.query))),

  getById: asyncHandler(async (req, res) => {
    const p = await PacienteModel.findById(req.params.id);
    if (!p) throw notFound('Residente no encontrado');
    res.json(p);
  }),

  create: asyncHandler(async (req, res) => {
    const d = normalizar(req.body || {}, { crear: true });
    if (d.documento) {
      const dup = await PacienteModel.findByDocumento(d.documento);
      if (dup) throw conflict(`Ya existe un residente activo con ese documento (${dup.nombre} ${dup.apellido})`);
    }
    const p = await PacienteModel.create(d);
    await auditar(req, { accion: 'crear', tabla: 'pacientes', registroId: p.id, despues: p });
    res.status(201).json(p);
  }),

  update: asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    const antes = await PacienteModel.findById(id);
    if (!antes) throw notFound('Residente no encontrado');
    const d = normalizar(req.body || {}, { crear: false });
    if (d.documento) {
      const dup = await PacienteModel.findByDocumento(d.documento, id);
      if (dup) throw conflict(`Ya existe un residente activo con ese documento (${dup.nombre} ${dup.apellido})`);
    }
    const p = await PacienteModel.update(id, d);
    await auditar(req, { accion: 'actualizar', tabla: 'pacientes', registroId: id, antes, despues: p });
    res.json(p);
  }),

  egresar: asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    const p = await PacienteModel.egresar(id, texto(req.body?.motivo), req.user.id);
    if (!p) throw notFound('Residente no encontrado o ya egresado');
    await auditar(req, { accion: 'desactivar', tabla: 'pacientes', registroId: id, despues: { motivo: req.body?.motivo } });
    res.json({ message: 'Residente egresado', paciente: p });
  }),

  reingresar: asyncHandler(async (req, res) => {
    const p = await PacienteModel.reingresar(Number(req.params.id), req.user.id);
    if (!p) throw notFound('Residente no encontrado o ya activo');
    await auditar(req, { accion: 'reactivar', tabla: 'pacientes', registroId: p.id });
    res.json({ message: 'Residente reingresado', paciente: p });
  }),

  historialEstado: asyncHandler(async (req, res) => res.json(await PacienteModel.historialEstado(req.params.id))),

  cambiarEstado: asyncHandler(async (req, res) => {
    const { estado, motivo } = req.body || {};
    if (!ESTADOS.includes(estado)) throw bad('Estado inválido');
    if (vacio(motivo) || motivo.trim().length < 5) throw bad('Indica el motivo del ajuste (mínimo 5 caracteres)');
    const r = await PacienteModel.cambiarEstadoManual(Number(req.params.id), estado, motivo.trim(), req.user.id);
    if (!r) throw notFound('Residente no encontrado');
    await auditar(req, { accion: 'estado_manual', tabla: 'pacientes', registroId: Number(req.params.id), antes: { estado: r.anterior }, despues: { estado, motivo } });
    res.json({ message: 'Estado actualizado', ...r });
  }),
};
