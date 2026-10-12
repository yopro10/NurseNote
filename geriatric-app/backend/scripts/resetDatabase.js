import 'dotenv/config';
import pkg from 'pg';
const { Client } = pkg;

async function resetDatabase() {
  const client = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '',
    database: 'postgres'
  });

  try {
    console.log('🔄 Reiniciando base de datos...');
    await client.connect();
    console.log('✅ Conectado a PostgreSQL');

    // Eliminar la base de datos si existe
    console.log('🗑️  Eliminando base de datos existente...');
    await client.query('DROP DATABASE IF EXISTS geriatric_app');
    console.log('✅ Base de datos eliminada');

    // Crear nueva base de datos
    console.log('📦 Creando nueva base de datos...');
    await client.query('CREATE DATABASE geriatric_app');
    console.log('✅ Base de datos creada');

    await client.end();
    console.log('🎉 Base de datos reiniciada exitosamente');
    console.log('');
    console.log('⚠️  Ahora ejecuta: npm run dev');
    console.log('   Esto creará los nuevos datos automáticamente.');
    console.log('');
    console.log('📊 Nuevos datos que se crearán:');
    console.log('   • 21 usuarios (1 admin, 2 jefes, 18 enfermeras)');
    console.log('   • 20 pacientes (habitaciones 101-121)');
    console.log('   • 20 medicamentos');
    console.log('   • Notas de enfermería de prueba');

  } catch (error) {
    console.error('❌ Error al reiniciar la base de datos:', error);
    process.exit(1);
  }
}

resetDatabase();
