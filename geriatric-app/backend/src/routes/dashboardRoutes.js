import express from 'express';
import { DashboardController } from '../controllers/dashboardController.js';
import { authenticateToken, isPersonal } from '../middleware/authMiddleware.js';

const router = express.Router();
router.use(authenticateToken, isPersonal);
router.get('/resumen', DashboardController.resumen);
export default router;
