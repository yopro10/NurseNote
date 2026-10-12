import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { UserModel } from '../models/userModel.js';
import { env } from '../config/env.js';
import { HttpError, asyncHandler, bad } from '../utils/http.js';
import { auditar } from '../middleware/auditMiddleware.js';

const publico = (u) => ({ id: u.id, nombre: u.nombre, apellido: u.apellido, email: u.email, rol: u.rol, fecha_creacion: u.fecha_creacion });

export const AuthController = {
  /** El registro público está cerrado: las cuentas las crea un administrador desde Usuarios. */
  register: (_req, _res, next) =>
    next(new HttpError(403, 'El registro público está deshabilitado. Solicita tu cuenta a un administrador.')),

  login: asyncHandler(async (req, res) => {
    const { email, password } = req.body || {};
    if (!email || !password) throw bad('Correo y contraseña son requeridos');

    const user = await UserModel.findByEmail(String(email).trim());
    const valido = user && (await bcrypt.compare(String(password), user.password));
    if (!valido) throw new HttpError(401, 'Credenciales inválidas');
    if (!user.activo) throw new HttpError(403, 'Tu cuenta está desactivada. Contacta a un administrador.');

    const token = jwt.sign({ id: user.id, rol: user.rol }, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN });
    await auditar({ user: { id: user.id }, ip: req.ip, get: req.get.bind(req) }, { accion: 'login', tabla: 'usuarios', registroId: user.id });
    res.json({ message: 'Login exitoso', user: publico(user), token });
  }),

  getProfile: asyncHandler(async (req, res) => {
    const user = await UserModel.findById(req.user.id);
    if (!user) throw new HttpError(404, 'Usuario no encontrado');
    res.json(publico(user));
  }),

  logout: asyncHandler(async (req, res) => {
    await auditar(req, { accion: 'logout', tabla: 'usuarios', registroId: req.user.id });
    res.json({ message: 'Sesión cerrada' });
  }),
};
