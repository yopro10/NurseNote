import jwt from 'jsonwebtoken';
import pool from '../config/database.js';
import { env } from '../config/env.js';
import { asyncHandler, HttpError } from '../utils/http.js';

export const ROLES = { ADMIN: 'administrador', JEFE: 'jefe_enfermeria', ENF: 'enfermera' };

export const authenticateToken = asyncHandler(async (req, _res, next) => {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) throw new HttpError(401, 'Token de autenticación requerido');

  let payload;
  try {
    payload = jwt.verify(token, env.JWT_SECRET);
  } catch {
    throw new HttpError(401, 'Sesión expirada o token inválido');
  }

  // Se consulta la BD para que una cuenta desactivada o un cambio de rol surtan efecto de inmediato.
  const { rows } = await pool.query(
    'SELECT id, nombre, apellido, email, rol, activo FROM usuarios WHERE id = $1',
    [payload.id]
  );
  const usuario = rows[0];
  if (!usuario || !usuario.activo) throw new HttpError(401, 'La cuenta no existe o está desactivada');
  req.user = { id: usuario.id, nombre: usuario.nombre, apellido: usuario.apellido, email: usuario.email, rol: usuario.rol };
  next();
});

export const authorizeRoles = (...roles) => (req, _res, next) => {
  if (!req.user) return next(new HttpError(401, 'Usuario no autenticado'));
  if (!roles.includes(req.user.rol)) {
    return next(new HttpError(403, 'No tienes permiso para realizar esta acción', { rolRequerido: roles }));
  }
  next();
};

export const isAdmin = authorizeRoles(ROLES.ADMIN);
export const isGestor = authorizeRoles(ROLES.ADMIN, ROLES.JEFE); // administrador o jefe de enfermería
export const isPersonal = authorizeRoles(ROLES.ADMIN, ROLES.JEFE, ROLES.ENF);
export const esGestorRol = (rol) => rol === ROLES.ADMIN || rol === ROLES.JEFE;
