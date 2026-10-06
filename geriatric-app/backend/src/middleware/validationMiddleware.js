import { body, param, validationResult } from 'express-validator';

export const validatePacienteCreate = [
  body('nombre').trim().notEmpty().withMessage('El nombre es requerido')
    .isLength({ min: 2, max: 100 }).withMessage('El nombre debe tener entre 2 y 100 caracteres'),
  body('apellido').trim().notEmpty().withMessage('El apellido es requerido')
    .isLength({ min: 2, max: 100 }).withMessage('El apellido debe tener entre 2 y 100 caracteres'),
  body('fecha_nacimiento').optional().isISO8601().withMessage('Fecha de nacimiento inválida'),
  body('genero').optional().isIn(['masculino', 'femenino', 'otro']).withMessage('Género inválido'),
  body('habitacion').optional().trim().isLength({ max: 20 }).withMessage('Habitación inválida'),
  body('telefono').optional().trim().isLength({ max: 20 }).withMessage('Teléfono inválido'),
  body('alergias').optional().trim(),
  body('enfermedades_cronicas').optional().trim(),
];

export const validatePacienteUpdate = [
  param('id').isInt().withMessage('ID inválido'),
  body('nombre').optional().trim().notEmpty().withMessage('El nombre es requerido')
    .isLength({ min: 2, max: 100 }).withMessage('El nombre debe tener entre 2 y 100 caracteres'),
  body('apellido').optional().trim().notEmpty().withMessage('El apellido es requerido')
    .isLength({ min: 2, max: 100 }).withMessage('El apellido debe tener entre 2 y 100 caracteres'),
  body('fecha_nacimiento').optional().isISO8601().withMessage('Fecha de nacimiento inválida'),
  body('genero').optional().isIn(['masculino', 'femenino', 'otro']).withMessage('Género inválido'),
  body('habitacion').optional().trim().isLength({ max: 20 }).withMessage('Habitación inválida'),
];

export const validateNotaCreate = [
  body('paciente_id').isInt().withMessage('ID de paciente inválido'),
  body('tipo_nota').isIn(['ingreso', 'evolucion', 'egreso', 'medicacion', 'signos_vitales', 'observacion'])
    .withMessage('Tipo de nota inválido'),
  body('contenido').optional().trim(),
  body('observaciones').optional().trim(),
];

export const validateMedicamentoCreate = [
  body('nombre').trim().notEmpty().withMessage('El nombre es requerido')
    .isLength({ min: 2, max: 200 }).withMessage('El nombre debe tener entre 2 y 200 caracteres'),
  body('fecha_caducidad').isISO8601().withMessage('Fecha de caducidad inválida'),
  body('cantidad_disponible').optional().isInt({ min: 0 }).withMessage('Cantidad inválida'),
];

export const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validación fallida',
      detalles: errors.array().map(err => ({
        campo: err.path,
        mensaje: err.msg
      }))
    });
  }
  next();
};
