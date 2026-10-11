import pool from '../config/database.js';

export class DashboardController {
  static async getMetricas(req, res) {
    try {
      // Pacientes críticos
      const criticosResult = await pool.query(`
        SELECT COUNT(*) as count
        FROM pacientes
        WHERE estado_calculado = 'Crítico' AND activo = true
      `);

      // Pacientes en observación
      const observacionResult = await pool.query(`
        SELECT COUNT(*) as count
        FROM pacientes
        WHERE estado_calculado = 'En Observación' AND activo = true
      `);

      // Pacientes estables
      const establesResult = await pool.query(`
        SELECT COUNT(*) as count
        FROM pacientes
        WHERE estado_calculado = 'Estable' AND activo = true
      `);

      // Total pacientes
      const totalPacientesResult = await pool.query(`
        SELECT COUNT(*) as count
        FROM pacientes
        WHERE activo = true
      `);

      // Alertas de medicamentos vencidos
      const vencidosResult = await pool.query(`
        SELECT COUNT(*) as count
        FROM alertas_medicamentos
        WHERE tipo_alerta = 'vencido' AND leida = false
      `);

      // Alertas de medicamentos próximos a vencer
      const proximosVencerResult = await pool.query(`
        SELECT COUNT(*) as count
        FROM alertas_medicamentos
        WHERE tipo_alerta = 'caducidad_proxima' AND leida = false
      `);

      // Alertas de stock bajo
      const stockBajoResult = await pool.query(`
        SELECT COUNT(*) as count
        FROM alertas_medicamentos
        WHERE tipo_alerta = 'stock_bajo' AND leida = false
      `);

      // Medicamentos pendientes de administración (últimas 24 horas)
      const pendientesResult = await pool.query(`
        SELECT COUNT(*) as count
        FROM administraciones_medicamentos
        WHERE estado = 'programada'
        AND horario_programado >= NOW() - INTERVAL '24 hours'
        AND horario_programado <= NOW() + INTERVAL '24 hours'
      `);

      // Administraciones omitidas hoy
      const omitidasResult = await pool.query(`
        SELECT COUNT(*) as count
        FROM administraciones_medicamentos
        WHERE estado = 'omitida'
        AND horario_programado >= CURRENT_DATE
        AND horario_programado < CURRENT_DATE + INTERVAL '1 day'
      `);

      // Notas de enfermería hoy
      const notasHoyResult = await pool.query(`
        SELECT COUNT(*) as count
        FROM notas_enfermeria
        WHERE DATE(fecha_registro) = CURRENT_DATE
      `);

      // Signos vitales registrados hoy
      const signosHoyResult = await pool.query(`
        SELECT COUNT(*) as count
        FROM signos_vitales
        WHERE DATE(fecha_registro) = CURRENT_DATE
      `);

      // Pacientes con alertas activas de signos vitales
      const pacientesAlertasResult = await pool.query(`
        SELECT COUNT(DISTINCT paciente_id) as count
        FROM signos_vitales
        WHERE (
          saturacion_oxigeno < 95
          OR presion_sistolica > 140 OR presion_diastolica > 90
          OR presion_sistolica < 90 OR presion_diastolica < 60
          OR temperatura > 38 OR temperatura < 36
          OR frecuencia_cardiaca > 100 OR frecuencia_cardiaca < 60
        )
        AND fecha_registro >= NOW() - INTERVAL '24 hours'
      `);

      const metricas = {
        pacientes: {
          criticos: parseInt(criticosResult.rows[0].count),
          observacion: parseInt(observacionResult.rows[0].count),
          estables: parseInt(establesResult.rows[0].count),
          total: parseInt(totalPacientesResult.rows[0].count)
        },
        medicamentos: {
          vencidos: parseInt(vencidosResult.rows[0].count),
          proximos_vencer: parseInt(proximosVencerResult.rows[0].count),
          stock_bajo: parseInt(stockBajoResult.rows[0].count)
        },
        administraciones: {
          pendientes: parseInt(pendientesResult.rows[0].count),
          omitidas: parseInt(omitidasResult.rows[0].count)
        },
        hoy: {
          notas: parseInt(notasHoyResult.rows[0].count),
          signos: parseInt(signosHoyResult.rows[0].count)
        },
        alertas_activas: parseInt(pacientesAlertasResult.rows[0].count)
      };

      res.json(metricas);
    } catch (error) {
      console.error('Error al obtener métricas:', error);
      res.status(500).json({ error: 'Error al obtener métricas' });
    }
  }

  static async getPacientesCriticos(req, res) {
    try {
      const result = await pool.query(`
        SELECT p.*, u.nombre as ultimo_usuario
        FROM pacientes p
        LEFT JOIN signos_vitales sv ON p.id = sv.paciente_id
        LEFT JOIN usuarios u ON sv.usuario_id = u.id
        WHERE p.estado_calculado = 'Crítico'
        AND p.activo = true
        ORDER BY sv.fecha_registro DESC NULLS LAST
        LIMIT 10
      `);

      res.json(result.rows);
    } catch (error) {
      console.error('Error al obtener pacientes críticos:', error);
      res.status(500).json({ error: 'Error al obtener pacientes críticos' });
    }
  }

  static async getMedicamentosVencidos(req, res) {
    try {
      const result = await pool.query(`
        SELECT m.*, am.mensaje, am.fecha_alerta
        FROM medicamentos m
        JOIN alertas_medicamentos am ON m.id = am.medicamento_id
        WHERE am.tipo_alerta IN ('vencido', 'caducidad_proxima')
        AND am.leida = false
        AND m.activo = true
        ORDER BY m.fecha_caducidad ASC
        LIMIT 10
      `);

      res.json(result.rows);
    } catch (error) {
      console.error('Error al obtener medicamentos vencidos:', error);
      res.status(500).json({ error: 'Error al obtener medicamentos vencidos' });
    }
  }

  static async getAdministracionesPendientes(req, res) {
    try {
      const result = await pool.query(`
        SELECT am.*, p.nombre as paciente_nombre, p.apellido as paciente_apellido,
               p.habitacion, m.nombre as medicamento_nombre
        FROM administraciones_medicamentos am
        JOIN pacientes p ON am.paciente_id = p.id
        JOIN medicamentos m ON am.medicamento_id = m.id
        WHERE am.estado = 'programada'
        AND am.horario_programado >= NOW()
        AND am.horario_programado <= NOW() + INTERVAL '24 hours'
        ORDER BY am.horario_programado ASC
        LIMIT 20
      `);

      res.json(result.rows);
    } catch (error) {
      console.error('Error al obtener administraciones pendientes:', error);
      res.status(500).json({ error: 'Error al obtener administraciones pendientes' });
    }
  }
}
