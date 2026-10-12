import pool from '../config/database.js';
import { asyncHandler, bad } from '../utils/http.js';
import { construirNotificaciones } from '../services/notificaciones.js';

export const NotificacionController = {
  listar: asyncHandler(async (req, res) => res.json(await construirNotificaciones(req.user))),

  /** Marca como leídas las claves indicadas, o todas las vigentes con { todas: true }. */
  leer: asyncHandler(async (req, res) => {
    let claves = Array.isArray(req.body?.claves) ? req.body.claves.map(String).slice(0, 200) : [];
    if (req.body?.todas === true) claves = (await construirNotificaciones(req.user)).items.map((i) => i.clave);
    if (!claves.length) throw bad('No hay notificaciones para marcar');
    await pool.query(
      `INSERT INTO notificaciones_leidas (usuario_id, clave) SELECT $1, UNNEST($2::text[]) ON CONFLICT DO NOTHING`, [req.user.id, claves]);
    res.json({ message: 'Notificaciones marcadas como leídas', marcadas: claves.length });
  }),
};
