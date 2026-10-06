import pkg from 'pg';
const { Client } = pkg;
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuración de conexión PostgreSQL
const config = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'yopro1015',
  database: 'postgres' // Conectar a postgres por defecto para crear la BD
};

async function initializeDatabase() {
  const client = new Client(config);

  try {
    console.log('🔧 Iniciando inicialización de base de datos...');
    await client.connect();
    console.log('✅ Conectado a PostgreSQL');

    // Verificar si la base de datos existe
    const dbCheckResult = await client.query(
      "SELECT 1 FROM pg_database WHERE datname = 'geriatric_app'"
    );

    if (dbCheckResult.rows.length === 0) {
      console.log('📦 Creando base de datos geriatric_app...');
      await client.query('CREATE DATABASE geriatric_app');
      console.log('✅ Base de datos creada exitosamente');
    } else {
      console.log('ℹ️  La base de datos geriatric_app ya existe');
    }

    // Cerrar conexión a postgres y conectar a la BD específica
    await client.end();

    // Conectar a la base de datos geriatric_app
    const dbConfig = { ...config, database: 'geriatric_app' };
    const dbClient = new Client(dbConfig);
    await dbClient.connect();
    console.log('✅ Conectado a base de datos geriatric_app');

    // Leer y ejecutar el schema
    const schemaPath = path.join(__dirname, '../database/schema.sql');
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');

    // Dividir el schema en sentencias individuales
    const statements = schemaSql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    for (const statement of statements) {
      try {
        await dbClient.query(statement);
      } catch (err) {
        // Ignorar errores de tablas que ya existen
        if (!err.message.includes('already exists')) {
          console.warn('⚠️  Advertencia en schema:', err.message);
        }
      }
    }
    console.log('✅ Schema ejecutado correctamente');

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

async function createTestMedicamentos(client) {
  const medicamentos = [
    {
      nombre: 'Paracetamol 500mg',
      descripcion: 'Analgésico y antipirético',
      presentacion: 'Tabletas',
      dosis: '500mg',
      via_administracion: 'Oral',
      cantidad_disponible: 100,
      fecha_caducidad: '2025-12-31',
      lote: 'PAR001',
      proveedor: 'Laboratorios ABC'
    },
    {
      nombre: 'Ibuprofeno 400mg',
      descripcion: 'Antiinflamatorio no esteroideo',
      presentacion: 'Cápsulas',
      dosis: '400mg',
      via_administracion: 'Oral',
      cantidad_disponible: 75,
      fecha_caducidad: '2025-08-15',
      lote: 'IBU002',
      proveedor: 'Laboratorios XYZ'
    },
    {
      nombre: 'Insulina Glargina',
      descripcion: 'Insulina de acción larga para diabetes',
      presentacion: 'Pluma inyectable',
      dosis: '100 UI/mL',
      via_administracion: 'Subcutánea',
      cantidad_disponible: 20,
      fecha_caducidad: '2025-06-30',
      lote: 'INS003',
      proveedor: 'Pharma Corp'
    },
    {
      nombre: 'Enalapril 10mg',
      descripcion: 'Inhibidor de la ECA para hipertensión',
      presentacion: 'Tabletas',
      dosis: '10mg',
      via_administracion: 'Oral',
      cantidad_disponible: 50,
      fecha_caducidad: '2025-10-20',
      lote: 'ENA004',
      proveedor: 'Laboratorios ABC'
    },
    {
      nombre: 'Metformina 850mg',
      descripcion: 'Antidiabético oral',
      presentacion: 'Tabletas',
      dosis: '850mg',
      via_administracion: 'Oral',
      cantidad_disponible: 80,
      fecha_caducidad: '2025-11-10',
      lote: 'MET005',
      proveedor: 'Diabetes Care'
    },
    {
      nombre: 'Omeprazol 20mg',
      descripcion: 'Inhibidor de la bomba de protones',
      presentacion: 'Cápsulas',
      dosis: '20mg',
      via_administracion: 'Oral',
      cantidad_disponible: 60,
      fecha_caducidad: '2025-09-25',
      lote: 'OME006',
      proveedor: 'Gastro Pharma'
    },
    {
      nombre: 'Amlodipino 5mg',
      descripcion: 'Bloqueante de los canales de calcio',
      presentacion: 'Tabletas',
      dosis: '5mg',
      via_administracion: 'Oral',
      cantidad_disponible: 45,
      fecha_caducidad: '2025-07-15',
      lote: 'AML007',
      proveedor: 'CardioMed'
    },
    {
      nombre: 'Levotiroxina 50mcg',
      descripcion: 'Hormona tiroidea sintética',
      presentacion: 'Tabletas',
      dosis: '50mcg',
      via_administracion: 'Oral',
      cantidad_disponible: 30,
      fecha_caducidad: '2025-12-01',
      lote: 'LEV008',
      proveedor: 'Endo Pharma'
    },
    {
      nombre: 'Losartán 50mg',
      descripcion: 'Antagonista de los receptores de angiotensina II',
      presentacion: 'Tabletas',
      dosis: '50mg',
      via_administracion: 'Oral',
      cantidad_disponible: 65,
      fecha_caducidad: '2026-01-15',
      lote: 'LOS009',
      proveedor: 'Hypertension Labs'
    },
    {
      nombre: 'Atorvastatina 20mg',
      descripcion: 'Estatina para reducir colesterol',
      presentacion: 'Tabletas',
      dosis: '20mg',
      via_administracion: 'Oral',
      cantidad_disponible: 55,
      fecha_caducidad: '2025-11-30',
      lote: 'ATO010',
      proveedor: 'CardioCare'
    },
    {
      nombre: 'Warfarina 5mg',
      descripcion: 'Anticoagulante oral',
      presentacion: 'Tabletas',
      dosis: '5mg',
      via_administracion: 'Oral',
      cantidad_disponible: 25,
      fecha_caducidad: '2025-08-20',
      lote: 'WAR011',
      proveedor: 'Coagulation Pharma'
    },
    {
      nombre: 'Furosemida 40mg',
      descripcion: 'Diurético de asa',
      presentacion: 'Tabletas',
      dosis: '40mg',
      via_administracion: 'Oral',
      cantidad_disponible: 70,
      fecha_caducidad: '2025-10-05',
      lote: 'FUR012',
      proveedor: 'Diuretic Solutions'
    },
    {
      nombre: 'Digoxina 0.25mg',
      descripcion: 'Glicósido cardíaco',
      presentacion: 'Tabletas',
      dosis: '0.25mg',
      via_administracion: 'Oral',
      cantidad_disponible: 35,
      fecha_caducidad: '2025-09-10',
      lote: 'DIG013',
      proveedor: 'Heart Pharma'
    },
    {
      nombre: 'Diazepam 5mg',
      descripcion: 'Benzodiazepina ansiolítica',
      presentacion: 'Tabletas',
      dosis: '5mg',
      via_administracion: 'Oral',
      cantidad_disponible: 40,
      fecha_caducidad: '2026-02-28',
      lote: 'DIA014',
      proveedor: 'Calm Labs'
    },
    {
      nombre: 'Donepezilo 10mg',
      descripcion: 'Inhibidor de la colinesterasa para Alzheimer',
      presentacion: 'Tabletas',
      dosis: '10mg',
      via_administracion: 'Oral',
      cantidad_disponible: 28,
      fecha_caducidad: '2025-12-15',
      lote: 'DON015',
      proveedor: 'NeuroCare'
    },
    {
      nombre: 'Risperidona 1mg',
      descripcion: 'Antipsicótico atípico',
      presentacion: 'Tabletas',
      dosis: '1mg',
      via_administracion: 'Oral',
      cantidad_disponible: 32,
      fecha_caducidad: '2025-11-25',
      lote: 'RIS016',
      proveedor: 'PsychMed'
    },
    {
      nombre: 'Pramipexol 0.25mg',
      descripcion: 'Agonista dopaminérgico para Parkinson',
      presentacion: 'Tabletas',
      dosis: '0.25mg',
      via_administracion: 'Oral',
      cantidad_disponible: 38,
      fecha_caducidad: '2026-01-20',
      lote: 'PRA017',
      proveedor: 'Movement Labs'
    },
    {
      nombre: 'Alendronato 70mg',
      descripcion: 'Bisfosfonato para osteoporosis',
      presentacion: 'Tabletas',
      dosis: '70mg',
      via_administracion: 'Oral',
      cantidad_disponible: 22,
      fecha_caducidad: '2025-10-30',
      lote: 'ALE018',
      proveedor: 'Bone Health'
    },
    {
      nombre: 'Citalopram 20mg',
      descripcion: 'ISRS antidepresivo',
      presentacion: 'Tabletas',
      dosis: '20mg',
      via_administracion: 'Oral',
      cantidad_disponible: 48,
      fecha_caducidad: '2026-03-10',
      lote: 'CIT019',
      proveedor: 'Mental Health Pharma'
    },
    {
      nombre: 'Clopidogrel 75mg',
      descripcion: 'Antiagregante plaquetario',
      presentacion: 'Tabletas',
      dosis: '75mg',
      via_administracion: 'Oral',
      cantidad_disponible: 52,
      fecha_caducidad: '2025-12-20',
      lote: 'CLO020',
      proveedor: 'Thrombosis Care'
    }
  ];

  for (const med of medicamentos) {
    await client.query(
      `INSERT INTO medicamentos 
       (nombre, descripcion, presentacion, dosis, via_administracion, 
        cantidad_disponible, fecha_caducidad, lote, proveedor)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        med.nombre, med.descripcion, med.presentacion, med.dosis,
        med.via_administracion, med.cantidad_disponible, med.fecha_caducidad,
        med.lote, med.proveedor
      ]
    );
  }
  console.log(`✅ ${medicamentos.length} medicamentos de prueba creados`);
}

async function createTestNotas(client) {
  // Obtener IDs de usuarios y pacientes para crear notas realistas
  const usuariosResult = await client.query('SELECT id FROM usuarios WHERE rol != \'administrador\' LIMIT 10');
  const pacientesResult = await client.query('SELECT id FROM pacientes LIMIT 15');

  const usuarios = usuariosResult.rows;
  const pacientes = pacientesResult.rows;

  const tiposNota = ['ingreso', 'evolucion', 'medicacion', 'signos_vitales', 'observacion'];
  const estadosPaciente = ['Estable', 'Observación', 'Mejorando', 'Estable pero monitoreo'];

  const notas = [];

  // Crear notas para cada paciente
  for (let i = 0; i < pacientes.length; i++) {
    const pacienteId = pacientes[i].id;
    const numNotas = Math.floor(Math.random() * 5) + 3; // 3-7 notas por paciente

    for (let j = 0; j < numNotas; j++) {
      const usuarioId = usuarios[Math.floor(Math.random() * usuarios.length)].id;
      const tipoNota = tiposNota[Math.floor(Math.random() * tiposNota.length)];
      const estado = estadosPaciente[Math.floor(Math.random() * estadosPaciente.length)];

      let contenido = '';
      let signosVitales = null;
      let administracionMedicamentos = null;

      switch (tipoNota) {
        case 'ingreso':
          contenido = 'Paciente ingresado al hogar geriátrico. Evaluación inicial completada. Estable generalmente.';
          break;
        case 'evolucion':
          contenido = 'Paciente mantiene estado estable. Sin cambios significativos en condición general. Continúa con tratamiento habitual.';
          break;
        case 'medicacion':
          contenido = 'Administración de medicamentos según prescripción médica. Paciente tolera bien el tratamiento.';
          administracionMedicamentos = JSON.stringify({
            medicamentos: ['Paracetamol', 'Enalapril'],
            horario: '08:00',
            observacion: 'Sin efectos adversos'
          });
          break;
        case 'signos_vitales':
          contenido = 'Toma de signos vitales rutinaria. Valores dentro de rangos normales.';
          signosVitales = JSON.stringify({
            presion_arterial: `${120 + Math.floor(Math.random() * 20)}/${70 + Math.floor(Math.random() * 15)}`,
            frecuencia_cardiaca: `${70 + Math.floor(Math.random() * 20)}`,
            temperatura: `${36 + Math.random() * 1.5}`,
            saturacion_oxigeno: `${95 + Math.floor(Math.random() * 4)}%`
          });
          break;
        case 'observacion':
          contenido = 'Observación general del paciente. Apetito normal, sueño adecuado. Actividad física moderada.';
          break;
      }

      notas.push({
        paciente_id: pacienteId,
        usuario_id: usuarioId,
        tipo_nota: tipoNota,
        contenido: contenido,
        signos_vitales: signosVitales,
        administracion_medicamentos: administracionMedicamentos,
        observaciones: '',
        estado_paciente: estado
      });
    }
  }

  for (const nota of notas) {
    await client.query(
      `INSERT INTO notas_enfermeria 
       (paciente_id, usuario_id, tipo_nota, contenido, signos_vitales,
        administracion_medicamentos, observaciones, estado_paciente, fecha_registro)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW() - INTERVAL '${Math.floor(Math.random() * 30)} days')`,
      [
        nota.paciente_id, nota.usuario_id, nota.tipo_nota, nota.contenido,
        nota.signos_vitales, nota.administracion_medicamentos,
        nota.observaciones, nota.estado_paciente
      ]
    );
  }

  console.log(`✅ ${notas.length} notas de enfermería de prueba creadas`);
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
