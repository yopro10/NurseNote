import express from 'express';
import { MedicamentoController } from '../controllers/medicamentoController.js';
import { authenticateToken, isEnfermeraOrAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(authenticateToken);

// Rutas para gestión de medicamentos (rutas específicas primero)
router.post('/', isEnfermeraOrAdmin, MedicamentoController.create);
router.get('/', isEnfermeraOrAdmin, MedicamentoController.getAll);
router.get('/alertas', isEnfermeraOrAdmin, MedicamentoController.getAlertas);
router.get('/proximos-vencer', isEnfermeraOrAdmin, MedicamentoController.getProximosVencer);
router.get('/vencidos', isEnfermeraOrAdmin, MedicamentoController.getVencidos);
router.get('/bajo-stock', isEnfermeraOrAdmin, MedicamentoController.getBajoStock);

// Rutas para asignación de medicamentos a pacientes
router.post('/asignar', isEnfermeraOrAdmin, MedicamentoController.asignarAPaciente);
router.get('/paciente/:pacienteId', isEnfermeraOrAdmin, MedicamentoController.getMedicamentosPaciente);
router.get('/medicamento/:medicamentoId/pacientes', isEnfermeraOrAdmin, MedicamentoController.getPacientesMedicamento);
router.put('/asignacion/:id', isEnfermeraOrAdmin, MedicamentoController.actualizarAsignacion);
router.delete('/asignacion/:id', isEnfermeraOrAdmin, MedicamentoController.eliminarAsignacion);

// Rutas con parámetros (deben ir al final)
router.get('/:id', isEnfermeraOrAdmin, MedicamentoController.getById);
router.put('/:id', isEnfermeraOrAdmin, MedicamentoController.update);
router.delete('/:id', isEnfermeraOrAdmin, MedicamentoController.delete);
router.patch('/:id/cantidad', isEnfermeraOrAdmin, MedicamentoController.actualizarCantidad);

export default router;