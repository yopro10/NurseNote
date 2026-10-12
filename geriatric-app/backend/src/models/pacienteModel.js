import pool, { conTransaccion } from '../config/database.js';

const CAMPOS = ['nombre', 'apellido', 'documento', 'fecha_nacimiento', 'genero', 'direccion', 'telefono',
  'contacto_emergencia', 'telefono_emergencia', 'alergias', 'enfermedades_cronicas', 'habitacion'];

export class PacienteModel {
  static async create(d) {
    const { rows } = await pool.query(
      `INSERT INTO pacientes (${CAMPOS.join(', ')}, fecha_ingreso, activo, estado_calculado, fecha_ultimo_estado, estado_motivo)
       VALUES (${CAMPOS.map((_, i) => `$${i + 1}`).join(', ')}, NOW(), true, 'Estable', NOW(), 'Sin signos vitales registrados') RETURNING *`,
      CAMPOS.map((c) => d[c] ?? null)
    );
    await pool.query(
      `INSERT INTO historial_estado_paciente (paciente_id, estado_nuevo, origen, motivo) VALUES ($1, 'Estable', 'automatico', 'Ingreso al hogar')`,
      [rows[0].id]
    );
    return rows[0];
  }

  static async findById(id) {
    const { rows } = await pool.query('SELECT * FROM pacientes WHERE id = $1', [id]);
    return rows[0];
  }

  static async findByDocumento(documento, excluirId = 0) {
    const { rows } = await pool.query(
      'SELECT id, nombre, apellido FROM pacientes WHERE activo = true AND documento = $1 AND id <> $2', [documento, excluirId]);
    return rows[0];
  }

  static async getAll({ q, estado, habitacion, egresados } = {}) {
    const v = [];
    const w = [egresados === 'true' ? 'p.activo = false' : 'p.activo = true'];
    if (q) {
      v.push(`%${q}%`);
      w.push(`(p.nombre || ' ' || COALESCE(p.apellido, '') ILIKE $${v.length} OR p.habitacion ILIKE $${v.length} OR p.documento ILIKE $${v.length})`);
    }
    if (estado) { v.push(estado); w.push(`p.estado_calculado = $${v.length}`); }
    if (habitacion) { v.push(habitacion); w.push(`p.habitacion = $${v.length}`); }
    const { rows } = await pool.query(
      `SELECT p.*,
         (SELECT MAX(fecha_registro) FROM signos_vitales s WHERE s.paciente_id = p.id) AS ultimo_signo,
         (SELECT COUNT(*) FROM medicamentos_pacientes mp WHERE mp.paciente_id = p.id AND mp.activo) AS medicamentos_activos
       FROM pacientes p WHERE ${w.join(' AND ')} ORDER BY p.habitacion NULLS LAST, p.nombre, p.apellido`, v);
    return rows;
  }

  static async update(id, datos) {
    const sets = [];
    const v = [];
    for (const c of CAMPOS) if (datos[c] !== undefined) { v.push(datos[c]); sets.push(`${c} = $${v.length}`); }
    if (!sets.length) return this.findById(id);
    v.push(id);
    const { rows } = await pool.query(`UPDATE pacientes SET ${sets.join(', ')} WHERE id = $${v.length} RETURNING *`, v);
    return rows[0];
  }

  /** Egreso: cierra prescripciones activas y cancela las dosis futuras programadas. */
  static async egresar(id, motivo, usuarioId) {
    return conTransaccion(async (c) => {
      const { rows } = await c.query(
        `UPDATE pacientes SET activo = false, fecha_egreso = NOW(), motivo_egreso = $2 WHERE id = $1 AND activo = true RETURNING *`, [id, motivo || null]);
      if (!rows[0]) return null;
      await c.query(`UPDATE medicamentos_pacientes SET activo = false, fecha_fin = CURRENT_DATE, motivo_suspension = 'Egreso del residente', fecha_suspension = NOW() WHERE paciente_id = $1 AND activo`, [id]);
      await c.query(`UPDATE administraciones_medicamentos SET estado = 'cancelada', observaciones = 'Cancelada por egreso' WHERE paciente_id = $1 AND estado = 'programada' AND horario_programado >= NOW()`, [id]);
      await c.query(
        `INSERT INTO historial_estado_paciente (paciente_id, estado_anterior, estado_nuevo, origen, motivo, usuario_id)
         VALUES ($1, $2, 'Egresado', 'manual', $3, $4)`, [id, rows[0].estado_calculado, motivo || 'Egreso del hogar', usuarioId]);
      return rows[0];
    });
  }

  static async reingresar(id, usuarioId) {
    return conTransaccion(async (c) => {
      const { rows } = await c.query(
        `UPDATE pacientes SET activo = true, fecha_egreso = NULL, motivo_egreso = NULL, estado_calculado = 'Estable', fecha_ultimo_estado = NOW(), estado_motivo = 'Reingreso al hogar'
         WHERE id = $1 AND activo = false RETURNING *`, [id]);
      if (!rows[0]) return null;
      await c.query(
        `INSERT INTO historial_estado_paciente (paciente_id, estado_anterior, estado_nuevo, origen, motivo, usuario_id)
         VALUES ($1, 'Egresado', 'Estable', 'manual', 'Reingreso al hogar', $2)`, [id, usuarioId]);
      return rows[0];
    });
  }

  static async historialEstado(id) {
    const { rows } = await pool.query(
      `SELECT h.*, u.nombre AS usuario_nombre, u.apellido AS usuario_apellido
       FROM historial_estado_paciente h LEFT JOIN usuarios u ON u.id = h.usuario_id
       WHERE h.paciente_id = $1 ORDER BY h.fecha DESC, h.id DESC LIMIT 100`, [id]);
    return rows;
  }

  static async cambiarEstadoManual(id, estado, motivo, usuarioId) {
    return conTransaccion(async (c) => {
      const { rows: act } = await c.query('SELECT estado_calculado FROM pacientes WHERE id = $1 FOR UPDATE', [id]);
      if (!act[0]) return null;
      await c.query(`UPDATE pacientes SET estado_calculado = $2, estado_motivo = $3, fecha_ultimo_estado = NOW() WHERE id = $1`, [id, estado, `Ajuste manual: ${motivo}`]);
      await c.query(
        `INSERT INTO historial_estado_paciente (paciente_id, estado_anterior, estado_nuevo, origen, motivo, usuario_id)
         VALUES ($1, $2, $3, 'manual', $4, $5)`, [id, act[0].estado_calculado, estado, motivo, usuarioId]);
      return { anterior: act[0].estado_calculado, estado };
    });
  }
}
