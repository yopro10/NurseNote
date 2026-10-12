import pool, { conTransaccion } from '../config/database.js';

const SELECT = `
  SELECT mp.*, m.nombre AS medicamento_nombre, m.presentacion, m.descripcion AS medicamento_descripcion,
         m.cantidad_disponible AS stock, m.fecha_caducidad,
         p.nombre AS paciente_nombre, p.apellido AS paciente_apellido, p.habitacion, p.alergias AS paciente_alergias,
         u.nombre AS prescriptor_nombre, u.apellido AS prescriptor_apellido
  FROM medicamentos_pacientes mp
  JOIN medicamentos m ON m.id = mp.medicamento_id
  JOIN pacientes p ON p.id = mp.paciente_id
  LEFT JOIN usuarios u ON u.id = mp.prescrito_por`;

export class PrescripcionModel {
  static async listar({ paciente_id, medicamento_id, activo } = {}) {
    const v = [];
    const w = [];
    if (paciente_id) { v.push(Number(paciente_id)); w.push(`mp.paciente_id = $${v.length}`); }
    if (medicamento_id) { v.push(Number(medicamento_id)); w.push(`mp.medicamento_id = $${v.length}`); }
    if (activo === 'true' || activo === 'false') { v.push(activo === 'true'); w.push(`mp.activo = $${v.length}`); }
    const { rows } = await pool.query(`${SELECT} ${w.length ? 'WHERE ' + w.join(' AND ') : ''} ORDER BY mp.activo DESC, p.nombre, m.nombre`, v);
    return rows;
  }
  static async findById(id, db = pool) {
    const { rows } = await db.query(`${SELECT} WHERE mp.id = $1`, [id]);
    return rows[0];
  }
  static async existeActiva(pacienteId, medicamentoId, excluirId = 0) {
    const { rows } = await pool.query(
      'SELECT id FROM medicamentos_pacientes WHERE paciente_id = $1 AND medicamento_id = $2 AND activo AND id <> $3', [pacienteId, medicamentoId, excluirId]);
    return rows[0];
  }
  static async create(d, usuarioId) {
    return conTransaccion(async (c) => {
      const { rows } = await c.query(
        `INSERT INTO medicamentos_pacientes (paciente_id, medicamento_id, dosis_prescrita, frecuencia, via_administracion, fecha_inicio, fecha_fin, observaciones, horarios, unidades_por_dosis, prescrito_por)
         VALUES ($1, $2, $3, $4, $5, COALESCE($6::date, CURRENT_DATE), $7, $8, $9, $10, $11) RETURNING id`,
        [d.paciente_id, d.medicamento_id, d.dosis_prescrita, d.frecuencia, d.via_administracion, d.fecha_inicio, d.fecha_fin, d.observaciones, d.horarios, d.unidades_por_dosis, usuarioId]
      );
      return this.findById(rows[0].id, c);
    });
  }
  static async update(id, d) {
    const CAMPOS = ['dosis_prescrita', 'frecuencia', 'via_administracion', 'fecha_fin', 'observaciones', 'horarios', 'unidades_por_dosis'];
    const sets = [];
    const v = [];
    for (const c of CAMPOS) if (d[c] !== undefined) { v.push(d[c]); sets.push(`${c} = $${v.length}`); }
    if (sets.length) { v.push(id); await pool.query(`UPDATE medicamentos_pacientes SET ${sets.join(', ')} WHERE id = $${v.length}`, v); }
    return this.findById(id);
  }
  /** Cancela las dosis futuras aún no administradas de una prescripción (tras suspenderla o cambiar horarios). */
  static async cancelarFuturas(id, motivo, db = pool) {
    await db.query(
      `UPDATE administraciones_medicamentos SET estado = 'cancelada', observaciones = $2
       WHERE medicamento_paciente_id = $1 AND estado = 'programada' AND horario_programado >= NOW()`, [id, motivo]);
  }
  static async suspender(id, motivo) {
    return conTransaccion(async (c) => {
      const { rows } = await c.query(
        `UPDATE medicamentos_pacientes SET activo = false, fecha_fin = CURRENT_DATE, motivo_suspension = $2, fecha_suspension = NOW() WHERE id = $1 AND activo RETURNING id`, [id, motivo]);
      if (!rows[0]) return null;
      await this.cancelarFuturas(id, 'Prescripción suspendida', c);
      return this.findById(id, c);
    });
  }
}
