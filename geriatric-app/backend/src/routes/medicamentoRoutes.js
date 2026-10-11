import express from 'express';
import { MedicamentoController } from '../controllers/medicamentoController.js';
import { authenticateToken, isEnfermeraOrAdmin } from '../middleware/authMiddleware.js';
import { auditLog, captureBeforeData } from '../middleware/auditMiddleware.js';

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(authenticateToken);

// Rutas para gestión de medicamentos (rutas específicas primero)
router.post('/', isEnfermeraOrAdmin, auditLog('crear', 'medicamentos'), MedicamentoController.create);
router.get('/', isEnfermeraOrAdmin, MedicamentoController.getAll);
router.get('/alertas', isEnfermeraOrAdmin, MedicamentoController.getAlertas);
router.get('/proximos-vencer', isEnfermeraOrAdmin, MedicamentoController.getProximosVencer);
router.get('/vencidos', isEnfermeraOrAdmin, MedicamentoController.getVencidos);
router.get('/bajo-stock', isEnfermeraOrAdmin, MedicamentoController.getBajoStock);

// Rutas para asignación de medicamentos a pacientes
router.post('/asignar', isEnfermeraOrAdmin, auditLog('crear', 'medicamentos_pacientes'), MedicamentoController.asignarAPaciente);
router.get('/paciente/:pacienteId', isEnfermeraOrAdmin, MedicamentoController.getMedicamentosPaciente);
router.get('/medicamento/:medicamentoId/pacientes', isEnfermeraOrAdmin, MedicamentoController.getPacientesMedicamento);
router.put('/asignacion/:id', isEnfermeraOrAdmin, captureBeforeData, auditLog('actualizar', 'medicamentos_pacientes'), MedicamentoController.actualizarAsignacion);
router.delete('/asignacion/:id', isEnfermeraOrAdmin, auditLog('desactivar', 'medicamentos_pacientes'), MedicamentoController.eliminarAsignacion);

// Rutas con parámetros (deben ir al final)
router.get('/:id', isEnfermeraOrAdmin, MedicamentoController.getById);
router.put('/:id', isEnfermeraOrAdmin, captureBeforeData, auditLog('actualizar', 'medicamentos'), MedicamentoController.update);
router.delete('/:id', isEnfermeraOrAdmin, auditLog('desactivar', 'medicamentos'), MedicamentoController.delete);
router.patch('/:id/cantidad', isEnfermeraOrAdmin, auditLog('actualizar', 'medicamentos'), MedicamentoController.actualizarCantidad);
router.patch('/:id/ajustar-stock', isEnfermeraOrAdmin, auditLog('actualizar', 'medicamentos'), MedicamentoController.ajustarStock);

export default router;