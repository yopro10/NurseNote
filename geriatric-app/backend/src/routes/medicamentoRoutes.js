import express from 'express';
import { MedicamentoController as C } from '../controllers/medicamentoController.js';
import { authenticateToken, isGestor, isPersonal } from '../middleware/authMiddleware.js';

const router = express.Router();
router.use(authenticateToken);
router.get('/', isPersonal, C.getAll);
router.post('/', isGestor, C.create);
router.get('/:id', isPersonal, C.getById);
router.put('/:id', isGestor, C.update);
router.post('/:id/stock', isGestor, C.moverStock);
router.delete('/:id', isGestor, C.delete);
export default router;
