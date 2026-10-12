import pkg from 'pg';
import { env } from './env.js';

const { Pool, types } = pkg;

// Fechas sin zona horaria: se devuelven como hora local "YYYY-MM-DDTHH:mm:ss.SSS" (sin "Z")
// para que navegador y servidor interpreten siempre la misma hora de pared.
types.setTypeParser(1114, (v) => (v ? v.replace(' ', 'T').replace(/(\.\d{3})\d+/, '$1') : v));
types.setTypeParser(1082, (v) => v); // DATE → "YYYY-MM-DD"
types.setTypeParser(20, (v) => parseInt(v, 10)); // COUNT(*) / BIGINT
types.setTypeParser(1700, (v) => parseFloat(v)); // NUMERIC

const pool = new Pool({ ...env.db, max: 20, idleTimeoutMillis: 30000, connectionTimeoutMillis: 5000 });

pool.on('error', (err) => console.error('Error inesperado en el pool de PostgreSQL:', err.message));

/** Ejecuta `fn(client)` dentro de una transacción. */
export async function conTransaccion(fn) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const resultado = await fn(client);
    await client.query('COMMIT');
    return resultado;
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    throw err;
  } finally {
    client.release();
  }
}

export default pool;
