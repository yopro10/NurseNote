import express from 'express';
import { NotaController as C } from '../controllers/notaController.js';
import { authenticateToken, isPersonal } from '../middleware/authMiddleware.js';

const router = express.Router();
router.use(authenticateToken, isPersonal);
router.get('/', C.listar);
router.post('/', C.create);
router.get('/:id', C.getById);
router.put('/:id', C.update);
router.post('/:id/anular', C.anular);
export default router;
