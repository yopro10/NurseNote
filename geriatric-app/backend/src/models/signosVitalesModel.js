import pool from '../config/database.js';

const SELECT = `
  SELECT sv.*, p.nombre AS paciente_nombre, p.apellido AS paciente_apellido, p.habitacion AS paciente_habitacion,
         u.nombre AS usuario_nombre, u.apellido AS usuario_apellido
  FROM signos_vitales sv
  JOIN pacientes p ON p.id = sv.paciente_id
  JOIN usuarios u ON u.id = sv.usuario_id`;

const COLS = ['presion_sistolica', 'presion_diastolica', 'frecuencia_cardiaca', 'temperatura', 'saturacion_oxigeno', 'frecuencia_respiratoria', 'glucosa', 'peso', 'altura', 'observaciones'];

export class SignosVitalesModel {
  static async create(pacienteId, usuarioId, d, db = pool) {
    const { rows } = await db.query(
      `INSERT INTO signos_vitales (paciente_id, usuario_id, ${COLS.join(', ')}) VALUES ($1, $2, ${COLS.map((_, i) => `$${i + 3}`).join(', ')}) RETURNING id`,
      [pacienteId, usuarioId, ...COLS.map((c) => d[c] ?? null)]
    );
    return this.findById(rows[0].id, db);
  }
  static async findById(id, db = pool) {
    const { rows } = await db.query(`${SELECT} WHERE sv.id = $1`, [id]);
    return rows[0];
  }
  static async getByPaciente(pacienteId, { desde, hasta, limit = 200 } = {}) {
    const v = [pacienteId];
    let w = 'WHERE sv.paciente_id = $1';
    if (desde) { v.push(desde); w += ` AND sv.fecha_registro >= $${v.length}::date`; }
    if (hasta) { v.push(hasta); w += ` AND sv.fecha_registro < ($${v.length}::date + 1)`; }
    const { rows } = await pool.query(`${SELECT} ${w} ORDER BY sv.fecha_registro DESC LIMIT ${Number(limit)}`, v);
    return rows;
  }
  /** Último registro de cada residente activo (vista general de signos vitales). */
  static async ultimosPorResidente() {
    const { rows } = await pool.query(
      `SELECT p.id AS paciente_id, p.nombre, p.apellido, p.habitacion, p.estado_calculado, sv.*
       FROM pacientes p
       LEFT JOIN LATERAL (SELECT * FROM signos_vitales s WHERE s.paciente_id = p.id ORDER BY s.fecha_registro DESC LIMIT 1) sv ON true
       WHERE p.activo = true ORDER BY p.habitacion NULLS LAST, p.nombre`);
    return rows.map(({ id, paciente_id, nombre, apellido, habitacion, estado_calculado, ...sv }) => ({
      paciente_id, paciente_nombre: nombre, paciente_apellido: apellido, habitacion, estado_calculado, registro_id: id, ...sv,
    }));
  }
  static async tendencias(pacienteId, dias) {
    const { rows } = await pool.query(
      `SELECT fecha_registro AS fecha, presion_sistolica, presion_diastolica, frecuencia_cardiaca, temperatura, saturacion_oxigeno, frecuencia_respiratoria, glucosa
       FROM signos_vitales WHERE paciente_id = $1 AND fecha_registro >= NOW() - ($2 || ' days')::interval ORDER BY fecha_registro ASC`,
      [pacienteId, String(dias)]
    );
    return rows;
  }
  static async update(id, d) {
    const sets = [];
    const v = [];
    for (const c of COLS) if (d[c] !== undefined) { v.push(d[c]); sets.push(`${c} = $${v.length}`); }
    if (!sets.length) return this.findById(id);
    v.push(id);
    await pool.query(`UPDATE signos_vitales SET ${sets.join(', ')} WHERE id = $${v.length}`, v);
    return this.findById(id);
  }
  static async delete(id) {
    await pool.query('DELETE FROM signos_vitales WHERE id = $1', [id]);
  }
}
