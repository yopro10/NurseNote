import express from 'express';
import { PacienteController } from '../controllers/pacienteController.js';
import { authenticateToken, isEnfermeraOrAdmin } from '../middleware/authMiddleware.js';
import { validatePacienteCreate, validatePacienteUpdate, handleValidationErrors } from '../middleware/validationMiddleware.js';
import { auditLog, captureBeforeData } from '../middleware/auditMiddleware.js';

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(authenticateToken);

// Rutas para enfermeras y administradores
router.post('/', isEnfermeraOrAdmin, auditLog('crear', 'pacientes'), validatePacienteCreate, handleValidationErrors, PacienteController.create);
router.get('/', isEnfermeraOrAdmin, PacienteController.getAll);
router.get('/:id', isEnfermeraOrAdmin, PacienteController.getById);
router.put('/:id', isEnfermeraOrAdmin, captureBeforeData, auditLog('actualizar', 'pacientes'), validatePacienteUpdate, handleValidationErrors, PacienteController.update);
router.delete('/:id', isEnfermeraOrAdmin, auditLog('desactivar', 'pacientes'), PacienteController.delete);
router.get('/habitacion/:habitacion', isEnfermeraOrAdmin, PacienteController.getByHabitacion);
router.get('/:id/historial', isEnfermeraOrAdmin, PacienteController.getHistorial);

export default router;