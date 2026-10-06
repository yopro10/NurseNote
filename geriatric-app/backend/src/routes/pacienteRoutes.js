import express from 'express';
import { PacienteController } from '../controllers/pacienteController.js';
import { authenticateToken, isEnfermeraOrAdmin } from '../middleware/authMiddleware.js';
import { validatePacienteCreate, validatePacienteUpdate, handleValidationErrors } from '../middleware/validationMiddleware.js';

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(authenticateToken);

// Rutas para enfermeras y administradores
router.post('/', isEnfermeraOrAdmin, validatePacienteCreate, handleValidationErrors, PacienteController.create);
router.get('/', isEnfermeraOrAdmin, PacienteController.getAll);
router.get('/:id', isEnfermeraOrAdmin, PacienteController.getById);
router.put('/:id', isEnfermeraOrAdmin, validatePacienteUpdate, handleValidationErrors, PacienteController.update);
router.delete('/:id', isEnfermeraOrAdmin, PacienteController.delete);
router.get('/habitacion/:habitacion', isEnfermeraOrAdmin, PacienteController.getByHabitacion);
router.get('/:id/historial', isEnfermeraOrAdmin, PacienteController.getHistorial);

export default router;