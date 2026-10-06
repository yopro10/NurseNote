import pool from '../src/config/database.js';

async function testConnection() {
  try {
    console.log('Intentando conectar a la base de datos...');
    const client = await pool.connect();
    console.log('✅ Conexión exitosa a PostgreSQL');
    
    const result = await client.query('SELECT NOW()');
    console.log('📅 Fecha del servidor:', result.rows[0].now);
    
    const users = await client.query('SELECT id, nombre, email, rol FROM usuarios');
    console.log('👥 Usuarios actuales:', users.rows);
    
    client.release();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error de conexión:', error.message);
    process.exit(1);
  }
}

testConnection();