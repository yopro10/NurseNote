import express from 'express';
import { authenticateToken } from '../middleware/authMiddleware.js';
import pool from '../config/database.js';

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(authenticateToken);

// Obtener métricas del dashboard
router.get('/dashboard', async (req, res) => {
  try {
    const [
      pacientesResult,
      notasResult,
      medicamentosResult
    ] = await Promise.all([
      pool.query('SELECT COUNT(*) as total FROM pacientes WHERE activo = true'),
      pool.query('SELECT COUNT(*) as total FROM notas_enfermeria WHERE DATE(fecha_registro) = CURRENT_DATE'),
      pool.query(`
        SELECT
          COUNT(*) FILTER (WHERE fecha_caducidad <= CURRENT_DATE) as vencidos,
          COUNT(*) FILTER (WHERE cantidad_disponible <= 10) as bajo_stock
        FROM medicamentos
        WHERE activo = true
      `)
    ]);

    const totalPacientes = parseInt(pacientesResult.rows[0].total);
    const registrosHoy = parseInt(notasResult.rows[0].total);

    // Calcular pacientes en observación y críticos basado en condiciones
    const condicionesResult = await pool.query(`
      SELECT
        COUNT(*) FILTER (
          WHERE enfermedades_cronicas ILIKE '%demencia%'
          OR enfermedades_cronicas ILIKE '%diabetes%'
          OR enfermedades_cronicas ILIKE '%hipertensión%'
        ) as en_observacion,
        COUNT(*) FILTER (
          WHERE enfermedades_cronicas ILIKE '%cardíaca%'
          OR enfermedades_cronicas ILIKE '%grave%'
          OR enfermedades_cronicas ILIKE '%crítico%'
        ) as criticos
      FROM pacientes
      WHERE activo = true
    `);

    const metricas = {
      totalPacientes,
      pacientesEnObservacion: parseInt(condicionesResult.rows[0].en_observacion) || 0,
      pacientesCriticos: parseInt(condicionesResult.rows[0].criticos) || 0,
      registrosHoy,
      medicamentosVencidos: parseInt(medicamentosResult.rows[0].vencidos) || 0,
      medicamentosBajoStock: parseInt(medicamentosResult.rows[0].bajo_stock) || 0,
    };

    res.json(metricas);
  } catch (error) {
    console.error('Error al obtener métricas:', error);
    res.status(500).json({ error: 'Error al obtener métricas' });
  }
});

// Obtener estadísticas generales
router.get('/estadisticas', async (req, res) => {
  try {
    const [pacientesStats, usuariosStats, notasStats] = await Promise.all([
      pool.query(`
        SELECT
          COUNT(*) as total,
          COUNT(*) FILTER (WHERE alergias IS NOT NULL AND alergias != '') as con_alergias,
          COUNT(*) FILTER (WHERE enfermedades_cronicas IS NOT NULL AND enfermedades_cronicas != '') as con_condiciones
        FROM pacientes
        WHERE activo = true
      `),
      pool.query(`
        SELECT
          COUNT(*) as total,
          COUNT(*) FILTER (WHERE rol = 'enfermera') as enfermeras,
          COUNT(*) FILTER (WHERE rol = 'jefe_enfermeria') as jefes,
          COUNT(*) FILTER (WHERE rol = 'administrador') as administradores
        FROM usuarios
        WHERE activo = true
      `),
      pool.query(`
        SELECT
          COUNT(*) as total,
          COUNT(*) FILTER (WHERE DATE(fecha_registro) = CURRENT_DATE) as hoy,
          COUNT(*) FILTER (WHERE DATE(fecha_registro) = CURRENT_DATE - INTERVAL '7 days') as ultima_semana
        FROM notas_enfermeria
      `)
    ]);

    res.json({
      pacientes: pacientesStats.rows[0],
      usuarios: usuariosStats.rows[0],
      notas: notasStats.rows[0]
    });
  } catch (error) {
    console.error('Error al obtener estadísticas:', error);
    res.status(500).json({ error: 'Error al obtener estadísticas' });
  }
});

export default router;
