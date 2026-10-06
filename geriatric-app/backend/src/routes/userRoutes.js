import express from 'express';
import { UserController } from '../controllers/userController.js';
import { authenticateToken, isAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(authenticateToken);

// Solo administradores pueden gestionar usuarios
router.get('/', isAdmin, UserController.getAll);
router.get('/:id', isAdmin, UserController.getById);
router.put('/:id', isAdmin, UserController.update);
router.delete('/:id', isAdmin, UserController.delete);

export default router;