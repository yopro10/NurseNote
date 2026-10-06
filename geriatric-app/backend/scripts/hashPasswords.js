import bcrypt from 'bcryptjs';
import pool from '../src/config/database.js';

async function hashPasswords() {
  try {
    console.log('Conectando a la base de datos...');
    
    const usuarios = [
      { email: 'maria.garcia@geriatric.com', password: 'enfermera123' },
      { email: 'carlos.rodriguez@geriatric.com', password: 'jefe123' },
      { email: 'ana.martinez@geriatric.com', password: 'ana123' },
      { email: 'admin@geriatric.com', password: 'admin123' }
    ];

    for (const usuario of usuarios) {
      const hashedPassword = await bcrypt.hash(usuario.password, 10);
      
      const query = `
        UPDATE usuarios 
        SET password = $1 
        WHERE email = $2
      `;
      
      await pool.query(query, [hashedPassword, usuario.email]);
      console.log(`✅ Contraseña hasheada para: ${usuario.email}`);
    }

    console.log('🎉 Todas las contraseñas han sido actualizadas');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

hashPasswords();