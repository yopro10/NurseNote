import express from 'express';
import { DashboardController } from '../controllers/dashboardController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(authenticateToken);

// Obtener métricas del dashboard
router.get('/metricas', DashboardController.getMetricas);

// Obtener pacientes críticos
router.get('/criticos', DashboardController.getPacientesCriticos);

// Obtener medicamentos vencidos o próximos a vencer
router.get('/vencidos', DashboardController.getMedicamentosVencidos);

// Obtener administraciones pendientes
router.get('/pendientes', DashboardController.getAdministracionesPendientes);

export default router;
