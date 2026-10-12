import pool, { conTransaccion } from '../config/database.js';

const BASE = `
  SELECT m.*, COALESCE(m.stock_minimo, 10) AS stock_minimo_efectivo,
    (m.fecha_caducidad - CURRENT_DATE) AS dias_para_vencer,
    CASE
      WHEN m.fecha_caducidad <= CURRENT_DATE THEN 'vencido'
      WHEN m.cantidad_disponible = 0 THEN 'agotado'
      WHEN m.fecha_caducidad <= CURRENT_DATE + 30 THEN 'por_vencer'
      WHEN m.cantidad_disponible <= COALESCE(m.stock_minimo, 10) THEN 'stock_bajo'
      ELSE 'ok' END AS estado_inventario,
    (SELECT COUNT(*) FROM medicamentos_pacientes mp WHERE mp.medicamento_id = m.id AND mp.activo) AS residentes_asignados
  FROM medicamentos m`;

export class MedicamentoModel {
  static async getAll({ q, estado, incluir_inactivos } = {}) {
    const v = [];
    const w = [];
    if (incluir_inactivos !== 'true') w.push('m.activo = true');
    if (q) { v.push(`%${q}%`); w.push(`(m.nombre ILIKE $${v.length} OR m.descripcion ILIKE $${v.length} OR m.lote ILIKE $${v.length} OR m.proveedor ILIKE $${v.length})`); }
    const { rows } = await pool.query(`${BASE} ${w.length ? 'WHERE ' + w.join(' AND ') : ''} ORDER BY m.nombre`, v);
    return estado ? rows.filter((r) => (estado === 'alerta' ? r.estado_inventario !== 'ok' : r.estado_inventario === estado)) : rows;
  }

  static async findById(id, db = pool) {
    const { rows } = await db.query(`${BASE} WHERE m.id = $1`, [id]);
    return rows[0];
  }

  static async create(d, usuarioId) {
    return conTransaccion(async (c) => {
      const { rows } = await c.query(
        `INSERT INTO medicamentos (nombre, descripcion, presentacion, dosis, via_administracion, cantidad_disponible, fecha_caducidad, lote, proveedor, stock_minimo)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING id`,
        [d.nombre, d.descripcion, d.presentacion, d.dosis, d.via_administracion, d.cantidad_disponible ?? 0, d.fecha_caducidad, d.lote, d.proveedor, d.stock_minimo ?? 10]
      );
      if ((d.cantidad_disponible ?? 0) > 0) {
        await c.query(`INSERT INTO movimientos_inventario (medicamento_id, usuario_id, tipo, cantidad, stock_resultante, motivo) VALUES ($1, $2, 'entrada', $3, $3, 'Registro inicial')`,
          [rows[0].id, usuarioId, d.cantidad_disponible]);
      }
      return this.findById(rows[0].id, c);
    });
  }

  static async update(id, d) {
    const CAMPOS = ['nombre', 'descripcion', 'presentacion', 'dosis', 'via_administracion', 'fecha_caducidad', 'lote', 'proveedor', 'stock_minimo'];
    const sets = [];
    const v = [];
    for (const c of CAMPOS) if (d[c] !== undefined) { v.push(d[c]); sets.push(`${c} = $${v.length}`); }
    if (sets.length) {
      v.push(id);
      await pool.query(`UPDATE medicamentos SET ${sets.join(', ')}, fecha_actualizacion = NOW() WHERE id = $${v.length}`, v);
    }
    return this.findById(id);
  }

  /** Movimiento de stock transaccional: entrada, salida o ajuste (fija el stock a un valor exacto). */
  static async moverStock(id, { tipo, cantidad, motivo }, usuarioId) {
    return conTransaccion(async (c) => {
      const { rows } = await c.query('SELECT cantidad_disponible FROM medicamentos WHERE id = $1 AND activo = true FOR UPDATE', [id]);
      if (!rows[0]) return { error: 'No encontrado' };
      const actual = rows[0].cantidad_disponible;
      let nuevo;
      let delta;
      if (tipo === 'entrada') { delta = cantidad; nuevo = actual + cantidad; }
      else if (tipo === 'salida') { delta = -cantidad; nuevo = actual - cantidad; }
      else { nuevo = cantidad; delta = cantidad - actual; }
      if (nuevo < 0) return { error: `Stock insuficiente: hay ${actual} unidades y se intentan retirar ${cantidad}` };
      await c.query('UPDATE medicamentos SET cantidad_disponible = $2, fecha_actualizacion = NOW() WHERE id = $1', [id, nuevo]);
      await c.query(
        `INSERT INTO movimientos_inventario (medicamento_id, usuario_id, tipo, cantidad, stock_resultante, motivo) VALUES ($1, $2, $3, $4, $5, $6)`,
        [id, usuarioId, tipo, delta, nuevo, motivo || null]);
      return { anterior: actual, nuevo, medicamento: await this.findById(id, c) };
    });
  }

  static async movimientos(id, limite = 50) {
    const { rows } = await pool.query(
      `SELECT mi.*, u.nombre AS usuario_nombre, u.apellido AS usuario_apellido FROM movimientos_inventario mi
       LEFT JOIN usuarios u ON u.id = mi.usuario_id WHERE mi.medicamento_id = $1 ORDER BY mi.fecha DESC, mi.id DESC LIMIT $2`, [id, limite]);
    return rows;
  }

  static async residentes(id) {
    const { rows } = await pool.query(
      `SELECT mp.id AS prescripcion_id, mp.dosis_prescrita, mp.frecuencia, mp.horarios, p.id AS paciente_id, p.nombre, p.apellido, p.habitacion
       FROM medicamentos_pacientes mp JOIN pacientes p ON p.id = mp.paciente_id AND p.activo
       WHERE mp.medicamento_id = $1 AND mp.activo ORDER BY p.nombre`, [id]);
    return rows;
  }

  static async desactivar(id) {
    await pool.query('UPDATE medicamentos SET activo = false, fecha_actualizacion = NOW() WHERE id = $1', [id]);
  }
}
