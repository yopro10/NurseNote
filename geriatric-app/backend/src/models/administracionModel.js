import pool, { conTransaccion } from '../config/database.js';

const SELECT = `
  SELECT a.*, m.nombre AS medicamento_nombre, m.presentacion, m.cantidad_disponible AS stock, m.fecha_caducidad,
         p.nombre AS paciente_nombre, p.apellido AS paciente_apellido, p.habitacion, p.alergias AS paciente_alergias,
         mp.frecuencia, mp.via_administracion, mp.unidades_por_dosis, mp.observaciones AS indicaciones,
         u.nombre AS usuario_nombre, u.apellido AS usuario_apellido,
         (a.estado = 'programada' AND a.horario_programado < NOW() - INTERVAL '60 minutes') AS atrasada
  FROM administraciones_medicamentos a
  JOIN medicamentos m ON m.id = a.medicamento_id
  JOIN pacientes p ON p.id = a.paciente_id
  LEFT JOIN medicamentos_pacientes mp ON mp.id = a.medicamento_paciente_id
  LEFT JOIN usuarios u ON u.id = a.usuario_id`;

export class AdministracionModel {
  static async pendientes({ pacienteId, fecha }) {
    const v = [fecha];
    let extra = '';
    if (pacienteId) { v.push(pacienteId); extra = ` AND a.paciente_id = $${v.length}`; }
    // Pendientes del día + las atrasadas de los dos días anteriores que nadie resolvió
    const { rows } = await pool.query(
      `${SELECT} WHERE a.estado = 'programada' AND p.activo
         AND a.horario_programado >= ($1::date - 2) AND a.horario_programado < ($1::date + 1) ${extra}
       ORDER BY a.horario_programado, p.nombre`, v);
    return rows;
  }

  static async listar(f, { limit, offset }) {
    const v = [];
    const w = [];
    if (f.paciente_id) { v.push(Number(f.paciente_id)); w.push(`a.paciente_id = $${v.length}`); }
    if (f.estado) { v.push(f.estado); w.push(`a.estado = $${v.length}`); }
    if (f.medicamento_id) { v.push(Number(f.medicamento_id)); w.push(`a.medicamento_id = $${v.length}`); }
    if (f.desde) { v.push(f.desde); w.push(`a.horario_programado >= $${v.length}::date`); }
    if (f.hasta) { v.push(f.hasta); w.push(`a.horario_programado < ($${v.length}::date + 1)`); }
    const where = w.length ? `WHERE ${w.join(' AND ')}` : '';
    const total = (await pool.query(`SELECT COUNT(*) AS n FROM administraciones_medicamentos a ${where}`, v)).rows[0].n;
    const { rows } = await pool.query(`${SELECT} ${where} ORDER BY a.horario_programado DESC, a.id DESC LIMIT ${limit} OFFSET ${offset}`, v);
    return { data: rows, total };
  }

  static async findById(id, db = pool) {
    const { rows } = await db.query(`${SELECT} WHERE a.id = $1`, [id]);
    return rows[0];
  }

  /**
   * Registra una administración dentro de una transacción: bloquea la fila de la dosis y del medicamento,
   * valida vigencia y stock, descuenta unidades y deja el movimiento de inventario.
   */
  static async administrar(id, usuarioId, { observaciones }) {
    return conTransaccion(async (c) => {
      const { rows } = await c.query('SELECT * FROM administraciones_medicamentos WHERE id = $1 FOR UPDATE', [id]);
      const adm = rows[0];
      if (!adm) return { error: 404, mensaje: 'Administración no encontrada' };
      if (adm.estado !== 'programada') return { error: 409, mensaje: `Esta dosis ya fue registrada como "${adm.estado}"` };
      const unidades = (await c.query('SELECT COALESCE(unidades_por_dosis, 1) AS u FROM medicamentos_pacientes WHERE id = $1', [adm.medicamento_paciente_id])).rows[0]?.u ?? 1;
      return this._descontarYMarcar(c, adm, usuarioId, unidades, observaciones);
    });
  }

