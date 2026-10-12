export class HttpError extends Error {
  constructor(status, message, extra = {}) {
    super(message);
    this.status = status;
    this.extra = extra;
  }
}

export const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

export const bad = (msg, extra) => new HttpError(400, msg, extra);
export const notFound = (msg = 'Recurso no encontrado') => new HttpError(404, msg);
export const forbidden = (msg = 'No tienes permiso para realizar esta acción') => new HttpError(403, msg);
export const conflict = (msg, extra) => new HttpError(409, msg, extra);

export const texto = (v) => (typeof v === 'string' ? v.trim() : v);
export const vacio = (v) => v === undefined || v === null || (typeof v === 'string' && v.trim() === '');
export const aNumero = (v) => (vacio(v) ? null : Number(v));
export const esFechaISO = (v) => typeof v === 'string' && /^\d{4}-\d{2}-\d{2}/.test(v) && !Number.isNaN(Date.parse(v));

/** Paginación segura a partir de la query string. */
export function paginar(query, defecto = 20, max = 100) {
  const limit = Math.min(Math.max(parseInt(query.limit, 10) || defecto, 1), max);
  const page = Math.max(parseInt(query.page, 10) || 1, 1);
  return { limit, page, offset: (page - 1) * limit };
}

/** Rango de fechas (inclusive) → [desde 00:00, hasta+1 00:00). Por defecto, últimos `diasDefecto` días. */
export function rangoFechas(query, diasDefecto = 30) {
  const hoy = new Date();
  const fmt = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const ini = new Date(hoy);
  ini.setDate(ini.getDate() - (diasDefecto - 1));
  const desde = esFechaISO(query.desde) ? query.desde.slice(0, 10) : fmt(ini);
  const hasta = esFechaISO(query.hasta) ? query.hasta.slice(0, 10) : fmt(hoy);
  if (desde > hasta) throw bad('La fecha inicial no puede ser posterior a la final');
  const dias = Math.round((Date.parse(hasta) - Date.parse(desde)) / 86400000) + 1;
  if (dias > 366) throw bad('El rango máximo permitido es de 366 días');
  return { desde, hasta, dias };
}
