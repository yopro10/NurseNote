import express from 'express';
import { UserController } from '../controllers/userController.js';
import { authenticateToken, isAdmin, isGestor, isPersonal } from '../middleware/authMiddleware.js';

const router = express.Router();
router.use(authenticateToken);
router.get('/directorio', isPersonal, UserController.directorio); // para elegir quién recibe un turno
router.get('/', isGestor, UserController.getAll);
router.get('/:id', isGestor, UserController.getById);
router.post('/', isAdmin, UserController.create);
router.put('/:id', isAdmin, UserController.update);
router.delete('/:id', isAdmin, UserController.delete);
router.post('/:id/reactivate', isAdmin, UserController.reactivate);
router.post('/:id/reset-password', isAdmin, UserController.resetPassword);
export default router;
