import pool from '../config/database.js';

export class UserModel {
  static async create({ nombre, email, password, rol }) {
    const query = `
      INSERT INTO usuarios (nombre, email, password, rol, fecha_creacion)
      VALUES ($1, $2, $3, $4, NOW())
      RETURNING id, nombre, email, rol, fecha_creacion
    `;
    const values = [nombre, email, password, rol];
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  static async findByEmail(email) {
    const query = 'SELECT * FROM usuarios WHERE email = $1';
    const result = await pool.query(query, [email]);
    return result.rows[0];
  }

  static async findById(id) {
    const query = 'SELECT id, nombre, email, rol, fecha_creacion FROM usuarios WHERE id = $1';
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  static async getAll() {
    const query = 'SELECT id, nombre, email, rol, fecha_creacion FROM usuarios ORDER BY nombre';
    const result = await pool.query(query);
    return result.rows;
  }

  static async update(id, { nombre, email, rol }) {
    const query = `
      UPDATE usuarios
      SET nombre = $1, email = $2, rol = $3
      WHERE id = $4
      RETURNING id, nombre, email, rol, fecha_creacion
    `;
    const values = [nombre, email, rol, id];
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  static async delete(id) {
    const query = 'DELETE FROM usuarios WHERE id = $1 RETURNING id';
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }
}