import express from 'express';
import { AdministracionController as C } from '../controllers/administracionController.js';
import { authenticateToken, isPersonal } from '../middleware/authMiddleware.js';

const router = express.Router();
router.use(authenticateToken, isPersonal);
router.get('/pendientes', C.pendientes);
router.get('/', C.listar);
router.post('/directa', C.directa);
router.post('/:id/administrar', C.administrar);
router.post('/:id/omitir', C.omitir);
export default router;
