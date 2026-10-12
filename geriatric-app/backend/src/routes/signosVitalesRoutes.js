import express from 'express';
import { SignosVitalesController as C } from '../controllers/signosVitalesController.js';
import { authenticateToken, isPersonal } from '../middleware/authMiddleware.js';

const router = express.Router();
router.use(authenticateToken, isPersonal);
router.get('/resumen', C.resumen);
router.post('/', C.create);
router.get('/paciente/:pacienteId', C.getByPaciente);
router.get('/paciente/:pacienteId/ultimos', C.getUltimos);
router.get('/paciente/:pacienteId/alertas', C.getAlertas);
router.get('/paciente/:pacienteId/tendencias', C.getTendencias);
router.get('/:id', C.getById);
router.put('/:id', C.update);
router.delete('/:id', C.delete);
export default router;
