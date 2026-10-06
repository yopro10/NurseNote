import pool from '../config/database.js';

export class PacienteModel {
  static async create({ 
    nombre, 
    apellido, 
    fecha_nacimiento, 
    genero, 
    direccion, 
    telefono, 
    contacto_emergencia, 
    telefono_emergencia,
    alergias,
    enfermedades_cronicas,
    habitacion
  }) {
    const query = `
      INSERT INTO pacientes (
        nombre, apellido, fecha_nacimiento, genero, direccion, telefono,
        contacto_emergencia, telefono_emergencia, alergias, enfermedades_cronicas,
        habitacion, fecha_ingreso, activo
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(), true)
      RETURNING *
    `;
    const values = [
      nombre, apellido, fecha_nacimiento, genero, direccion, telefono,
      contacto_emergencia, telefono_emergencia, alergias, enfermedades_cronicas,
      habitacion
    ];
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  static async findById(id) {
    const query = 'SELECT * FROM pacientes WHERE id = $1';
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  static async getAll(filtros = {}) {
    let query = 'SELECT * FROM pacientes WHERE activo = true';
    const values = [];
    let paramCount = 1;

    if (filtros.nombre) {
      query += ` AND nombre ILIKE $${paramCount}`;
      values.push(`%${filtros.nombre}%`);
      paramCount++;
    }

    if (filtros.habitacion) {
      query += ` AND habitacion = $${paramCount}`;
      values.push(filtros.habitacion);
      paramCount++;
    }

    query += ' ORDER BY nombre, apellido';
    const result = await pool.query(query, values);
    return result.rows;
  }

  static async update(id, datos) {
    const campos = [];
    const values = [];
    let paramCount = 1;

    const camposPermitidos = [
      'nombre', 'apellido', 'fecha_nacimiento', 'genero', 'direccion', 
      'telefono', 'contacto_emergencia', 'telefono_emergencia', 
      'alergias', 'enfermedades_cronicas', 'habitacion'
    ];

    for (const campo of camposPermitidos) {
      if (datos[campo] !== undefined) {
        campos.push(`${campo} = $${paramCount}`);
        values.push(datos[campo]);
        paramCount++;
      }
    }

    if (campos.length === 0) {
      return null;
    }

    values.push(id);
    const query = `
      UPDATE pacientes
      SET ${campos.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *
    `;

    const result = await pool.query(query, values);
    return result.rows[0];
  }

  static async delete(id) {
    const query = `
      UPDATE pacientes
      SET activo = false, fecha_egreso = NOW()
      WHERE id = $1
      RETURNING *
    `;
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  static async getByHabitacion(habitacion) {
    const query = 'SELECT * FROM pacientes WHERE habitacion = $1 AND activo = true ORDER BY nombre, apellido';
    const result = await pool.query(query, [habitacion]);
    return result.rows;
  }

  static async getHistorial(id) {
    const query = `
      SELECT
        ne.*,
        u.nombre as usuario_nombre,
        u.apellido as usuario_apellido,
        p.nombre as paciente_nombre,
        p.apellido as paciente_apellido
      FROM notas_enfermeria ne
      JOIN usuarios u ON ne.usuario_id = u.id
      JOIN pacientes p ON ne.paciente_id = p.id
      WHERE ne.paciente_id = $1
      ORDER BY ne.fecha_registro DESC
      LIMIT 50
    `;
    const result = await pool.query(query, [id]);
    return result.rows;
  }

  static async getEstadisticas() {
    const query = `
      SELECT
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE alergias IS NOT NULL AND alergias != '') as con_alergias,
        COUNT(*) FILTER (WHERE enfermedades_cronicas IS NOT NULL AND enfermedades_cronicas != '') as con_condiciones,
        COUNT(*) FILTER (WHERE habitacion IS NOT NULL) as con_habitacion
      FROM pacientes
      WHERE activo = true
    `;
    const result = await pool.query(query);
    return result.rows[0];
  }
}