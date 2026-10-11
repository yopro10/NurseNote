import express from 'express';
import { UserController } from '../controllers/userController.js';
import { authenticateToken, isAdmin } from '../middleware/authMiddleware.js';
import { auditLog, captureBeforeData } from '../middleware/auditMiddleware.js';

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(authenticateToken);

// Solo administradores pueden gestionar usuarios
router.post('/', isAdmin, auditLog('crear', 'usuarios'), UserController.create);
router.get('/', isAdmin, UserController.getAll);
router.get('/:id', isAdmin, UserController.getById);
router.put('/:id', isAdmin, captureBeforeData, auditLog('actualizar', 'usuarios'), UserController.update);
router.delete('/:id', isAdmin, auditLog('desactivar', 'usuarios'), UserController.delete);
router.post('/:id/reactivate', isAdmin, auditLog('reactivar', 'usuarios'), UserController.reactivate);
router.post('/:id/reset-password', isAdmin, auditLog('actualizar', 'usuarios'), UserController.resetPassword);

export default router;