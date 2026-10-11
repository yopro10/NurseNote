import pool from '../config/database.js';

export class NotaModel {
  static async create({ 
    paciente_id, 
    usuario_id, 
    tipo_nota, 
    contenido, 
    signos_vitales,
    administracion_medicamentos,
    observaciones,
    estado_paciente
  }) {
    const query = `
      INSERT INTO notas_enfermeria (
        paciente_id, usuario_id, tipo_nota, contenido, signos_vitales,
        administracion_medicamentos, observaciones, estado_paciente, fecha_registro
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
      RETURNING *
    `;
    const values = [
      paciente_id, usuario_id, tipo_nota, contenido, signos_vitales,
      administracion_medicamentos, observaciones, estado_paciente
    ];
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  static async findById(id) {
    const query = `
      SELECT n.*, p.nombre as paciente_nombre, p.apellido as paciente_apellido,
             u.nombre as usuario_nombre, u.apellido as usuario_apellido
      FROM notas_enfermeria n
      JOIN pacientes p ON n.paciente_id = p.id
      JOIN usuarios u ON n.usuario_id = u.id
      WHERE n.id = $1
    `;
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  static async getByPaciente(pacienteId, filtros = {}) {
    let query = `
      SELECT n.*, p.nombre as paciente_nombre, p.apellido as paciente_apellido,
             u.nombre as usuario_nombre, u.apellido as usuario_apellido
      FROM notas_enfermeria n
      JOIN pacientes p ON n.paciente_id = p.id
      JOIN usuarios u ON n.usuario_id = u.id
      WHERE n.paciente_id = $1
    `;
    const values = [pacienteId];
    let paramCount = 2;

    if (filtros.fecha_inicio) {
      query += ` AND n.fecha_registro >= $${paramCount}`;
      values.push(filtros.fecha_inicio);
      paramCount++;
    }

    if (filtros.fecha_fin) {
      query += ` AND n.fecha_registro <= $${paramCount}`;
      values.push(filtros.fecha_fin);
      paramCount++;
    }

    if (filtros.tipo_nota) {
      query += ` AND n.tipo_nota = $${paramCount}`;
      values.push(filtros.tipo_nota);
      paramCount++;
    }

    query += ' ORDER BY n.fecha_registro DESC';
    const result = await pool.query(query, values);
    return result.rows;
  }

  static async getAll(filtros = {}) {
    let query = `
      SELECT n.*, p.nombre as paciente_nombre, p.apellido as paciente_apellido,
             u.nombre as usuario_nombre, u.apellido as usuario_apellido
      FROM notas_enfermeria n
      JOIN pacientes p ON n.paciente_id = p.id
      JOIN usuarios u ON n.usuario_id = u.id
      WHERE 1=1
    `;
    const values = [];
    let paramCount = 1;

    if (filtros.paciente_id) {
      query += ` AND n.paciente_id = $${paramCount}`;
      values.push(filtros.paciente_id);
      paramCount++;
    }

    if (filtros.usuario_id) {
      query += ` AND n.usuario_id = $${paramCount}`;
      values.push(filtros.usuario_id);
      paramCount++;
    }

    if (filtros.fecha_inicio) {
      query += ` AND n.fecha_registro >= $${paramCount}`;
      values.push(filtros.fecha_inicio);
      paramCount++;
    }

    if (filtros.fecha_fin) {
      query += ` AND n.fecha_registro <= $${paramCount}`;
      values.push(filtros.fecha_fin);
      paramCount++;
    }

    query += ' ORDER BY n.fecha_registro DESC';
    const result = await pool.query(query, values);
    return result.rows;
  }

  static async update(id, datos) {
    const campos = [];
    const values = [];
    let paramCount = 1;

    const camposPermitidos = [
      'tipo_nota', 'contenido', 'signos_vitales',
      'administracion_medicamentos', 'observaciones', 'estado_paciente'
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
      UPDATE notas_enfermeria
      SET ${campos.join(', ')}, fecha_actualizacion = NOW()
      WHERE id = $${paramCount}
      RETURNING *
    `;

    const result = await pool.query(query, values);
    return result.rows[0];
  }

  static async delete(id) {
    // Las notas no se borran, se corrigen con una nota aclaratoria
    // Este método desactiva la nota original
    const query = `
      UPDATE notas_enfermeria
      SET contenido = contenido || ' [NOTA CORREGIDA - VER NOTA DE CORRECCIÓN]',
      observaciones = COALESCE(observaciones, '') || ' Esta nota fue corregida. Vea la nota de corrección.',
      fecha_actualizacion = NOW()
      WHERE id = $1
      RETURNING *
    `;
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  static async createCorreccion(id, datos) {
    // Crea una nota de corrección que referencia a la nota original
    const query = `
      INSERT INTO notas_enfermeria (
        paciente_id, usuario_id, tipo_nota, contenido, observaciones, estado_paciente, fecha_registro
      )
      SELECT 
        paciente_id, 
        $1 as usuario_id, 
        'correccion' as tipo_nota,
        $2 as contenido,
        $3 as observaciones,
        estado_paciente,
        NOW()
      FROM notas_enfermeria
      WHERE id = $4
      RETURNING *
    `;
    const values = [datos.usuario_id, datos.contenido, datos.observaciones, id];
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  static async getUltimasNotas(pacienteId, limite = 10) {
    const query = `
      SELECT n.*, p.nombre as paciente_nombre, p.apellido as paciente_apellido,
             u.nombre as usuario_nombre, u.apellido as usuario_apellido
      FROM notas_enfermeria n
      JOIN pacientes p ON n.paciente_id = p.id
      JOIN usuarios u ON n.usuario_id = u.id
      WHERE n.paciente_id = $1
      ORDER BY n.fecha_registro DESC
      LIMIT $2
    `;
    const result = await pool.query(query, [pacienteId, limite]);
    return result.rows;
  }
}