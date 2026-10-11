import express from 'express';
import { SignosVitalesController } from '../controllers/signosVitalesController.js';
import { authenticateToken, isEnfermeraOrAdmin } from '../middleware/authMiddleware.js';
import { auditLog, captureBeforeData } from '../middleware/auditMiddleware.js';

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(authenticateToken);

// Todas las rutas requieren rol de enfermera o superior
router.use(isEnfermeraOrAdmin);

// Crear signos vitales
router.post('/', auditLog('crear', 'signos_vitales'), SignosVitalesController.create);

// Obtener signos vitales por ID
router.get('/:id', SignosVitalesController.getById);

// Obtener signos vitales de un paciente
router.get('/paciente/:pacienteId', SignosVitalesController.getByPaciente);

// Obtener últimos signos vitales de un paciente
router.get('/paciente/:pacienteId/ultimos', SignosVitalesController.getUltimos);

// Obtener alertas de un paciente
router.get('/paciente/:pacienteId/alertas', SignosVitalesController.getAlertas);

// Obtener tendencias de un paciente
router.get('/paciente/:pacienteId/tendencias', SignosVitalesController.getTendencias);

// Actualizar signos vitales
router.put('/:id', captureBeforeData, auditLog('actualizar', 'signos_vitales'), SignosVitalesController.update);

// Eliminar signos vitales
router.delete('/:id', auditLog('eliminar', 'signos_vitales'), SignosVitalesController.delete);

export default router;
