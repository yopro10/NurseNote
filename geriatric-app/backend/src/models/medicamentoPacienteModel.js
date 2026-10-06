import pool from '../config/database.js';

export class MedicamentoPacienteModel {
  static async create({
    paciente_id,
    medicamento_id,
    dosis_prescrita,
    frecuencia,
    via_administracion,
    fecha_inicio,
    fecha_fin,
    observaciones
  }) {
    const query = `
      INSERT INTO medicamentos_pacientes (
        paciente_id, medicamento_id, dosis_prescrita, frecuencia,
        via_administracion, fecha_inicio, fecha_fin, observaciones, activo
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true)
      RETURNING *
    `;
    const values = [
      paciente_id, medicamento_id, dosis_prescrita, frecuencia,
      via_administracion, fecha_inicio, fecha_fin, observaciones
    ];
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  static async findById(id) {
    const query = `
      SELECT mp.*, p.nombre as paciente_nombre, p.apellido as paciente_apellido,
             m.nombre as medicamento_nombre, m.presentacion
      FROM medicamentos_pacientes mp
      JOIN pacientes p ON mp.paciente_id = p.id
      JOIN medicamentos m ON mp.medicamento_id = m.id
      WHERE mp.id = $1
    `;
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  static async getByPaciente(pacienteId, soloActivos = true) {
    let query = `
      SELECT mp.*, p.nombre as paciente_nombre, p.apellido as paciente_apellido,
             m.nombre as medicamento_nombre, m.descripcion, m.presentacion,
             m.dosis as medicamento_dosis, m.cantidad_disponible, m.fecha_caducidad
      FROM medicamentos_pacientes mp
      JOIN pacientes p ON mp.paciente_id = p.id
      JOIN medicamentos m ON mp.medicamento_id = m.id
      WHERE mp.paciente_id = $1
    `;
    const values = [pacienteId];

    if (soloActivos) {
      query += ' AND mp.activo = true';
    }

    query += ' ORDER BY mp.fecha_inicio DESC, m.nombre';
    const result = await pool.query(query, values);
    return result.rows;
  }

  static async getByMedicamento(medicamentoId, soloActivos = true) {
    let query = `
      SELECT mp.*, p.nombre as paciente_nombre, p.apellido as paciente_apellido,
             p.habitacion, m.nombre as medicamento_nombre
      FROM medicamentos_pacientes mp
      JOIN pacientes p ON mp.paciente_id = p.id
      JOIN medicamentos m ON mp.medicamento_id = m.id
      WHERE mp.medicamento_id = $1
    `;
    const values = [medicamentoId];

    if (soloActivos) {
      query += ' AND mp.activo = true';
    }

    query += ' ORDER BY p.nombre, p.apellido';
    const result = await pool.query(query, values);
    return result.rows;
  }

  static async getAll(filtros = {}) {
    let query = `
      SELECT mp.*, p.nombre as paciente_nombre, p.apellido as paciente_apellido,
             p.habitacion, m.nombre as medicamento_nombre, m.presentacion
      FROM medicamentos_pacientes mp
      JOIN pacientes p ON mp.paciente_id = p.id
      JOIN medicamentos m ON mp.medicamento_id = m.id
      WHERE 1=1
    `;
    const values = [];
    let paramCount = 1;

    if (filtros.paciente_id) {
      query += ` AND mp.paciente_id = $${paramCount}`;
      values.push(filtros.paciente_id);
      paramCount++;
    }

    if (filtros.medicamento_id) {
      query += ` AND mp.medicamento_id = $${paramCount}`;
      values.push(filtros.medicamento_id);
      paramCount++;
    }

    if (filtros.activo !== undefined) {
      query += ` AND mp.activo = $${paramCount}`;
      values.push(filtros.activo);
      paramCount++;
    }

    query += ' ORDER BY mp.fecha_inicio DESC';
    const result = await pool.query(query, values);
    return result.rows;
  }

  static async update(id, datos) {
    const campos = [];
    const values = [];
    let paramCount = 1;

    const camposPermitidos = [
      'dosis_prescrita', 'frecuencia', 'via_administracion',
      'fecha_inicio', 'fecha_fin', 'observaciones', 'activo'
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
      UPDATE medicamentos_pacientes
      SET ${campos.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *
    `;

    const result = await pool.query(query, values);
    return result.rows[0];
  }

  static async delete(id) {
    const query = `
      UPDATE medicamentos_pacientes
      SET activo = false
      WHERE id = $1
      RETURNING *
    `;
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  static async getMedicamentosActivosPorPaciente(pacienteId) {
    const query = `
      SELECT mp.*, m.nombre as medicamento_nombre, m.presentacion,
             m.cantidad_disponible, m.fecha_caducidad
      FROM medicamentos_pacientes mp
      JOIN medicamentos m ON mp.medicamento_id = m.id
      WHERE mp.paciente_id = $1
      AND mp.activo = true
      AND (mp.fecha_fin IS NULL OR mp.fecha_fin >= CURRENT_DATE)
      ORDER BY m.nombre
    `;
    const result = await pool.query(query, [pacienteId]);
    return result.rows;
  }

  static async getHistorialPorPaciente(pacienteId) {
    const query = `
      SELECT mp.*, m.nombre as medicamento_nombre, m.presentacion,
             u.nombre as usuario_asigno_nombre, u.apellido as usuario_asigno_apellido
      FROM medicamentos_pacientes mp
      JOIN medicamentos m ON mp.medicamento_id = m.id
      LEFT JOIN notas_enfermeria ne ON ne.administracion_medicamentos::jsonb ? mp.id::text
      LEFT JOIN usuarios u ON ne.usuario_id = u.id
      WHERE mp.paciente_id = $1
      ORDER BY mp.fecha_inicio DESC, mp.fecha_asignacion DESC
    `;
    const result = await pool.query(query, [pacienteId]);
    return result.rows;
  }

  static async getEstadisticas() {
    const query = `
      SELECT
        COUNT(*) as total_asignaciones,
        COUNT(*) FILTER (WHERE activo = true) as activas,
        COUNT(*) FILTER (WHERE activo = false) as inactivas,
        COUNT(DISTINCT paciente_id) as pacientes_con_medicamentos,
        COUNT(DISTINCT medicamento_id) as medicamentos_asignados
      FROM medicamentos_pacientes
    `;
    const result = await pool.query(query);
    return result.rows[0];
  }
}
