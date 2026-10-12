import pkg from 'pg';
const { Client } = pkg;
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';
import { executeSQLFile } from './sqlParser.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import { env } from '../src/config/env.js';
import { createTestMedicamentos, createTestNotas, seedClinico } from './seedData.js';

const config = { host: env.db.host, port: env.db.port, user: env.db.user, password: env.db.password, database: 'postgres' };

async function initializeDatabase() {
  const client = new Client(config);

  try {
    console.log('🔧 Iniciando inicialización de base de datos...');
    await client.connect();
    console.log('✅ Conectado a PostgreSQL');

    // Verificar si la base de datos existe
    const dbCheckResult = await client.query(
      `SELECT 1 FROM pg_database WHERE datname = '${env.db.database}'`
    );

    if (dbCheckResult.rows.length === 0) {
      console.log('📦 Creando base de datos geriatric_app...');
      await client.query(`CREATE DATABASE ${env.db.database}`);
      console.log('✅ Base de datos creada exitosamente');
    } else {
      console.log('ℹ️  La base de datos geriatric_app ya existe');
    }

    // Cerrar conexión a postgres y conectar a la BD específica
    await client.end();

    // Conectar a la base de datos geriatric_app
    const dbConfig = { ...config, database: env.db.database };
    const dbClient = new Client(dbConfig);
    await dbClient.connect();
    console.log('✅ Conectado a base de datos geriatric_app');

    // Ejecutar migraciones en orden
    const migrationsPath = path.join(__dirname, '../database/migrations');
    const migrationFiles = fs.readdirSync(migrationsPath)
      .filter(file => file.endsWith('.sql'))
      .sort(); // Ordenar alfabéticamente (001, 002, etc.)

    console.log(`📋 Ejecutando ${migrationFiles.length} migraciones...`);

    let totalErrors = 0;
    for (const file of migrationFiles) {
      console.log(`  📄 Ejecutando ${file}...`);
      const filePath = path.join(migrationsPath, file);
      const migrationSql = fs.readFileSync(filePath, 'utf8');
      const errors = await executeSQLFile(dbClient, migrationSql);

      if (errors.length > 0) {
        console.warn(`    ⚠️  ${errors.length} advertencias en ${file}:`);
        errors.forEach(err => {
          console.warn(`      - ${err.error}`);
        });
        totalErrors += errors.length;
      } else {
        console.log(`    ✅ ${file} ejecutado correctamente`);
      }
    }

    if (totalErrors > 0) {
      console.warn(`⚠️  Total de ${totalErrors} advertencias durante las migraciones`);
    }

    console.log('✅ Migraciones ejecutadas correctamente');

    // Verificar si hay usuarios, si no, crear datos de prueba
    const usersResult = await dbClient.query('SELECT COUNT(*) as count FROM usuarios');
    if (parseInt(usersResult.rows[0].count) === 0) {
      console.log('👤 Creando usuarios de prueba...');
      await createTestUsers(dbClient);
    } else {
      console.log('ℹ️  Los usuarios ya existen, omitiendo creación');
    }

    // Verificar si hay pacientes, si no, crear datos de prueba
    const patientsResult = await dbClient.query('SELECT COUNT(*) as count FROM pacientes');
    if (parseInt(patientsResult.rows[0].count) === 0) {
      console.log('🏥 Creando pacientes de prueba...');
      await createTestPatients(dbClient);
    } else {
      console.log('ℹ️  Los pacientes ya existen, omitiendo creación');
    }

    // Verificar si hay medicamentos, si no, crear datos de prueba
    const medsResult = await dbClient.query('SELECT COUNT(*) as count FROM medicamentos');
    if (parseInt(medsResult.rows[0].count) === 0) {
      console.log('💊 Creando medicamentos de prueba...');
      await createTestMedicamentos(dbClient);
    } else {
      console.log('ℹ️  Los medicamentos ya existen, omitiendo creación');
    }

    // Verificar si hay notas, si no, crear datos de prueba
    const notasResult = await dbClient.query('SELECT COUNT(*) as count FROM notas_enfermeria');
    if (parseInt(notasResult.rows[0].count) === 0) {
      console.log('📝 Creando notas de enfermería de prueba...');
      await createTestNotas(dbClient);
    } else {
      console.log('ℹ️  Las notas ya existen, omitiendo creación');
    }

    await seedClinico(dbClient);

    await dbClient.end();
    console.log('🎉 Inicialización de base de datos completada exitosamente');
    return true;

  } catch (error) {
    console.error('❌ Error al inicializar la base de datos:', error);
    throw error;
  }
}

