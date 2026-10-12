import { MedicamentoModel as M } from '../models/medicamentoModel.js';
import { asyncHandler, bad, conflict, notFound, texto, vacio, esFechaISO } from '../utils/http.js';
import { auditar } from '../middleware/auditMiddleware.js';

function normalizar(d, { crear }) {
  const o = {};
  for (const k of ['nombre', 'descripcion', 'presentacion', 'dosis', 'via_administracion', 'lote', 'proveedor']) {
    if (d[k] !== undefined) o[k] = vacio(d[k]) ? null : texto(d[k]);
  }
  if (crear || o.nombre !== undefined) if (!o.nombre || o.nombre.length < 2) throw bad('El nombre del medicamento es obligatorio');
  if (o.nombre && o.nombre.length > 200) throw bad('El nombre excede 200 caracteres');
  if (crear || d.fecha_caducidad !== undefined) {
    if (!esFechaISO(d.fecha_caducidad)) throw bad('La fecha de caducidad es obligatoria y debe ser válida');
    o.fecha_caducidad = d.fecha_caducidad.slice(0, 10);
  }
  if (d.cantidad_disponible !== undefined) {
    const n = Number(d.cantidad_disponible);
    if (!Number.isInteger(n) || n < 0) throw bad('La cantidad debe ser un entero mayor o igual a 0');
    o.cantidad_disponible = n;
  }
  if (d.stock_minimo !== undefined && !vacio(d.stock_minimo)) {
    const n = Number(d.stock_minimo);
    if (!Number.isInteger(n) || n < 0) throw bad('El stock mínimo debe ser un entero mayor o igual a 0');
    o.stock_minimo = n;
  }
  return o;
}

export const MedicamentoController = {
  getAll: asyncHandler(async (req, res) => res.json(await M.getAll(req.query))),

  getById: asyncHandler(async (req, res) => {
    const m = await M.findById(req.params.id);
    if (!m) throw notFound('Medicamento no encontrado');
    res.json({ ...m, residentes: await M.residentes(m.id), movimientos: await M.movimientos(m.id, 30) });
  }),

  create: asyncHandler(async (req, res) => {
    const d = normalizar(req.body || {}, { crear: true });
    const m = await M.create(d, req.user.id);
    await auditar(req, { accion: 'crear', tabla: 'medicamentos', registroId: m.id, despues: d });
    res.status(201).json(m);
  }),

  update: asyncHandler(async (req, res) => {
    const antes = await M.findById(req.params.id);
    if (!antes) throw notFound('Medicamento no encontrado');
    const d = normalizar(req.body || {}, { crear: false });
    delete d.cantidad_disponible; // el stock solo cambia mediante movimientos (queda trazabilidad)
    const m = await M.update(antes.id, d);
    await auditar(req, { accion: 'actualizar', tabla: 'medicamentos', registroId: antes.id, antes, despues: d });
    res.json(m);
  }),

  moverStock: asyncHandler(async (req, res) => {
    const { tipo, motivo } = req.body || {};
    const cantidad = Number(req.body?.cantidad);
    if (!['entrada', 'salida', 'ajuste'].includes(tipo)) throw bad('Tipo de movimiento inválido');
    if (!Number.isInteger(cantidad) || cantidad < (tipo === 'ajuste' ? 0 : 1)) throw bad('La cantidad debe ser un entero válido');
    if ((tipo === 'salida' || tipo === 'ajuste') && (vacio(motivo) || motivo.trim().length < 3)) throw bad('Indica el motivo del movimiento');
    const r = await M.moverStock(Number(req.params.id), { tipo, cantidad, motivo: texto(motivo) }, req.user.id);
    if (r.error === 'No encontrado') throw notFound('Medicamento no encontrado');
    if (r.error) throw conflict(r.error);
    await auditar(req, { accion: 'ajustar_stock', tabla: 'medicamentos', registroId: Number(req.params.id), antes: { stock: r.anterior }, despues: { stock: r.nuevo, tipo, motivo } });
    res.json({ message: 'Stock actualizado', ...r });
  }),

  delete: asyncHandler(async (req, res) => {
    const m = await M.findById(req.params.id);
    if (!m) throw notFound('Medicamento no encontrado');
    if (m.residentes_asignados > 0) throw conflict(`No se puede retirar: ${m.residentes_asignados} residente(s) lo tienen prescrito. Suspende primero esas prescripciones.`);
    await M.desactivar(m.id);
    await auditar(req, { accion: 'desactivar', tabla: 'medicamentos', registroId: m.id, antes: m });
    res.json({ message: 'Medicamento retirado del inventario' });
  }),
};
