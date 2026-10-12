import express from 'express';
import { NotificacionController as C } from '../controllers/notificacionController.js';
import { authenticateToken, isPersonal } from '../middleware/authMiddleware.js';

const router = express.Router();
router.use(authenticateToken, isPersonal);
router.get('/', C.listar);
router.post('/leer', C.leer);
export default router;
