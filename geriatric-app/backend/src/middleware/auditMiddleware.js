import pool from '../config/database.js';

const SENSIBLES = ['password', 'password_hash', 'newPassword', 'nueva_password'];

const limpiar = (obj) => {
  if (!obj || typeof obj !== 'object') return obj ?? null;
  const copia = Array.isArray(obj) ? [...obj] : { ...obj };
  for (const k of SENSIBLES) if (k in copia) copia[k] = '***';
  return copia;
};

/**
 * Registra una acción en la tabla de auditoría. Nunca lanza: una falla de auditoría
 * no debe romper la operación clínica. Acepta un `client` de transacción o el pool.
 */
export async function auditar(req, { accion, tabla, registroId = null, antes = null, despues = null, db = pool }) {
  try {
    await db.query(
      `INSERT INTO auditoria (usuario_id, accion, tabla_afectada, registro_id, datos_anteriores, datos_nuevos, ip_address, user_agent)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        req.user?.id ?? null,
        accion,
        tabla,
        registroId,
        antes ? JSON.stringify(limpiar(antes)) : null,
        despues ? JSON.stringify(limpiar(despues)) : null,
        (req.ip || '').slice(0, 45),
        req.get?.('user-agent') ?? null,
      ]
    );
  } catch (err) {
    console.error('Error al guardar auditoría:', err.message);
  }
}
