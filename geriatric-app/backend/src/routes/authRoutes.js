import express from 'express';
import { AuthController } from '../controllers/authController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';
import { auditLog } from '../middleware/auditMiddleware.js';

const router = express.Router();

// Rutas públicas
router.post('/register', AuthController.register);
router.post('/login', auditLog('login', 'auth'), AuthController.login);

// Rutas protegidas
router.get('/profile', authenticateToken, AuthController.getProfile);

export default router;