async function createTestUsers(client) {
  const hashedPassword = await bcrypt.hash('admin123', 10);
  const hashedPasswordEnfermera = await bcrypt.hash('enfermera123', 10);
  const hashedPasswordJefe = await bcrypt.hash('jefe123', 10);

  const users = [
    // Administradores
    {
      nombre: 'Admin',
      apellido: 'Sistema',
      email: 'admin@geriatric.com',
      password: hashedPassword,
      rol: 'administrador'
    },
    // Jefes de Enfermería
    {
      nombre: 'Carlos',
      apellido: 'Rodríguez',
      email: 'carlos.rodriguez@geriatric.com',
      password: hashedPasswordJefe,
      rol: 'jefe_enfermeria'
    },
    {
      nombre: 'Laura',
      apellido: 'Fernández',
      email: 'laura.fernandez@geriatric.com',
      password: hashedPasswordJefe,
      rol: 'jefe_enfermeria'
    },
    // Enfermeras
    {
      nombre: 'María',
      apellido: 'García',
      email: 'maria.garcia@geriatric.com',
      password: hashedPasswordEnfermera,
      rol: 'enfermera'
    },
    {
      nombre: 'Ana',
      apellido: 'Martínez',
      email: 'ana.martinez@geriatric.com',
      password: hashedPasswordEnfermera,
      rol: 'enfermera'
    },
    {
      nombre: 'Carmen',
      apellido: 'López',
      email: 'carmen.lopez@geriatric.com',
      password: hashedPasswordEnfermera,
      rol: 'enfermera'
    },
    {
      nombre: 'Elena',
      apellido: 'Sánchez',
      email: 'elena.sanchez@geriatric.com',
      password: hashedPasswordEnfermera,
      rol: 'enfermera'
    },
    {
      nombre: 'Patricia',
      apellido: 'Romero',
      email: 'patricia.romero@geriatric.com',
      password: hashedPasswordEnfermera,
      rol: 'enfermera'
    },
    {
      nombre: 'Isabel',
      apellido: 'Torres',
      email: 'isabel.torres@geriatric.com',
      password: hashedPasswordEnfermera,
      rol: 'enfermera'
    },
    {
      nombre: 'Sofía',
      apellido: 'Ruiz',
      email: 'sofia.ruiz@geriatric.com',
      password: hashedPasswordEnfermera,
      rol: 'enfermera'
    },
    {
      nombre: 'Clara',
      apellido: 'Morales',
      email: 'clara.morales@geriatric.com',
      password: hashedPasswordEnfermera,
      rol: 'enfermera'
    },
    {
      nombre: 'Julia',
      apellido: 'Ortega',
      email: 'julia.ortega@geriatric.com',
      password: hashedPasswordEnfermera,
      rol: 'enfermera'
    },
    {
      nombre: 'Marta',
      apellido: 'Castro',
      email: 'marta.castro@geriatric.com',
      password: hashedPasswordEnfermera,
      rol: 'enfermera'
    },
    {
      nombre: 'Adriana',
      apellido: 'Vargas',
      email: 'adriana.vargas@geriatric.com',
      password: hashedPasswordEnfermera,
      rol: 'enfermera'
    },
    {
      nombre: 'Valentina',
      apellido: 'Ramos',
      email: 'valentina.ramos@geriatric.com',
      password: hashedPasswordEnfermera,
      rol: 'enfermera'
    },
    {
      nombre: 'Daniela',
      apellido: 'Flores',
      email: 'daniela.flores@geriatric.com',
      password: hashedPasswordEnfermera,
      rol: 'enfermera'
    },
    {
      nombre: 'Gabriela',
      apellido: 'Mendoza',
      email: 'gabriela.mendoza@geriatric.com',
      password: hashedPasswordEnfermera,
      rol: 'enfermera'
    },
    {
      nombre: 'Rocío',
      apellido: 'Reyes',
      email: 'rocio.reyes@geriatric.com',
      password: hashedPasswordEnfermera,
      rol: 'enfermera'
    },
    {
      nombre: 'Beatriz',
      apellido: 'Herrera',
      email: 'beatriz.herrera@geriatric.com',
      password: hashedPasswordEnfermera,
      rol: 'enfermera'
    },
    {
      nombre: 'Victoria',
      apellido: 'Peña',
      email: 'victoria.pena@geriatric.com',
      password: hashedPasswordEnfermera,
      rol: 'enfermera'
    },
    {
      nombre: 'Natalia',
      apellido: 'Cruz',
      email: 'natalia.cruz@geriatric.com',
      password: hashedPasswordEnfermera,
      rol: 'enfermera'
    }
  ];

  for (const user of users) {
    await client.query(
      'INSERT INTO usuarios (nombre, apellido, email, password, rol) VALUES ($1, $2, $3, $4, $5)',
      [user.nombre, user.apellido, user.email, user.password, user.rol]
    );
  }
  console.log(`✅ ${users.length} usuarios de prueba creados`);
}

