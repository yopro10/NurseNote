import express from 'express';
import { ReporteController } from '../controllers/reporteController.js';
import { authenticateToken, isPersonal } from '../middleware/authMiddleware.js';

const router = express.Router();
router.use(authenticateToken, isPersonal);
router.get('/:tipo', ReporteController.generar);
export default router;
