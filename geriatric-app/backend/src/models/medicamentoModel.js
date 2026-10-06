import pool from '../config/database.js';

export class MedicamentoModel {
  static async create({ 
    nombre, 
    descripcion, 
    presentacion, 
    dosis, 
    via_administracion,
    cantidad_disponible,
    fecha_caducidad,
    lote,
    proveedor
  }) {
    const query = `
      INSERT INTO medicamentos (
        nombre, descripcion, presentacion, dosis, via_administracion,
        cantidad_disponible, fecha_caducidad, lote, proveedor, fecha_registro
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
      RETURNING *
    `;
    const values = [
      nombre, descripcion, presentacion, dosis, via_administracion,
      cantidad_disponible, fecha_caducidad, lote, proveedor
    ];
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  static async findById(id) {
    const query = 'SELECT * FROM medicamentos WHERE id = $1';
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  static async getAll(filtros = {}) {
    let query = 'SELECT * FROM medicamentos WHERE activo = true';
    const values = [];
    let paramCount = 1;

    if (filtros.nombre) {
      query += ` AND nombre ILIKE $${paramCount}`;
      values.push(`%${filtros.nombre}%`);
      paramCount++;
    }

    if (filtros.proveedor) {
      query += ` AND proveedor ILIKE $${paramCount}`;
      values.push(`%${filtros.proveedor}%`);
      paramCount++;
    }

    query += ' ORDER BY nombre';
    const result = await pool.query(query, values);
    return result.rows;
  }

  static async update(id, datos) {
    const campos = [];
    const values = [];
    let paramCount = 1;

    const camposPermitidos = [
      'nombre', 'descripcion', 'presentacion', 'dosis', 'via_administracion',
      'cantidad_disponible', 'fecha_caducidad', 'lote', 'proveedor'
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
      UPDATE medicamentos
      SET ${campos.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *
    `;

    const result = await pool.query(query, values);
    return result.rows[0];
  }

  static async delete(id) {
    const query = `
      UPDATE medicamentos
      SET activo = false
      WHERE id = $1
      RETURNING *
    `;
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  static async actualizarCantidad(id, cantidad) {
    const query = `
      UPDATE medicamentos
      SET cantidad_disponible = cantidad_disponible + $1
      WHERE id = $2
      RETURNING *
    `;
    const result = await pool.query(query, [cantidad, id]);
    return result.rows[0];
  }

  static async getMedicamentosProximosVencer(dias = 30) {
    const query = `
      SELECT * FROM medicamentos
      WHERE activo = true
      AND fecha_caducidad <= NOW() + INTERVAL '${dias} days'
      AND fecha_caducidad > NOW()
      ORDER BY fecha_caducidad ASC
    `;
    const result = await pool.query(query);
    return result.rows;
  }

  static async getMedicamentosVencidos() {
    const query = `
      SELECT * FROM medicamentos
      WHERE activo = true
      AND fecha_caducidad < NOW()
      ORDER BY fecha_caducidad DESC
    `;
    const result = await pool.query(query);
    return result.rows;
  }

  static async getMedicamentosBajoStock(minimo = 10) {
    const query = `
      SELECT * FROM medicamentos
      WHERE activo = true
      AND cantidad_disponible <= $1
      ORDER BY cantidad_disponible ASC
    `;
    const result = await pool.query(query, [minimo]);
    return result.rows;
  }

  static async getAlertas() {
    const query = `
      SELECT 
        id,
        nombre,
        cantidad_disponible,
        fecha_caducidad,
        CASE 
          WHEN fecha_caducidad < NOW() THEN 'VENCIDO'
          WHEN fecha_caducidad <= NOW() + INTERVAL '7 days' THEN 'CRITICO'
          WHEN fecha_caducidad <= NOW() + INTERVAL '30 days' THEN 'ADVERTENCIA'
          ELSE 'OK'
        END as estado_caducidad,
        CASE 
          WHEN cantidad_disponible <= 5 THEN 'CRITICO'
          WHEN cantidad_disponible <= 10 THEN 'BAJO'
          ELSE 'OK'
        END as estado_stock
      FROM medicamentos
      WHERE activo = true
      AND (fecha_caducidad <= NOW() + INTERVAL '30 days' OR cantidad_disponible <= 10)
      ORDER BY 
        CASE 
          WHEN fecha_caducidad < NOW() THEN 1
          WHEN fecha_caducidad <= NOW() + INTERVAL '7 days' THEN 2
          WHEN fecha_caducidad <= NOW() + INTERVAL '30 days' THEN 3
          ELSE 4
        END,
        fecha_caducidad ASC
    `;
    const result = await pool.query(query);
    return result.rows;
  }
}