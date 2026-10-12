import pool from '../config/database.js';

const SELECT = `
  SELECT n.*, p.nombre AS paciente_nombre, p.apellido AS paciente_apellido, p.habitacion AS paciente_habitacion,
         u.nombre AS usuario_nombre, u.apellido AS usuario_apellido, u.rol AS usuario_rol,
         ua.nombre AS anulada_por_nombre
  FROM notas_enfermeria n
  JOIN pacientes p ON p.id = n.paciente_id
  JOIN usuarios u ON u.id = n.usuario_id
  LEFT JOIN usuarios ua ON ua.id = n.anulada_por`;

export class NotaModel {
  static async create(d) {
    const { rows } = await pool.query(
      `INSERT INTO notas_enfermeria (paciente_id, usuario_id, tipo_nota, contenido, signos_vitales, administracion_medicamentos, observaciones, estado_paciente)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id`,
      [d.paciente_id, d.usuario_id, d.tipo_nota, d.contenido, d.signos_vitales ?? null, d.administracion_medicamentos ?? null, d.observaciones ?? null, d.estado_paciente ?? null]
    );
    return this.findById(rows[0].id);
  }

  static async findById(id) {
    const { rows } = await pool.query(`${SELECT} WHERE n.id = $1`, [id]);
    return rows[0];
  }

  static async listar(f = {}, { limit, offset }) {
    const v = [];
    const w = [];
    const add = (cond, val) => { v.push(val); w.push(cond.replace('?', `$${v.length}`)); };
    if (f.paciente_id) add('n.paciente_id = ?', Number(f.paciente_id));
    if (f.usuario_id) add('n.usuario_id = ?', Number(f.usuario_id));
    if (f.tipo_nota) add('n.tipo_nota = ?', f.tipo_nota);
    if (f.desde) add('n.fecha_registro >= ?::date', f.desde);
    if (f.hasta) add(`n.fecha_registro < (?::date + 1)`, f.hasta);
    if (f.q) { v.push(`%${f.q}%`); w.push(`(n.contenido ILIKE $${v.length} OR n.observaciones ILIKE $${v.length} OR (p.nombre || ' ' || p.apellido) ILIKE $${v.length})`); }
    if (f.incluir_anuladas !== 'true') w.push('n.anulada = false');
    const where = w.length ? `WHERE ${w.join(' AND ')}` : '';
    const total = (await pool.query(`SELECT COUNT(*) AS n FROM notas_enfermeria n JOIN pacientes p ON p.id = n.paciente_id ${where}`, v)).rows[0].n;
    const { rows } = await pool.query(`${SELECT} ${where} ORDER BY n.fecha_registro DESC, n.id DESC LIMIT ${limit} OFFSET ${offset}`, v);
    return { data: rows, total };
  }

  static async update(id, { contenido, observaciones, estado_paciente, tipo_nota }) {
    await pool.query(
      `UPDATE notas_enfermeria SET contenido = COALESCE($2, contenido), observaciones = COALESCE($3, observaciones),
         estado_paciente = COALESCE($4, estado_paciente), tipo_nota = COALESCE($5, tipo_nota), fecha_actualizacion = NOW() WHERE id = $1`,
      [id, contenido ?? null, observaciones ?? null, estado_paciente ?? null, tipo_nota ?? null]
    );
    return this.findById(id);
  }

  static async anular(id, motivo, usuarioId) {
    await pool.query(
      `UPDATE notas_enfermeria SET anulada = true, motivo_anulacion = $2, anulada_por = $3, fecha_anulacion = NOW() WHERE id = $1`,
      [id, motivo, usuarioId]
    );
    return this.findById(id);
  }
}
