import express from 'express';
import { MedicamentoPacienteController } from '../controllers/medicamentoPacienteController.js';
import { authenticateToken, isEnfermeraOrAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(authenticateToken);

// Crear nueva asignación de medicamento a paciente
router.post('/', isEnfermeraOrAdmin, MedicamentoPacienteController.create);

// Obtener todas las asignaciones (con filtros opcionales)
router.get('/', isEnfermeraOrAdmin, MedicamentoPacienteController.getAll);

// Obtener asignación por ID
router.get('/:id', isEnfermeraOrAdmin, MedicamentoPacienteController.getById);

// Obtener medicamentos de un paciente específico
router.get('/paciente/:pacienteId', isEnfermeraOrAdmin, MedicamentoPacienteController.getByPaciente);

// Obtener pacientes que tienen un medicamento específico
router.get('/medicamento/:medicamentoId', isEnfermeraOrAdmin, MedicamentoPacienteController.getByMedicamento);

// Obtener medicamentos activos de un paciente
router.get('/paciente/:pacienteId/activos', isEnfermeraOrAdmin, MedicamentoPacienteController.getMedicamentosActivosPorPaciente);

// Obtener historial de medicamentos de un paciente
router.get('/paciente/:pacienteId/historial', isEnfermeraOrAdmin, MedicamentoPacienteController.getHistorialPorPaciente);

// Actualizar asignación
router.put('/:id', isEnfermeraOrAdmin, MedicamentoPacienteController.update);

// Desactivar asignación (soft delete)
router.delete('/:id', isEnfermeraOrAdmin, MedicamentoPacienteController.delete);

// Obtener estadísticas
router.get('/stats/overview', isEnfermeraOrAdmin, MedicamentoPacienteController.getEstadisticas);

export default router;
