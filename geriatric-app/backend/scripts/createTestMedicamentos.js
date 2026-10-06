import pool from '../src/config/database.js';

async function createTestMedicamentos() {
  try {
    const medicamentos = [
      {
        nombre: 'Losartán 50mg',
        descripcion: 'Antihipertensivo para tratamiento de hipertensión arterial',
        presentacion: 'Tabletas',
        dosis: '50mg',
        via_administracion: 'Oral',
        cantidad_disponible: 45,
        fecha_caducidad: '2025-12-31',
        lote: 'LOT2024001',
        proveedor: 'Laboratorios XYZ'
      },
      {
        nombre: 'Metformina 850mg',
        descripcion: 'Antidiabético oral para control de glucosa',
        presentacion: 'Tabletas',
        dosis: '850mg',
        via_administracion: 'Oral',
        cantidad_disponible: 8,
        fecha_caducidad: '2024-11-15',
        lote: 'LOT2024002',
        proveedor: 'Farmacéutica ABC'
      },
      {
        nombre: 'Omeprazol 20mg',
        descripcion: 'Inhibidor de bomba de protones',
        presentacion: 'Cápsulas',
        dosis: '20mg',
        via_administracion: 'Oral',
        cantidad_disponible: 120,
        fecha_caducidad: '2026-06-30',
        lote: 'LOT2024003',
        proveedor: 'Laboratorios DEF'
      },
      {
        nombre: 'Atorvastatina 20mg',
        descripcion: 'Estatina para reducción de colesterol',
        presentacion: 'Tabletas',
        dosis: '20mg',
        via_administracion: 'Oral',
        cantidad_disponible: 60,
        fecha_caducidad: '2024-10-01',
        lote: 'LOT2024004',
        proveedor: 'Laboratorios GHI'
      },
      {
        nombre: 'Paracetamol 500mg',
        descripcion: 'Analgésico y antipirético',
        presentacion: 'Tabletas',
        dosis: '500mg',
        via_administracion: 'Oral',
        cantidad_disponible: 200,
        fecha_caducidad: '2025-03-15',
        lote: 'LOT2024005',
        proveedor: 'Farmacéutica JKL'
      }
    ];

    for (const medicamento of medicamentos) {
      const query = `
        INSERT INTO medicamentos (nombre, descripcion, presentacion, dosis, via_administracion,
                                   cantidad_disponible, fecha_caducidad, lote, proveedor, activo)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, true)
        ON CONFLICT DO NOTHING
        RETURNING id, nombre, cantidad_disponible, fecha_caducidad
      `;

      const values = [
        medicamento.nombre,
        medicamento.descripcion,
        medicamento.presentacion,
        medicamento.dosis,
        medicamento.via_administracion,
        medicamento.cantidad_disponible,
        medicamento.fecha_caducidad,
        medicamento.lote,
        medicamento.proveedor
      ];

      const result = await pool.query(query, values);

      if (result.rows.length > 0) {
        console.log(`✅ Medicamento creado: ${medicamento.nombre} - Stock: ${medicamento.cantidad_disponible}`);
      } else {
        console.log(`⚠️ Medicamento ya existe: ${medicamento.nombre}`);
      }
    }

    console.log('\n🎉 Medicamentos de prueba creados exitosamente');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error al crear medicamentos:', error);
    process.exit(1);
  }
}

createTestMedicamentos();
