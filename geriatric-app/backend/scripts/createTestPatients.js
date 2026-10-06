import pool from '../src/config/database.js';

async function createTestPatients() {
  try {
    const pacientes = [
      {
        nombre: 'Juan',
        apellido: 'Pérez',
        fecha_nacimiento: '1945-03-15',
        genero: 'masculino',
        direccion: 'Calle 123 # 45-67',
        telefono: '555-1234',
        contacto_emergencia: 'María Pérez',
        telefono_emergencia: '555-5678',
        alergias: 'Penicilina',
        enfermedades_cronicas: 'Hipertensión, Diabetes Tipo 2',
        habitacion: '101'
      },
      {
        nombre: 'Carmen',
        apellido: 'López',
        fecha_nacimiento: '1948-07-22',
        genero: 'femenino',
        direccion: 'Av. 45 # 12-34',
        telefono: '555-2345',
        contacto_emergencia: 'Pedro López',
        telefono_emergencia: '555-6789',
        alergias: 'Ninguna',
        enfermedades_cronicas: 'Artritis',
        habitacion: '102'
      },
      {
        nombre: 'Roberto',
        apellido: 'Gómez',
        fecha_nacimiento: '1942-11-08',
        genero: 'masculino',
        direccion: 'Carrera 7 # 89-12',
        telefono: '555-3456',
        contacto_emergencia: 'Luisa Gómez',
        telefono_emergencia: '555-7890',
        alergias: 'Sulfas',
        enfermedades_cronicas: 'Enfermedad cardíaca, Demencia temprana',
        habitacion: '103'
      },
      {
        nombre: 'Elena',
        apellido: 'Martínez',
        fecha_nacimiento: '1950-01-30',
        genero: 'femenino',
        direccion: 'Calle 78 # 23-45',
        telefono: '555-4567',
        contacto_emergencia: 'Carlos Martínez',
        telefono_emergencia: '555-8901',
        alergias: 'Ninguna',
        enfermedades_cronicas: 'Osteoporosis',
        habitacion: '104'
      },
      {
        nombre: 'Miguel',
        apellido: 'Rodríguez',
        fecha_nacimiento: '1947-05-18',
        genero: 'masculino',
        direccion: 'Transversal 12 # 34-56',
        telefono: '555-5678',
        contacto_emergencia: 'Ana Rodríguez',
        telefono_emergencia: '555-9012',
        alergias: 'Aspirina',
        enfermedades_cronicas: 'Enfermedad pulmonar obstructiva crónica',
        habitacion: '105'
      }
    ];

    for (const paciente of pacientes) {
      const query = `
        INSERT INTO pacientes (nombre, apellido, fecha_nacimiento, genero, direccion, telefono, 
                              contacto_emergencia, telefono_emergencia, alergias, enfermedades_cronicas, habitacion)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        ON CONFLICT DO NOTHING
        RETURNING id, nombre, apellido, habitacion
      `;
      
      const values = [
        paciente.nombre,
        paciente.apellido,
        paciente.fecha_nacimiento,
        paciente.genero,
        paciente.direccion,
        paciente.telefono,
        paciente.contacto_emergencia,
        paciente.telefono_emergencia,
        paciente.alergias,
        paciente.enfermedades_cronicas,
        paciente.habitacion
      ];
      
      const result = await pool.query(query, values);
      
      if (result.rows.length > 0) {
        console.log(`✅ Paciente creado: ${paciente.nombre} ${paciente.apellido} - Habitación ${paciente.habitacion}`);
      } else {
        console.log(`⚠️ Paciente ya existe: ${paciente.nombre} ${paciente.apellido}`);
      }
    }

    console.log('\n🎉 Pacientes de prueba creados exitosamente');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error al crear pacientes:', error);
    process.exit(1);
  }
}

createTestPatients();
