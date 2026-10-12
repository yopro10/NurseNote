import express from 'express';
import { PrescripcionController as C } from '../controllers/prescripcionController.js';
import { authenticateToken, isGestor, isPersonal } from '../middleware/authMiddleware.js';

const router = express.Router();
router.use(authenticateToken);
router.get('/', isPersonal, C.listar);
router.post('/', isGestor, C.create);
router.get('/:id', isPersonal, C.getById);
router.put('/:id', isGestor, C.update);
router.post('/:id/suspender', isGestor, C.suspender);
export default router;
