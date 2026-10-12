import bcrypt from 'bcryptjs';
import { UserModel } from '../models/userModel.js';
import { asyncHandler, bad, conflict, notFound, texto, vacio } from '../utils/http.js';
import { auditar } from '../middleware/auditMiddleware.js';
import { ROLES } from '../middleware/authMiddleware.js';

const ROLES_VALIDOS = Object.values(ROLES);
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validar(d, { crear }) {
  if (crear || d.nombre !== undefined) if (vacio(d.nombre) || d.nombre.trim().length < 2) throw bad('El nombre es obligatorio (mínimo 2 caracteres)');
  if (crear || d.email !== undefined) if (vacio(d.email) || !EMAIL.test(d.email.trim())) throw bad('Correo electrónico inválido');
  if (crear && (vacio(d.password) || String(d.password).length < 6)) throw bad('La contraseña debe tener al menos 6 caracteres');
  if (d.rol !== undefined && !ROLES_VALIDOS.includes(d.rol)) throw bad('Rol inválido');
  if (crear && vacio(d.rol)) throw bad('El rol es obligatorio');
}

export const UserController = {
  getAll: asyncHandler(async (req, res) => res.json(await UserModel.getAll(req.query))),
  directorio: asyncHandler(async (_req, res) => res.json(await UserModel.directorio())),

  getById: asyncHandler(async (req, res) => {
    const u = await UserModel.findById(req.params.id);
    if (!u) throw notFound('Usuario no encontrado');
    res.json(u);
  }),

  create: asyncHandler(async (req, res) => {
    const d = req.body || {};
    validar(d, { crear: true });
    if (await UserModel.findByEmail(d.email.trim())) throw conflict('Ese correo ya está registrado');
    const u = await UserModel.create({ nombre: texto(d.nombre), apellido: texto(d.apellido), email: texto(d.email), rol: d.rol, password: await bcrypt.hash(String(d.password), 10) });
    await auditar(req, { accion: 'crear', tabla: 'usuarios', registroId: u.id, despues: { ...u } });
    res.status(201).json({ message: 'Usuario creado', user: u });
  }),

  update: asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    const d = req.body || {};
    validar(d, { crear: false });
    const antes = await UserModel.findById(id);
    if (!antes) throw notFound('Usuario no encontrado');
    if (d.email) {
      const otro = await UserModel.findByEmail(d.email.trim());
      if (otro && otro.id !== id) throw conflict('Ese correo ya está registrado');
    }
    if (d.rol && d.rol !== antes.rol && antes.rol === ROLES.ADMIN && (await UserModel.contarAdminsActivos()) <= 1) {
      throw conflict('No puedes quitar el rol al único administrador activo');
    }
    const u = await UserModel.update(id, { nombre: texto(d.nombre), apellido: texto(d.apellido), email: texto(d.email), rol: d.rol });
    await auditar(req, { accion: 'actualizar', tabla: 'usuarios', registroId: id, antes, despues: u });
    res.json({ message: 'Usuario actualizado', user: u });
  }),

  delete: asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    if (id === req.user.id) throw conflict('No puedes desactivar tu propia cuenta');
    const antes = await UserModel.findById(id);
    if (!antes) throw notFound('Usuario no encontrado');
    if (antes.rol === ROLES.ADMIN && antes.activo && (await UserModel.contarAdminsActivos()) <= 1) throw conflict('No puedes desactivar al único administrador activo');
    const u = await UserModel.setActivo(id, false);
    await auditar(req, { accion: 'desactivar', tabla: 'usuarios', registroId: id, antes });
    res.json({ message: 'Usuario desactivado', user: u });
  }),

  reactivate: asyncHandler(async (req, res) => {
    const u = await UserModel.setActivo(Number(req.params.id), true);
    if (!u) throw notFound('Usuario no encontrado');
    await auditar(req, { accion: 'reactivar', tabla: 'usuarios', registroId: u.id });
    res.json({ message: 'Usuario reactivado', user: u });
  }),

  resetPassword: asyncHandler(async (req, res) => {
    const pass = req.body?.password ?? req.body?.newPassword;
    if (vacio(pass) || String(pass).length < 6) throw bad('La contraseña debe tener al menos 6 caracteres');
    const u = await UserModel.setPassword(Number(req.params.id), await bcrypt.hash(String(pass), 10));
    if (!u) throw notFound('Usuario no encontrado');
    await auditar(req, { accion: 'actualizar', tabla: 'usuarios', registroId: u.id, despues: { password: true } });
    res.json({ message: 'Contraseña restablecida' });
  }),
};
