import pool from '../config/database.js';

export class SignosVitalesModel {
  static async create({
    paciente_id,
    usuario_id,
    presion_sistolica,
    presion_diastolica,
    frecuencia_cardiaca,
    temperatura,
    saturacion_oxigeno,
    frecuencia_respiratoria,
    glucosa,
    peso,
    altura,
    observaciones
  }) {
    const query = `
      INSERT INTO signos_vitales (
        paciente_id, usuario_id, presion_sistolica, presion_diastolica,
        frecuencia_cardiaca, temperatura, saturacion_oxigeno, frecuencia_respiratoria,
        glucosa, peso, altura, observaciones, fecha_registro
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW())
      RETURNING *
    `;
    const values = [
      paciente_id, usuario_id, presion_sistolica, presion_diastolica,
      frecuencia_cardiaca, temperatura, saturacion_oxigeno, frecuencia_respiratoria,
      glucosa, peso, altura, observaciones
    ];
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  static async findById(id) {
    const query = `
      SELECT sv.*, p.nombre as paciente_nombre, p.apellido as paciente_apellido,
             u.nombre as usuario_nombre, u.apellido as usuario_apellido
      FROM signos_vitales sv
      JOIN pacientes p ON sv.paciente_id = p.id
      JOIN usuarios u ON sv.usuario_id = u.id
      WHERE sv.id = $1
    `;
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  static async getByPaciente(pacienteId, filtros = {}) {
    let query = `
      SELECT sv.*, p.nombre as paciente_nombre, p.apellido as paciente_apellido,
             u.nombre as usuario_nombre, u.apellido as usuario_apellido
      FROM signos_vitales sv
      JOIN pacientes p ON sv.paciente_id = p.id
      JOIN usuarios u ON sv.usuario_id = u.id
      WHERE sv.paciente_id = $1
    `;
    const values = [pacienteId];
    let paramCount = 2;

    if (filtros.fecha_inicio) {
      query += ` AND sv.fecha_registro >= $${paramCount}`;
      values.push(filtros.fecha_inicio);
      paramCount++;
    }

    if (filtros.fecha_fin) {
      query += ` AND sv.fecha_registro <= $${paramCount}`;
      values.push(filtros.fecha_fin);
      paramCount++;
    }

    query += ' ORDER BY sv.fecha_registro DESC';
    const result = await pool.query(query, values);
    return result.rows;
  }

  static async getUltimosPorPaciente(pacienteId, limite = 10) {
    const query = `
      SELECT sv.*, p.nombre as paciente_nombre, p.apellido as paciente_apellido,
             u.nombre as usuario_nombre, u.apellido as usuario_apellido
      FROM signos_vitales sv
      JOIN pacientes p ON sv.paciente_id = p.id
      JOIN usuarios u ON sv.usuario_id = u.id
      WHERE sv.paciente_id = $1
      ORDER BY sv.fecha_registro DESC
      LIMIT $2
    `;
    const result = await pool.query(query, [pacienteId, limite]);
    return result.rows;
  }

  static async getAlertas(pacienteId) {
    const query = `
      SELECT sv.*,
        CASE
          WHEN sv.saturacion_oxigeno < 90 THEN 'SpO₂ crítico'
          WHEN sv.saturacion_oxigeno < 95 THEN 'SpO₂ bajo'
          WHEN sv.presion_sistolica > 140 OR sv.presion_diastolica > 90 THEN 'Presión alta'
          WHEN sv.presion_sistolica < 90 OR sv.presion_diastolica < 60 THEN 'Presión baja'
          WHEN sv.temperatura > 38 THEN 'Fiebre'
          WHEN sv.temperatura < 36 THEN 'Hipotermia'
          WHEN sv.frecuencia_cardiaca > 100 THEN 'Taquicardia'
          WHEN sv.frecuencia_cardiaca < 60 THEN 'Bradicardia'
          ELSE 'Normal'
        END as estado_alerta
      FROM signos_vitales sv
      WHERE sv.paciente_id = $1
      AND (
        sv.saturacion_oxigeno < 95
        OR sv.presion_sistolica > 140 OR sv.presion_diastolica > 90
        OR sv.presion_sistolica < 90 OR sv.presion_diastolica < 60
        OR sv.temperatura > 38 OR sv.temperatura < 36
        OR sv.frecuencia_cardiaca > 100 OR sv.frecuencia_cardiaca < 60
      )
      ORDER BY sv.fecha_registro DESC
      LIMIT 20
    `;
    const result = await pool.query(query, [pacienteId]);
    return result.rows;
  }

  static async getTendencias(pacienteId, dias = 30) {
    const query = `
      SELECT 
        DATE(fecha_registro) as fecha,
        AVG(presion_sistolica) as avg_presion_sistolica,
        AVG(presion_diastolica) as avg_presion_diastolica,
        AVG(frecuencia_cardiaca) as avg_frecuencia_cardiaca,
        AVG(temperatura) as avg_temperatura,
        AVG(saturacion_oxigeno) as avg_saturacion_oxigeno
      FROM signos_vitales
      WHERE paciente_id = $1
      AND fecha_registro >= NOW() - INTERVAL '${dias} days'
      GROUP BY DATE(fecha_registro)
      ORDER BY fecha ASC
    `;
    const result = await pool.query(query, [pacienteId]);
    return result.rows;
  }

  static async update(id, datos) {
    const campos = [];
    const values = [];
    let paramCount = 1;

    const camposPermitidos = [
      'presion_sistolica', 'presion_diastolica', 'frecuencia_cardiaca',
      'temperatura', 'saturacion_oxigeno', 'frecuencia_respiratoria',
      'glucosa', 'peso', 'altura', 'observaciones'
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
      UPDATE signos_vitales
      SET ${campos.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *
    `;

    const result = await pool.query(query, values);
    return result.rows[0];
  }

  static async delete(id) {
    const query = 'DELETE FROM signos_vitales WHERE id = $1 RETURNING id';
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }
}
