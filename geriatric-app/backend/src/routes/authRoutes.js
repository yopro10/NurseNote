import express from 'express';
import { AuthController } from '../controllers/authController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = express.Router();
router.post('/register', AuthController.register); // cerrado: responde 403
router.post('/login', AuthController.login);
router.get('/profile', authenticateToken, AuthController.getProfile);
router.post('/logout', authenticateToken, AuthController.logout);
export default router;
