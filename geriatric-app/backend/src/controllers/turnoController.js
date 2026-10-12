import pool from '../config/database.js';
import { asyncHandler, bad, forbidden, HttpError, notFound, paginar, texto, vacio } from '../utils/http.js';
import { auditar } from '../middleware/auditMiddleware.js';
import { construirResumenTurno, resumenATexto } from '../services/resumenTurno.js';

const SELECT = `
  SELECT e.*, us.nombre AS saliente_nombre, us.apellido AS saliente_apellido, ue.nombre AS entrante_nombre, ue.apellido AS entrante_apellido
  FROM entregas_turno e
  LEFT JOIN usuarios us ON us.id = e.usuario_saliente_id
  LEFT JOIN usuarios ue ON ue.id = e.usuario_entrante_id`;

export const TurnoController = {
  resumen: asyncHandler(async (_req, res) => res.json(await construirResumenTurno())),

  listar: asyncHandler(async (req, res) => {
    const pag = paginar(req.query, 10, 50);
    const v = [];
    let where = '';
    if (req.query.mios === 'true') { v.push(req.user.id); where = `WHERE e.usuario_saliente_id = $1 OR e.usuario_entrante_id = $1`; }
    const total = (await pool.query(`SELECT COUNT(*) AS n FROM entregas_turno e ${where}`, v)).rows[0].n;
    const { rows } = await pool.query(`${SELECT} ${where} ORDER BY e.fecha_entrega DESC LIMIT ${pag.limit} OFFSET ${pag.offset}`, v);
    res.json({ data: rows, total, page: pag.page, paginas: Math.max(1, Math.ceil(total / pag.limit)) });
  }),

  getById: asyncHandler(async (req, res) => {
    const { rows } = await pool.query(`${SELECT} WHERE e.id = $1`, [req.params.id]);
    if (!rows[0]) throw notFound('Entrega de turno no encontrada');
    res.json(rows[0]);
  }),

  crear: asyncHandler(async (req, res) => {
    const entrante = Number(req.body?.usuario_entrante_id);
    if (!Number.isInteger(entrante)) throw bad('Selecciona quién recibe el turno');
    if (entrante === req.user.id) throw bad('No puedes entregarte el turno a ti mismo');
    const turno = ['mañana', 'tarde', 'noche'].includes(req.body?.turno) ? req.body.turno : null;
    if (!turno) throw bad('Selecciona el turno que entregas');
    const { rows: u } = await pool.query('SELECT id FROM usuarios WHERE id = $1 AND activo = true', [entrante]);
    if (!u[0]) throw notFound('El usuario que recibe no existe o está inactivo');
    const notas = vacio(req.body?.notas_relevo) ? null : texto(req.body.notas_relevo).slice(0, 4000);

    const resumen = await construirResumenTurno();
    const { rows } = await pool.query(
      `INSERT INTO entregas_turno (usuario_saliente_id, usuario_entrante_id, turno, notas_relevo, alertas_pendientes, pacientes_criticos, pendientes_medicacion, resumen)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id`,
      [req.user.id, entrante, turno, notas, resumenATexto(resumen),
        resumen.criticos.map((c) => `${c.nombre} (hab. ${c.habitacion ?? '—'})`).join('; ') || null,
        [...resumen.medicacion.atrasadas, ...resumen.medicacion.proximas].map((m) => `${m.residente} – ${m.medicamento} ${m.hora}`).join('; ') || null,
        JSON.stringify(resumen)]
    );
    await auditar(req, { accion: 'relevo', tabla: 'entregas_turno', registroId: rows[0].id, despues: { entrante, turno } });
    const { rows: out } = await pool.query(`${SELECT} WHERE e.id = $1`, [rows[0].id]);
    res.status(201).json({ message: 'Entrega de turno registrada', entrega: out[0] });
  }),

  confirmar: asyncHandler(async (req, res) => {
    const { rows } = await pool.query('SELECT * FROM entregas_turno WHERE id = $1', [req.params.id]);
    const e = rows[0];
    if (!e) throw notFound('Entrega de turno no encontrada');
    if (e.usuario_entrante_id !== req.user.id) throw forbidden('Solo quien recibe el turno puede confirmarlo');
    if (e.confirmada) throw new HttpError(409, 'Esta entrega ya fue confirmada');
    await pool.query('UPDATE entregas_turno SET confirmada = true, fecha_confirmacion = NOW() WHERE id = $1', [e.id]);
    await auditar(req, { accion: 'confirmar_relevo', tabla: 'entregas_turno', registroId: e.id });
    const { rows: out } = await pool.query(`${SELECT} WHERE e.id = $1`, [e.id]);
    res.json({ message: 'Turno recibido y confirmado', entrega: out[0] });
  }),
};
