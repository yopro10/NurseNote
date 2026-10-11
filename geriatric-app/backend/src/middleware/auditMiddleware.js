import pool from '../config/database.js';

export const auditLog = (accion, tabla_afectada) => {
  return async (req, res, next) => {
    const originalSend = res.send;

    res.send = function(data) {
      // Solo auditar si la operación fue exitosa
      if (res.statusCode >= 200 && res.statusCode < 300) {
        const auditData = {
          usuario_id: req.user?.id || null,
          accion: accion,
          tabla_afectada: tabla_afectada,
          registro_id: req.params.id || req.body.id || null,
          datos_anteriores: req.datosAnteriores || null,
          datos_nuevos: req.body || null,
          ip_address: req.ip || req.connection.remoteAddress,
          user_agent: req.get('user-agent') || null,
          fecha_accion: new Date()
        };

        // Guardar en auditoría de forma asíncrona (no bloquear la respuesta)
        pool.query(
          `INSERT INTO auditoria 
           (usuario_id, accion, tabla_afectada, registro_id, datos_anteriores, datos_nuevos, ip_address, user_agent, fecha_accion)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
          [
            auditData.usuario_id,
            auditData.accion,
            auditData.tabla_afectada,
            auditData.registro_id,
            auditData.datos_anteriores ? JSON.stringify(auditData.datos_anteriores) : null,
            auditData.datos_nuevos ? JSON.stringify(auditData.datos_nuevos) : null,
            auditData.ip_address,
            auditData.user_agent,
            auditData.fecha_accion
          ]
        ).catch(err => console.error('Error al guardar auditoría:', err));
      }

      originalSend.call(this, data);
    };

    next();
  };
};

// Middleware para capturar datos antes de la actualización
export const captureBeforeData = async (req, res, next) => {
  if (req.method === 'PUT' || req.method === 'PATCH') {
    try {
      const { id } = req.params;
      const tabla = req.route.path.split('/')[1]; // Obtiene la tabla de la ruta

      if (id && tabla) {
        const result = await pool.query(`SELECT * FROM ${tabla} WHERE id = $1`, [id]);
        if (result.rows.length > 0) {
          req.datosAnteriores = result.rows[0];
        }
      }
    } catch (err) {
      console.error('Error al capturar datos anteriores:', err);
    }
  }
  next();
};
