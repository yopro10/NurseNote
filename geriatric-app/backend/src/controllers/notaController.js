import { NotaModel } from '../models/notaModel.js';
import pool from '../config/database.js';
import { asyncHandler, bad, forbidden, notFound, paginar, texto, vacio } from '../utils/http.js';
import { auditar } from '../middleware/auditMiddleware.js';
import { esGestorRol } from '../middleware/authMiddleware.js';

export const TIPOS = ['ingreso', 'evolucion', 'egreso', 'medicacion', 'signos_vitales', 'observacion', 'correccion'];
const VENTANA_EDICION_H = 24;

const puedeEditar = (nota, user) =>
  esGestorRol(user.rol) || (nota.usuario_id === user.id && Date.now() - Date.parse(nota.fecha_registro) < VENTANA_EDICION_H * 3600 * 1000);

export const NotaController = {
  listar: asyncHandler(async (req, res) => {
    const f = { ...req.query };
    if (f.mias === 'true') f.usuario_id = req.user.id;
    const pag = paginar(req.query, 15);
    const { data, total } = await NotaModel.listar(f, pag);
    res.json({ data, total, page: pag.page, limit: pag.limit, paginas: Math.max(1, Math.ceil(total / pag.limit)) });
  }),

  getById: asyncHandler(async (req, res) => {
    const nota = await NotaModel.findById(req.params.id);
    if (!nota) throw notFound('Nota no encontrada');
    res.json({ ...nota, editable: !nota.anulada && puedeEditar(nota, req.user) });
  }),

  create: asyncHandler(async (req, res) => {
    const d = req.body || {};
    if (!TIPOS.includes(d.tipo_nota)) throw bad('Tipo de nota inválido');
    if (!Number.isInteger(Number(d.paciente_id))) throw bad('Selecciona un residente');
    if (vacio(d.contenido) || d.contenido.trim().length < 3) throw bad('El contenido de la nota es obligatorio (mínimo 3 caracteres)');
    if (d.contenido.length > 5000) throw bad('El contenido excede 5000 caracteres');
    const { rows } = await pool.query('SELECT id, activo, estado_calculado FROM pacientes WHERE id = $1', [d.paciente_id]);
    if (!rows[0]) throw notFound('Residente no encontrado');
    if (!rows[0].activo) throw bad('No se pueden registrar notas de un residente egresado');

    const nota = await NotaModel.create({
      paciente_id: rows[0].id, usuario_id: req.user.id, tipo_nota: d.tipo_nota, contenido: texto(d.contenido),
      observaciones: vacio(d.observaciones) ? null : texto(d.observaciones),
      signos_vitales: d.signos_vitales && typeof d.signos_vitales === 'object' ? d.signos_vitales : null,
      administracion_medicamentos: d.administracion_medicamentos && typeof d.administracion_medicamentos === 'object' ? d.administracion_medicamentos : null,
      estado_paciente: rows[0].estado_calculado,
    });
    await auditar(req, { accion: 'crear', tabla: 'notas_enfermeria', registroId: nota.id, despues: { paciente_id: nota.paciente_id, tipo_nota: nota.tipo_nota } });
    res.status(201).json({ message: 'Nota registrada', nota });
  }),

  update: asyncHandler(async (req, res) => {
    const antes = await NotaModel.findById(req.params.id);
    if (!antes) throw notFound('Nota no encontrada');
    if (antes.anulada) throw bad('La nota está anulada y no puede editarse');
    if (!puedeEditar(antes, req.user)) throw forbidden(`Solo el autor puede editar su nota durante las primeras ${VENTANA_EDICION_H} h (o un jefe/administrador).`);
    const d = req.body || {};
    if (d.tipo_nota !== undefined && !TIPOS.includes(d.tipo_nota)) throw bad('Tipo de nota inválido');
    if (d.contenido !== undefined && (vacio(d.contenido) || d.contenido.trim().length < 3)) throw bad('El contenido de la nota es obligatorio');
    const nota = await NotaModel.update(antes.id, { contenido: texto(d.contenido), observaciones: texto(d.observaciones), tipo_nota: d.tipo_nota });
    await auditar(req, { accion: 'actualizar', tabla: 'notas_enfermeria', registroId: antes.id, antes: { contenido: antes.contenido, observaciones: antes.observaciones, tipo_nota: antes.tipo_nota }, despues: d });
    res.json({ message: 'Nota actualizada', nota });
  }),

  /** Las notas clínicas no se borran: se anulan con motivo y quedan visibles como "anuladas". */
  anular: asyncHandler(async (req, res) => {
    const antes = await NotaModel.findById(req.params.id);
    if (!antes) throw notFound('Nota no encontrada');
    if (antes.anulada) throw bad('La nota ya está anulada');
    if (!puedeEditar(antes, req.user)) throw forbidden('No tienes permiso para anular esta nota');
    const motivo = texto(req.body?.motivo);
    if (vacio(motivo) || motivo.length < 5) throw bad('Indica el motivo de la anulación (mínimo 5 caracteres)');
    const nota = await NotaModel.anular(antes.id, motivo, req.user.id);
    await auditar(req, { accion: 'anular', tabla: 'notas_enfermeria', registroId: antes.id, despues: { motivo } });
    res.json({ message: 'Nota anulada', nota });
  }),
};
