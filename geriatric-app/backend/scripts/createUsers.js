import bcrypt from 'bcryptjs';
import pool from '../src/config/database.js';

async function createUsers() {
  try {
    const users = [
      {
        nombre: 'María',
        apellido: 'García',
        email: 'maria.garcia@geriatric.com',
        password: 'enfermera123',
        rol: 'enfermera'
      },
      {
        nombre: 'Carlos',
        apellido: 'Rodríguez',
        email: 'carlos.rodriguez@geriatric.com',
        password: 'jefe123',
        rol: 'jefe_enfermeria'
      },
      {
        nombre: 'Ana',
        apellido: 'Martínez',
        email: 'ana.martinez@geriatric.com',
        password: 'ana123',
        rol: 'enfermera'
      }
    ];

    for (const user of users) {
      const hashedPassword = await bcrypt.hash(user.password, 10);
      
      const query = `
        INSERT INTO usuarios (nombre, apellido, email, password, rol)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (email) DO UPDATE SET
          nombre = EXCLUDED.nombre,
          apellido = EXCLUDED.apellido,
          password = EXCLUDED.password,
          rol = EXCLUDED.rol
        RETURNING id, nombre, email, rol
      `;
      
      const values = [user.nombre, user.apellido, user.email, hashedPassword, user.rol];
      const result = await pool.query(query, values);
      
      console.log(`✅ Usuario creado: ${user.nombre} ${user.apellido} (${user.email}) - Rol: ${user.rol}`);
      console.log(`   Contraseña: ${user.password}`);
    }

    console.log('\n🎉 Todos los usuarios de prueba creados exitosamente');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error al crear usuarios:', error);
    process.exit(1);
  }
}

createUsers();