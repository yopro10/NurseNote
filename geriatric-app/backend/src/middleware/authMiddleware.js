import jwt from 'jsonwebtoken';

export const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ error: 'Token de autenticación requerido' });
  }

  jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key', (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Token inválido o expirado' });
    }

    req.user = user;
    next();
  });
};

export const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Usuario no autenticado' });
    }

    if (!roles.includes(req.user.rol)) {
      return res.status(403).json({ 
        error: 'No tienes permiso para acceder a este recurso',
        requiredRoles: roles,
        userRole: req.user.rol
      });
    }

    next();
  };
};

export const isAdmin = authorizeRoles('administrador');
export const isEnfermeraOrAdmin = authorizeRoles('enfermera', 'administrador', 'jefe_enfermeria');
export const isJefeEnfermeriaOrAdmin = authorizeRoles('jefe_enfermeria', 'administrador');