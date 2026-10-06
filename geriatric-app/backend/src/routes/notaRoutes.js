import express from 'express';
import { NotaController } from '../controllers/notaController.js';
import { authenticateToken, isEnfermeraOrAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(authenticateToken);

// Rutas para notas de enfermería
router.post('/', isEnfermeraOrAdmin, NotaController.create);
router.get('/', isEnfermeraOrAdmin, NotaController.getAll);
router.get('/paciente/:pacienteId', isEnfermeraOrAdmin, NotaController.getByPaciente);
router.get('/paciente/:pacienteId/ultimas', isEnfermeraOrAdmin, NotaController.getUltimasNotas);
router.get('/:id', isEnfermeraOrAdmin, NotaController.getById);
router.put('/:id', isEnfermeraOrAdmin, NotaController.update);
router.delete('/:id', isEnfermeraOrAdmin, NotaController.delete);

export default router;