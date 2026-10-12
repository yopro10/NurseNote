import express from 'express';
import { PacienteController as C } from '../controllers/pacienteController.js';
import { authenticateToken, isGestor, isPersonal } from '../middleware/authMiddleware.js';

const router = express.Router();
router.use(authenticateToken);
router.get('/', isPersonal, C.getAll);
router.post('/', isGestor, C.create);
router.get('/:id', isPersonal, C.getById);
router.put('/:id', isGestor, C.update);
router.delete('/:id', isGestor, C.egresar);
router.post('/:id/reingresar', isGestor, C.reingresar);
router.get('/:id/estado/historial', isPersonal, C.historialEstado);
router.post('/:id/estado', isGestor, C.cambiarEstado);
export default router;
