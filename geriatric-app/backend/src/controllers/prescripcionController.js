import pool from '../config/database.js';
import { PrescripcionModel as M } from '../models/prescripcionModel.js';
import { asyncHandler, bad, conflict, notFound, texto, vacio, esFechaISO } from '../utils/http.js';
import { auditar } from '../middleware/auditMiddleware.js';
import { detectarAlergias } from '../services/alergias.js';
import { generarProgramadas, normalizarHorarios, HORARIO_RE } from '../services/programacion.js';

const hoy = () => new Date().toLocaleDateString('sv-SE');

function validarHorarios(valor) {
  const h = normalizarHorarios(valor);
  if (h && !h.split(',').every((x) => HORARIO_RE.test(x))) throw bad('Los horarios deben tener formato HH:MM (24 h), p. ej. 08:00');
  if (h.split(',').filter(Boolean).length > 8) throw bad('Máximo 8 horarios por prescripción');
  return h;
}

export const PrescripcionController = {
  listar: asyncHandler(async (req, res) => res.json(await M.listar(req.query))),

  getById: asyncHandler(async (req, res) => {
    const p = await M.findById(req.params.id);
    if (!p) throw notFound('Prescripción no encontrada');
    res.json(p);
  }),

  create: asyncHandler(async (req, res) => {
    const d = req.body || {};
    const [pacienteId, medId] = [Number(d.paciente_id), Number(d.medicamento_id)];
    if (!Number.isInteger(pacienteId) || !Number.isInteger(medId)) throw bad('Selecciona residente y medicamento');
    if (vacio(d.dosis_prescrita)) throw bad('La dosis prescrita es obligatoria');
    if (vacio(d.frecuencia)) throw bad('La frecuencia es obligatoria');
    const unidades = vacio(d.unidades_por_dosis) ? 1 : Number(d.unidades_por_dosis);
    if (!Number.isInteger(unidades) || unidades < 1 || unidades > 20) throw bad('Las unidades por dosis deben ser un entero entre 1 y 20');
    if (!vacio(d.fecha_inicio) && !esFechaISO(d.fecha_inicio)) throw bad('Fecha de inicio inválida');
    if (!vacio(d.fecha_fin)) {
      if (!esFechaISO(d.fecha_fin)) throw bad('Fecha de fin inválida');
      if (d.fecha_fin.slice(0, 10) < (d.fecha_inicio || hoy()).slice(0, 10)) throw bad('La fecha de fin no puede ser anterior al inicio');
    }
    const horarios = validarHorarios(d.horarios);

    const { rows: pr } = await pool.query('SELECT id, nombre, apellido, alergias, activo FROM pacientes WHERE id = $1', [pacienteId]);
    if (!pr[0]) throw notFound('Residente no encontrado');
    if (!pr[0].activo) throw bad('No se puede prescribir a un residente egresado');
    const { rows: mr } = await pool.query('SELECT * FROM medicamentos WHERE id = $1 AND activo = true', [medId]);
    if (!mr[0]) throw notFound('Medicamento no encontrado en el inventario');
    if (mr[0].fecha_caducidad <= hoy()) throw bad(`${mr[0].nombre} está vencido (${mr[0].fecha_caducidad}) y no puede prescribirse`);
    if (await M.existeActiva(pacienteId, medId)) throw conflict('Este residente ya tiene una prescripción activa de ese medicamento. Edítala o suspéndela primero.');

    // Validación de alergias: bloquea salvo confirmación explícita (queda auditada).
    const alergias = detectarAlergias(pr[0].alergias, mr[0]);
    if (alergias.length && d.forzar_alergia !== true) {
      throw conflict(`⚠️ ${pr[0].nombre} ${pr[0].apellido} tiene alergia registrada que coincide con ${mr[0].nombre}.`, { codigo: 'ALERGIA', alergias, requiereConfirmacion: true });
    }

    const p = await M.create({
      paciente_id: pacienteId, medicamento_id: medId, dosis_prescrita: texto(d.dosis_prescrita), frecuencia: texto(d.frecuencia),
      via_administracion: vacio(d.via_administracion) ? mr[0].via_administracion : texto(d.via_administracion),
      fecha_inicio: vacio(d.fecha_inicio) ? null : d.fecha_inicio.slice(0, 10), fecha_fin: vacio(d.fecha_fin) ? null : d.fecha_fin.slice(0, 10),
      observaciones: vacio(d.observaciones) ? null : texto(d.observaciones), horarios: horarios || null, unidades_por_dosis: unidades,
    }, req.user.id);
    if (horarios) await generarProgramadas({ desde: hoy(), hasta: hoy(), prescripcionId: p.id });
    await auditar(req, { accion: 'crear', tabla: 'medicamentos_pacientes', registroId: p.id, despues: { ...d, alergia_forzada: alergias.length > 0 } });
    res.status(201).json(p);
  }),

  update: asyncHandler(async (req, res) => {
    const antes = await M.findById(req.params.id);
    if (!antes) throw notFound('Prescripción no encontrada');
    if (!antes.activo) throw bad('La prescripción está suspendida y no puede editarse');
    const d = req.body || {};
    const cambios = {};
    for (const k of ['dosis_prescrita', 'frecuencia', 'via_administracion', 'observaciones']) if (d[k] !== undefined) cambios[k] = vacio(d[k]) ? null : texto(d[k]);
    if (cambios.dosis_prescrita === null || cambios.frecuencia === null) throw bad('Dosis y frecuencia no pueden quedar vacías');
    if (d.fecha_fin !== undefined) {
      if (!vacio(d.fecha_fin) && !esFechaISO(d.fecha_fin)) throw bad('Fecha de fin inválida');
      cambios.fecha_fin = vacio(d.fecha_fin) ? null : d.fecha_fin.slice(0, 10);
      if (cambios.fecha_fin && cambios.fecha_fin < antes.fecha_inicio) throw bad('La fecha de fin no puede ser anterior al inicio');
    }
    if (d.unidades_por_dosis !== undefined) {
      const u = Number(d.unidades_por_dosis);
      if (!Number.isInteger(u) || u < 1 || u > 20) throw bad('Las unidades por dosis deben ser un entero entre 1 y 20');
      cambios.unidades_por_dosis = u;
    }
    const cambiaHorarios = d.horarios !== undefined && validarHorarios(d.horarios) !== (antes.horarios || '');
    if (d.horarios !== undefined) cambios.horarios = validarHorarios(d.horarios) || null;

    const p = await M.update(antes.id, cambios);
    if (cambiaHorarios) {
      await M.cancelarFuturas(antes.id, 'Horario de la prescripción modificado');
      await pool.query(`DELETE FROM administraciones_medicamentos WHERE medicamento_paciente_id = $1 AND estado = 'cancelada' AND horario_programado >= NOW() AND observaciones = 'Horario de la prescripción modificado'`, [antes.id]);
      if (p.horarios) await generarProgramadas({ desde: hoy(), hasta: hoy(), prescripcionId: antes.id });
    }
    await auditar(req, { accion: 'actualizar', tabla: 'medicamentos_pacientes', registroId: antes.id, antes, despues: cambios });
    res.json(p);
  }),

  suspender: asyncHandler(async (req, res) => {
    const motivo = texto(req.body?.motivo);
    if (vacio(motivo) || motivo.length < 3) throw bad('Indica el motivo de la suspensión');
    const p = await M.suspender(Number(req.params.id), motivo);
    if (!p) throw notFound('Prescripción no encontrada o ya suspendida');
    await auditar(req, { accion: 'desactivar', tabla: 'medicamentos_pacientes', registroId: p.id, despues: { motivo } });
    res.json({ message: 'Prescripción suspendida', prescripcion: p });
  }),
};
