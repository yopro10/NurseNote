import pool from '../config/database.js';

const CAMPOS = 'id, nombre, apellido, email, rol, activo, fecha_creacion';

export class UserModel {
  static async create({ nombre, apellido, email, password, rol }) {
    const { rows } = await pool.query(
      `INSERT INTO usuarios (nombre, apellido, email, password, rol) VALUES ($1, $2, LOWER($3), $4, $5) RETURNING ${CAMPOS}`,
      [nombre, apellido || null, email, password, rol]
    );
    return rows[0];
  }
  static async findByEmail(email) {
    const { rows } = await pool.query('SELECT * FROM usuarios WHERE LOWER(email) = LOWER($1)', [email]);
    return rows[0];
  }
  static async findById(id) {
    const { rows } = await pool.query(`SELECT ${CAMPOS} FROM usuarios WHERE id = $1`, [id]);
    return rows[0];
  }
  static async getAll({ q, rol, activo } = {}) {
    const w = [];
    const v = [];
    if (q) { v.push(`%${q}%`); w.push(`(nombre ILIKE $${v.length} OR apellido ILIKE $${v.length} OR email ILIKE $${v.length})`); }
    if (rol) { v.push(rol); w.push(`rol = $${v.length}`); }
    if (activo === 'true' || activo === 'false') { v.push(activo === 'true'); w.push(`activo = $${v.length}`); }
    const { rows } = await pool.query(
      `SELECT ${CAMPOS} FROM usuarios ${w.length ? 'WHERE ' + w.join(' AND ') : ''} ORDER BY activo DESC, nombre, apellido`, v);
    return rows;
  }
  static async directorio() {
    const { rows } = await pool.query(
      `SELECT id, nombre, apellido, rol FROM usuarios WHERE activo = true ORDER BY nombre, apellido`);
    return rows;
  }
  static async update(id, { nombre, apellido, email, rol }) {
    const { rows } = await pool.query(
      `UPDATE usuarios SET nombre = COALESCE($1, nombre), apellido = COALESCE($2, apellido), email = COALESCE(LOWER($3), email),
         rol = COALESCE($4, rol), fecha_actualizacion = NOW() WHERE id = $5 RETURNING ${CAMPOS}`,
      [nombre ?? null, apellido ?? null, email ?? null, rol ?? null, id]
    );
    return rows[0];
  }
  static async setActivo(id, activo) {
    const { rows } = await pool.query(
      `UPDATE usuarios SET activo = $2, fecha_actualizacion = NOW() WHERE id = $1 RETURNING ${CAMPOS}`, [id, activo]);
    return rows[0];
  }
  static async setPassword(id, hash) {
    const { rows } = await pool.query(
      `UPDATE usuarios SET password = $2, fecha_actualizacion = NOW() WHERE id = $1 RETURNING ${CAMPOS}`, [id, hash]);
    return rows[0];
  }
  static async contarAdminsActivos() {
    const { rows } = await pool.query(`SELECT COUNT(*) AS n FROM usuarios WHERE rol = 'administrador' AND activo = true`);
    return rows[0].n;
  }
}