  /** Dosis extra o PRN (sin horario programado). Si algo falla, se revierte todo (no queda fila huérfana). */
  static async directa(prescripcionId, usuarioId, { observaciones }) {
    try {
      return await conTransaccion(async (c) => {
        const { rows: pr } = await c.query('SELECT * FROM medicamentos_pacientes WHERE id = $1 AND activo FOR UPDATE', [prescripcionId]);
        if (!pr[0]) throw { __resultado: { error: 404, mensaje: 'Prescripción activa no encontrada' } };
        const { rows } = await c.query(
          `INSERT INTO administraciones_medicamentos (paciente_id, medicamento_id, medicamento_paciente_id, estado, horario_programado, dosis_administrada)
           VALUES ($1, $2, $3, 'programada', NOW(), $4) RETURNING *`,
          [pr[0].paciente_id, pr[0].medicamento_id, pr[0].id, pr[0].dosis_prescrita]
        );
        const r = await this._descontarYMarcar(c, rows[0], usuarioId, pr[0].unidades_por_dosis ?? 1, observaciones);
        if (r.error) throw { __resultado: r };
        return r;
      });
    } catch (e) {
      if (e && e.__resultado) return e.__resultado;
      throw e;
    }
  }

  static async _descontarYMarcar(c, adm, usuarioId, unidades, observaciones) {
    const { rows: mr } = await c.query('SELECT * FROM medicamentos WHERE id = $1 FOR UPDATE', [adm.medicamento_id]);
    const med = mr[0];
    if (!med || !med.activo) return { error: 409, mensaje: 'El medicamento ya no está activo en el inventario' };
    if (med.fecha_caducidad <= new Date().toLocaleDateString('sv-SE')) return { error: 422, mensaje: `${med.nombre} está vencido (${med.fecha_caducidad}). No debe administrarse.` };
    if (med.cantidad_disponible < unidades) return { error: 409, mensaje: `Stock insuficiente de ${med.nombre}: quedan ${med.cantidad_disponible} y la dosis requiere ${unidades}.`, codigo: 'STOCK' };

    const nuevoStock = med.cantidad_disponible - unidades;
    await c.query('UPDATE medicamentos SET cantidad_disponible = $2, fecha_actualizacion = NOW() WHERE id = $1', [med.id, nuevoStock]);
    await c.query(
      `INSERT INTO movimientos_inventario (medicamento_id, usuario_id, tipo, cantidad, stock_resultante, motivo) VALUES ($1, $2, 'administracion', $3, $4, $5)`,
      [med.id, usuarioId, -unidades, nuevoStock, `Dosis administrada (residente #${adm.paciente_id})`]
    );
    await c.query(
      `UPDATE administraciones_medicamentos SET estado = 'administrada', usuario_id = $2, horario_administracion = NOW(),
         unidades_descontadas = $3, observaciones = $4 WHERE id = $1`,
      [adm.id, usuarioId, unidades, observaciones || null]
    );
    return { ok: true, medicamento: med, stockRestante: nuevoStock, stockMinimo: med.stock_minimo ?? 10, paciente_id: adm.paciente_id, id: adm.id, registro: await this.findById(adm.id, c) };
  }

  static async omitir(id, usuarioId, { motivo, estado }) {
    return conTransaccion(async (c) => {
      const { rows } = await c.query('SELECT * FROM administraciones_medicamentos WHERE id = $1 FOR UPDATE', [id]);
      if (!rows[0]) return { error: 404, mensaje: 'Administración no encontrada' };
      if (rows[0].estado !== 'programada') return { error: 409, mensaje: `Esta dosis ya fue registrada como "${rows[0].estado}"` };
      await c.query(
        `UPDATE administraciones_medicamentos SET estado = $2, motivo_omision = $3, usuario_id = $4, horario_administracion = NOW() WHERE id = $1`,
        [id, estado, motivo, usuarioId]);
      return { ok: true, paciente_id: rows[0].paciente_id, id, registro: await this.findById(id, c) };
    });
  }
}
