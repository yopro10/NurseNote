import express from 'express';
import { EstadisticasController } from '../controllers/estadisticasController.js';
import { authenticateToken, isPersonal } from '../middleware/authMiddleware.js';

const router = express.Router();
router.use(authenticateToken, isPersonal);
router.get('/', EstadisticasController.get);
export default router;
