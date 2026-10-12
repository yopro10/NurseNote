import express from 'express';
import { TurnoController as C } from '../controllers/turnoController.js';
import { authenticateToken, isPersonal } from '../middleware/authMiddleware.js';

const router = express.Router();
router.use(authenticateToken, isPersonal);
router.get('/resumen', C.resumen);
router.get('/', C.listar);
router.post('/', C.crear);
router.get('/:id', C.getById);
router.post('/:id/confirmar', C.confirmar);
export default router;
