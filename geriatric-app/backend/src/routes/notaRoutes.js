import express from 'express';
import { NotaController } from '../controllers/notaController.js';
import { authenticateToken, isEnfermeraOrAdmin } from '../middleware/authMiddleware.js';
import { auditLog, captureBeforeData } from '../middleware/auditMiddleware.js';

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(authenticateToken);

// Rutas para notas de enfermería
router.post('/', isEnfermeraOrAdmin, auditLog('crear', 'notas_enfermeria'), NotaController.create);
router.get('/', isEnfermeraOrAdmin, NotaController.getAll);
router.get('/paciente/:pacienteId', isEnfermeraOrAdmin, NotaController.getByPaciente);
router.get('/paciente/:pacienteId/ultimas', isEnfermeraOrAdmin, NotaController.getUltimasNotas);
router.get('/:id', isEnfermeraOrAdmin, NotaController.getById);
router.put('/:id', isEnfermeraOrAdmin, captureBeforeData, auditLog('actualizar', 'notas_enfermeria'), NotaController.update);
router.delete('/:id', isEnfermeraOrAdmin, auditLog('eliminar', 'notas_enfermeria'), NotaController.delete);

export default router;