async function createTestPatients(client) {
  const patients = [
    {
      nombre: 'Juan',
      apellido: 'Pérez',
      fecha_nacimiento: '1945-03-15',
      genero: 'masculino',
      direccion: 'Calle Principal 123',
      telefono: '555-1234',
      contacto_emergencia: 'Pedro Pérez',
      telefono_emergencia: '555-5678',
      alergias: 'Penicilina',
      enfermedades_cronicas: 'Hipertensión, Diabetes tipo 2',
      habitacion: '101'
    },
    {
      nombre: 'María',
      apellido: 'López',
      fecha_nacimiento: '1948-07-22',
      genero: 'femenino',
      direccion: 'Avenida Secundaria 456',
      telefono: '555-2345',
      contacto_emergencia: 'Carmen López',
      telefono_emergencia: '555-6789',
      alergias: 'Ninguna conocida',
      enfermedades_cronicas: 'Artritis',
      habitacion: '102'
    },
    {
      nombre: 'Carlos',
      apellido: 'Rodríguez',
      fecha_nacimiento: '1942-11-08',
      genero: 'masculino',
      direccion: 'Calle Tercera 789',
      telefono: '555-3456',
      contacto_emergencia: 'Luis Rodríguez',
      telefono_emergencia: '555-7890',
      alergias: 'Aspirina',
      enfermedades_cronicas: 'Enfermedad cardíaca',
      habitacion: '103'
    },
    {
      nombre: 'Ana',
      apellido: 'Martínez',
      fecha_nacimiento: '1950-05-30',
      genero: 'femenino',
      direccion: 'Boulevard 321',
      telefono: '555-4567',
      contacto_emergencia: 'Roberto Martínez',
      telefono_emergencia: '555-8901',
      alergias: 'Lactosa',
      enfermedades_cronicas: 'Osteoporosis',
      habitacion: '104'
    },
    {
      nombre: 'Pedro',
      apellido: 'González',
      fecha_nacimiento: '1947-09-12',
      genero: 'masculino',
      direccion: 'Calle Cuarta 654',
      telefono: '555-5678',
      contacto_emergencia: 'Sofía González',
      telefono_emergencia: '555-9012',
      alergias: 'Ninguna conocida',
      enfermedades_cronicas: 'Parkinson',
      habitacion: '105'
    },
    {
      nombre: 'Rosa',
      apellido: 'Fernández',
      fecha_nacimiento: '1943-12-01',
      genero: 'femenino',
      direccion: 'Calle Quinta 987',
      telefono: '555-6789',
      contacto_emergencia: 'Miguel Fernández',
      telefono_emergencia: '555-0123',
      alergias: 'Sulfamidas',
      enfermedades_cronicas: 'Alzheimer',
      habitacion: '106'
    },
    {
      nombre: 'Miguel',
      apellido: 'Sánchez',
      fecha_nacimiento: '1944-06-18',
      genero: 'masculino',
      direccion: 'Avenida Central 321',
      telefono: '555-7890',
      contacto_emergencia: 'Laura Sánchez',
      telefono_emergencia: '555-2345',
      alergias: 'Ninguna conocida',
      enfermedades_cronicas: 'EPOC',
      habitacion: '107'
    },
    {
      nombre: 'Carmen',
      apellido: 'Romero',
      fecha_nacimiento: '1949-02-28',
      genero: 'femenino',
      direccion: 'Calle Sexta 654',
      telefono: '555-8901',
      contacto_emergencia: 'José Romero',
      telefono_emergencia: '555-3456',
      alergias: 'Ibuprofeno',
      enfermedades_cronicas: 'Diabetes tipo 1',
      habitacion: '108'
    },
    {
      nombre: 'Luis',
      apellido: 'Torres',
      fecha_nacimiento: '1941-08-14',
      genero: 'masculino',
      direccion: 'Boulevard Norte 987',
      telefono: '555-9012',
      contacto_emergencia: 'Elena Torres',
      telefono_emergencia: '555-4567',
      alergias: 'Penicilina, Aspirina',
      enfermedades_cronicas: 'Hipertensión, Artritis',
      habitacion: '109'
    },
    {
      nombre: 'Elena',
      apellido: 'Ruiz',
      fecha_nacimiento: '1946-04-05',
      genero: 'femenino',
      direccion: 'Calle Séptima 321',
      telefono: '555-0123',
      contacto_emergencia: 'Antonio Ruiz',
      telefono_emergencia: '555-5678',
      alergias: 'Ninguna conocida',
      enfermedades_cronicas: 'Osteoporosis, Hipotiroidismo',
      habitacion: '110'
    },
    {
      nombre: 'Francisco',
      apellido: 'Morales',
      fecha_nacimiento: '1940-10-22',
      genero: 'masculino',
      direccion: 'Avenida Sur 654',
      telefono: '555-2345',
      contacto_emergencia: 'Teresa Morales',
      telefono_emergencia: '555-6789',
      alergias: 'Ninguna conocida',
      enfermedades_cronicas: 'Parkinson, Demencia',
      habitacion: '111'
    },
    {
      nombre: 'Teresa',
      apellido: 'Ortega',
      fecha_nacimiento: '1947-01-17',
      genero: 'femenino',
      direccion: 'Calle Octava 987',
      telefono: '555-3456',
      contacto_emergencia: 'Ricardo Ortega',
      telefono_emergencia: '555-7890',
      alergias: 'Lactosa',
      enfermedades_cronicas: 'Artritis reumatoide',
      habitacion: '112'
    },
    {
      nombre: 'Antonio',
      apellido: 'Castro',
      fecha_nacimiento: '1943-07-30',
      genero: 'masculino',
      direccion: 'Boulevard Este 321',
      telefono: '555-4567',
      contacto_emergencia: 'Patricia Castro',
      telefono_emergencia: '555-8901',
      alergias: 'Sulfamidas',
      enfermedades_cronicas: 'Enfermedad cardíaca, Diabetes tipo 2',
      habitacion: '113'
    },
    {
      nombre: 'Patricia',
      apellido: 'Vargas',
      fecha_nacimiento: '1949-11-11',
      genero: 'femenino',
      direccion: 'Calle Novena 654',
      telefono: '555-5678',
      contacto_emergencia: 'Manuel Vargas',
      telefono_emergencia: '555-0123',
      alergias: 'Ninguna conocida',
      enfermedades_cronicas: 'Hipertensión',
      habitacion: '114'
    },
    {
      nombre: 'Ricardo',
      apellido: 'Ramos',
      fecha_nacimiento: '1942-03-25',
      genero: 'masculino',
      direccion: 'Avenida Oeste 987',
      telefono: '555-6789',
      contacto_emergencia: 'Isabel Ramos',
      telefono_emergencia: '555-2345',
      alergias: 'Penicilina',
      enfermedades_cronicas: 'EPOC, Hipertensión',
      habitacion: '115'
    },
    {
      nombre: 'Isabel',
      apellido: 'Flores',
      fecha_nacimiento: '1945-09-08',
      genero: 'femenino',
      direccion: 'Calle Décima 321',
      telefono: '555-7890',
      contacto_emergencia: 'Gabriel Flores',
      telefono_emergencia: '555-3456',
      alergias: 'Ninguna conocida',
      enfermedades_cronicas: 'Alzheimer leve',
      habitacion: '116'
    },
    {
      nombre: 'Gabriel',
      apellido: 'Mendoza',
      fecha_nacimiento: '1941-05-19',
      genero: 'masculino',
      direccion: 'Boulevard Sur 654',
      telefono: '555-8901',
      contacto_emergencia: 'Rocío Mendoza',
      telefono_emergencia: '555-4567',
      alergias: 'Aspirina',
      enfermedades_cronicas: 'Parkinson avanzado',
      habitacion: '117'
    },
    {
      nombre: 'Rocío',
      apellido: 'Reyes',
      fecha_nacimiento: '1948-12-03',
      genero: 'femenino',
      direccion: 'Calle Once 987',
      telefono: '555-0123',
      contacto_emergencia: 'Fernando Reyes',
      telefono_emergencia: '555-5678',
      alergias: 'Ninguna conocida',
      enfermedades_cronicas: 'Diabetes tipo 2, Osteoporosis',
      habitacion: '118'
    },
    {
      nombre: 'Fernando',
      apellido: 'Herrera',
      fecha_nacimiento: '1944-08-27',
      genero: 'masculino',
      direccion: 'Avenida Norte 321',
      telefono: '555-2345',
      contacto_emergencia: 'Beatriz Herrera',
      telefono_emergencia: '555-6789',
      alergias: 'Penicilina, Sulfamidas',
      enfermedades_cronicas: 'Enfermedad cardíaca, Artritis',
      habitacion: '119'
    },
    {
      nombre: 'Beatriz',
      apellido: 'Peña',
      fecha_nacimiento: '1946-02-14',
      genero: 'femenino',
      direccion: 'Calle Doce 654',
      telefono: '555-3456',
      contacto_emergencia: 'Javier Peña',
      telefono_emergencia: '555-7890',
      alergias: 'Lactosa',
      enfermedades_cronicas: 'Hipotiroidismo',
      habitacion: '120'
    },
    {
      nombre: 'Javier',
      apellido: 'Cruz',
      fecha_nacimiento: '1943-06-06',
      genero: 'masculino',
      direccion: 'Boulevard Poniente 987',
      telefono: '555-4567',
      contacto_emergencia: 'Victoria Cruz',
      telefono_emergencia: '555-8901',
      alergias: 'Ninguna conocida',
      enfermedades_cronicas: 'Demencia senil',
      habitacion: '121'
    }
  ];

  for (const patient of patients) {
    await client.query(
      `INSERT INTO pacientes 
       (nombre, apellido, fecha_nacimiento, genero, direccion, telefono, 
        contacto_emergencia, telefono_emergencia, alergias, enfermedades_cronicas, habitacion)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
      [
        patient.nombre, patient.apellido, patient.fecha_nacimiento, patient.genero,
        patient.direccion, patient.telefono, patient.contacto_emergencia,
        patient.telefono_emergencia, patient.alergias, patient.enfermedades_cronicas,
        patient.habitacion
      ]
    );
  }
  console.log(`✅ ${patients.length} pacientes de prueba creados`);
}

// Ejecutar si se llama directamente
if (import.meta.url === `file://${process.argv[1]}`) {
  initializeDatabase()
    .then(() => {
      console.log('✅ Proceso completado');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Error:', error);
      process.exit(1);
    });
}

export default initializeDatabase;
