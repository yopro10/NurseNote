import { recalcularEstado } from '../src/services/estadoPaciente.js';

/** PRNG determinista: los datos de demostración son siempre los mismos. */
function rng(seed = 42) {
  return () => { seed |= 0; seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

// Fechas de caducidad RELATIVAS a hoy (días): así la demo nunca queda "vencida" con el paso del tiempo.
const MEDS = [
  ['Paracetamol 500mg', 'Analgésico y antipirético', 'Tabletas', '500mg', 'Oral', 220, 420, 'PAR001', 'Laboratorios ABC', 40],
  ['Ibuprofeno 400mg', 'Antiinflamatorio no esteroideo', 'Cápsulas', '400mg', 'Oral', 75, 200, 'IBU002', 'Laboratorios XYZ', 20],
  ['Insulina Glargina', 'Insulina de acción larga', 'Pluma inyectable', '100 UI/mL', 'Subcutánea', 8, 25, 'INS003', 'Pharma Corp', 10],
  ['Enalapril 10mg', 'Inhibidor de la ECA para hipertensión', 'Tabletas', '10mg', 'Oral', 150, 300, 'ENA004', 'Laboratorios ABC', 30],
  ['Metformina 850mg', 'Antidiabético oral', 'Tabletas', '850mg', 'Oral', 180, 18, 'MET005', 'Diabetes Care', 30],
  ['Omeprazol 20mg', 'Inhibidor de la bomba de protones', 'Cápsulas', '20mg', 'Oral', 160, 380, 'OME006', 'Gastro Pharma', 30],
  ['Amlodipino 5mg', 'Bloqueante de canales de calcio', 'Tabletas', '5mg', 'Oral', 140, 330, 'AML007', 'CardioMed', 30],
  ['Levotiroxina 50mcg', 'Hormona tiroidea sintética', 'Tabletas', '50mcg', 'Oral', 130, 280, 'LEV008', 'Endo Pharma', 30],
  ['Losartán 50mg', 'Antagonista de receptores de angiotensina II', 'Tabletas', '50mg', 'Oral', 165, 500, 'LOS009', 'Hypertension Labs', 30],
  ['Atorvastatina 20mg', 'Estatina para reducir colesterol', 'Tabletas', '20mg', 'Oral', 150, -12, 'ATO010', 'CardioCare', 30],
  ['Warfarina 5mg', 'Anticoagulante oral', 'Tabletas', '5mg', 'Oral', 90, 240, 'WAR011', 'Coagulation Pharma', 20],
  ['Furosemida 40mg', 'Diurético de asa', 'Tabletas', '40mg', 'Oral', 120, 260, 'FUR012', 'Diuretic Solutions', 25],
  ['Digoxina 0.25mg', 'Glicósido cardíaco', 'Tabletas', '0.25mg', 'Oral', 90, 150, 'DIG013', 'Heart Pharma', 20],
  ['Diazepam 5mg', 'Benzodiazepina ansiolítica', 'Tabletas', '5mg', 'Oral', 60, 350, 'DIA014', 'Calm Labs', 15],
  ['Donepezilo 10mg', 'Inhibidor de la colinesterasa para Alzheimer', 'Tabletas', '10mg', 'Oral', 100, 310, 'DON015', 'NeuroCare', 25],
  ['Risperidona 1mg', 'Antipsicótico atípico', 'Tabletas', '1mg', 'Oral', 90, 270, 'RIS016', 'PsychMed', 20],
  ['Pramipexol 0.25mg', 'Agonista dopaminérgico para Parkinson', 'Tabletas', '0.25mg', 'Oral', 110, 400, 'PRA017', 'Movement Labs', 20],
  ['Alendronato 70mg', 'Bisfosfonato para osteoporosis', 'Tabletas', '70mg', 'Oral', 40, 22, 'ALE018', 'Bone Health', 15],
  ['Citalopram 20mg', 'ISRS antidepresivo', 'Tabletas', '20mg', 'Oral', 80, 360, 'CIT019', 'Mental Health Pharma', 20],
  ['Clopidogrel 75mg', 'Antiagregante plaquetario', 'Tabletas', '75mg', 'Oral', 110, 290, 'CLO020', 'Thrombosis Care', 25],
  ['Amoxicilina 500mg', 'Antibiótico betalactámico (penicilina)', 'Cápsulas', '500mg', 'Oral', 60, 190, 'AMX021', 'Laboratorios ABC', 20],
  ['Ácido acetilsalicílico 100mg', 'Aspirina, antiagregante', 'Tabletas', '100mg', 'Oral', 4, 220, 'ASA022', 'CardioCare', 20],
  ['Naproxeno 250mg', 'Antiinflamatorio no esteroideo', 'Tabletas', '250mg', 'Oral', 70, 180, 'NAP023', 'Laboratorios XYZ', 20],
  ['Sulfametoxazol/Trimetoprim', 'Antibiótico (sulfamida)', 'Tabletas', '800/160mg', 'Oral', 50, 160, 'SUL024', 'Pharma Corp', 15],
];

export async function createTestMedicamentos(client) {
  for (const m of MEDS) {
    await client.query(
      `INSERT INTO medicamentos (nombre, descripcion, presentacion, dosis, via_administracion, cantidad_disponible, fecha_caducidad, lote, proveedor, stock_minimo)
       VALUES ($1,$2,$3,$4,$5,$6, CURRENT_DATE + $7::int, $8,$9,$10)`, m);
  }
  console.log(`✅ ${MEDS.length} medicamentos de prueba creados`);
}

const PLANTILLAS = {
  evolucion: ['Residente con buen estado general, colaborador durante el cuidado. Sin cambios relevantes.', 'Pasó la noche tranquilo, sueño reparador. Desayunó completo.', 'Refiere leve cansancio; se indica reposo e hidratación. Se mantiene vigilancia.'],
  observacion: ['Apetito conservado, buena tolerancia a la dieta. Participó en actividades grupales.', 'Se observa piel íntegra, sin lesiones por presión. Movilización asistida cada 2 horas.', 'Presenta episodios de desorientación leve en la tarde; se redirige con éxito.'],
  medicacion: ['Se administra medicación según prescripción. Tolera bien, sin efectos adversos.', 'Se recuerda al residente la importancia del tratamiento; acepta la medicación.'],
  signos_vitales: ['Toma de signos vitales de rutina. Valores registrados en la sección de signos vitales.'],
  ingreso: ['Ingreso al hogar. Valoración inicial completada, familia informada de normas y horarios.'],
};

export async function createTestNotas(client) {
  const r = rng(7);
  const us = (await client.query(`SELECT id FROM usuarios WHERE rol <> 'administrador' ORDER BY id LIMIT 10`)).rows;
  const ps = (await client.query('SELECT id FROM pacientes ORDER BY id')).rows;
  const tipos = Object.keys(PLANTILLAS);
  let n = 0;
  for (const p of ps) {
    const total = 4 + Math.floor(r() * 5);
    for (let j = 0; j < total; j++) {
      const tipo = j === total - 1 ? 'ingreso' : tipos[Math.floor(r() * 4)];
      const lista = PLANTILLAS[tipo];
      await client.query(
        `INSERT INTO notas_enfermeria (paciente_id, usuario_id, tipo_nota, contenido, estado_paciente, fecha_registro)
         VALUES ($1, $2, $3, $4, 'Estable', NOW() - ($5 || ' hours')::interval)`,
        [p.id, us[Math.floor(r() * us.length)].id, tipo, lista[Math.floor(r() * lista.length)], String(1 + j * 26 + Math.floor(r() * 20))]
      );
      n++;
    }
  }
  console.log(`✅ ${n} notas de enfermería de prueba creadas`);
}

const CRONICAS_A_MEDS = [
  [/hipertensi/i, ['Enalapril 10mg', 'Amlodipino 5mg', 'Losartán 50mg']],
  [/diabetes tipo 2/i, ['Metformina 850mg']],
  [/diabetes tipo 1/i, ['Insulina Glargina']],
  [/card[ií]aca/i, ['Digoxina 0.25mg', 'Furosemida 40mg', 'Clopidogrel 75mg']],
  [/alzheimer|demencia/i, ['Donepezilo 10mg']],
  [/parkinson/i, ['Pramipexol 0.25mg']],
  [/osteoporosis/i, ['Alendronato 70mg']],
  [/hipotiroid/i, ['Levotiroxina 50mcg']],
  [/artritis|epoc/i, ['Paracetamol 500mg']],
];

/** Datos clínicos de demostración: documentos, signos vitales, prescripciones y administraciones. Idempotente. */
export async function seedClinico(client) {
  const r = rng(99);
  await client.query(`UPDATE pacientes SET documento = (10000000 + id * 7919)::text WHERE documento IS NULL`);

  // Completa el catálogo de demostración en bases antiguas (p. ej. antibióticos para probar alergias).
  for (const m of MEDS) {
    await client.query(
      `INSERT INTO medicamentos (nombre, descripcion, presentacion, dosis, via_administracion, cantidad_disponible, fecha_caducidad, lote, proveedor, stock_minimo)
       SELECT $1::text, $2::text, $3::text, $4::text, $5::text, $6::int, CURRENT_DATE + $7::int, $8::text, $9::text, $10::int WHERE NOT EXISTS (SELECT 1 FROM medicamentos WHERE nombre = $1::text)`, m);
  }

  // Bases creadas con datos antiguos: si TODOS los medicamentos ya están vencidos, se renuevan las fechas de la demo.
  const vig = await client.query(`SELECT COUNT(*) FILTER (WHERE fecha_caducidad > CURRENT_DATE) AS vigentes, COUNT(*) AS total FROM medicamentos`);
  if (vig.rows[0].total > 0 && vig.rows[0].vigentes === 0) {
    await client.query(`UPDATE medicamentos SET fecha_caducidad = CURRENT_DATE + 120 + ((id * 37) % 300)`);
    console.log('✅ Fechas de caducidad de la demo renovadas (estaban todas vencidas)');
  }

  const { rows: sv } = await client.query('SELECT COUNT(*) AS n FROM signos_vitales');
  const ps = (await client.query('SELECT id, enfermedades_cronicas, alergias FROM pacientes WHERE activo ORDER BY id')).rows;
  const us = (await client.query(`SELECT id FROM usuarios WHERE rol = 'enfermera' ORDER BY id LIMIT 8`)).rows;

  if (Number(sv[0].n) === 0) {
    for (const [i, p] of ps.entries()) {
      for (let d = 6; d >= 0; d--) {
        for (const hora of [8, 20]) {
          const base = { sis: 118 + Math.floor(r() * 20), dia: 70 + Math.floor(r() * 12), fc: 66 + Math.floor(r() * 20), t: 36.2 + r() * 0.8, spo: 95 + Math.floor(r() * 4), fr: 14 + Math.floor(r() * 4), glu: 90 + Math.floor(r() * 40) };
          // Algunos residentes con lecturas alteradas en las últimas 24 h para que estados y alertas sean reales
          if (d === 0 && hora === 8) {
            if (i % 7 === 2) Object.assign(base, { sis: 152, dia: 94, fc: 104 });
            if (i % 11 === 4) Object.assign(base, { spo: 88, fc: 124, t: 38.6, fr: 26 });
            if (i % 9 === 5) Object.assign(base, { t: 38.2, spo: 93 });
          }
          await client.query(
            `INSERT INTO signos_vitales (paciente_id, usuario_id, presion_sistolica, presion_diastolica, frecuencia_cardiaca, temperatura, saturacion_oxigeno, frecuencia_respiratoria, glucosa, fecha_registro)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9, date_trunc('day', NOW()) - ($10 || ' days')::interval + ($11 || ' hours')::interval)`,
            [p.id, us[Math.floor(r() * us.length)].id, base.sis, base.dia, base.fc, base.t.toFixed(1), base.spo, base.fr, base.glu, String(d), String(hora)]);
        }
      }
    }
    // El último registro puede quedar en el futuro (hoy 20:00): se descartan
    await client.query(`DELETE FROM signos_vitales WHERE fecha_registro > NOW()`);
    console.log('✅ Signos vitales de demostración creados');
  }

  const { rows: pr } = await client.query('SELECT COUNT(*) AS n FROM medicamentos_pacientes');
  if (Number(pr[0].n) === 0) {
    const meds = (await client.query('SELECT id, nombre FROM medicamentos')).rows;
    const porNombre = Object.fromEntries(meds.map((m) => [m.nombre, m.id]));
    const horariosPor = [['08:00'], ['08:00', '20:00'], ['08:00', '14:00', '20:00'], ['09:00']];
    const jefe = (await client.query(`SELECT id FROM usuarios WHERE rol = 'jefe_enfermeria' LIMIT 1`)).rows[0];
    const alergia = (a, n) => a && a.toLowerCase().split(/[,;]/).some((x) => n.toLowerCase().includes(x.trim().slice(0, 5)) && x.trim().length > 3);
    let total = 0;
    for (const p of ps) {
      const nombres = new Set();
      for (const [re, lista] of CRONICAS_A_MEDS) if (re.test(p.enfermedades_cronicas || '')) nombres.add(lista[Math.floor(r() * lista.length)]);
      for (const nombre of [...nombres].slice(0, 3)) {
        if (alergia(p.alergias, nombre) || !porNombre[nombre]) continue;
        const h = horariosPor[Math.floor(r() * horariosPor.length)];
        const frecuencia = h.length === 1 ? 'Una vez al día' : h.length === 2 ? 'Cada 12 horas' : 'Cada 8 horas';
        const dosis = (await client.query('SELECT dosis FROM medicamentos WHERE id = $1', [porNombre[nombre]])).rows[0].dosis;
        await client.query(
          `INSERT INTO medicamentos_pacientes (paciente_id, medicamento_id, dosis_prescrita, frecuencia, via_administracion, fecha_inicio, horarios, unidades_por_dosis, prescrito_por, fecha_asignacion)
           VALUES ($1,$2,$3,$4,'Oral', CURRENT_DATE - 30, $5, 1, $6, NOW() - INTERVAL '30 days')`,
          [p.id, porNombre[nombre], dosis, frecuencia, h.join(','), jefe?.id ?? null]);
        total++;
      }
    }
    console.log(`✅ ${total} prescripciones de demostración creadas`);

    // Historial de administraciones de los últimos 4 días + hoy (algunas pendientes y alguna atrasada)
    await client.query(
      `INSERT INTO administraciones_medicamentos (paciente_id, medicamento_id, medicamento_paciente_id, estado, horario_programado, dosis_administrada)
       SELECT mp.paciente_id, mp.medicamento_id, mp.id, 'programada', (d.dia::date + trim(h.hora)::time), mp.dosis_prescrita
       FROM medicamentos_pacientes mp CROSS JOIN generate_series(CURRENT_DATE - 4, CURRENT_DATE, interval '1 day') d(dia)
       CROSS JOIN LATERAL unnest(string_to_array(mp.horarios, ',')) h(hora)
       ON CONFLICT DO NOTHING`);
    const filas = (await client.query(`SELECT id, horario_programado FROM administraciones_medicamentos WHERE estado = 'programada' AND horario_programado < NOW() - INTERVAL '90 minutes' ORDER BY id`)).rows;
    for (const f of filas) {
      const x = r();
      if (x < 0.9) await client.query(`UPDATE administraciones_medicamentos SET estado = 'administrada', usuario_id = $2, horario_administracion = horario_programado + INTERVAL '8 minutes', unidades_descontadas = 1 WHERE id = $1`, [f.id, us[Math.floor(r() * us.length)].id]);
      else if (x < 0.96) await client.query(`UPDATE administraciones_medicamentos SET estado = 'omitida', motivo_omision = 'Residente dormido, se reintentará', usuario_id = $2, horario_administracion = horario_programado + INTERVAL '15 minutes' WHERE id = $1`, [f.id, us[0].id]);
      else await client.query(`UPDATE administraciones_medicamentos SET estado = 'rechazada', motivo_omision = 'El residente se negó a tomarla', usuario_id = $2, horario_administracion = horario_programado + INTERVAL '10 minutes' WHERE id = $1`, [f.id, us[1].id]);
    }
    // Las dosis ya registradas como administradas del pasado no descuentan stock real en la demo (stock inicial ya es el vigente).
    console.log('✅ Administraciones de demostración creadas');
  }

  for (const p of ps) await recalcularEstado(p.id, client);
  console.log('✅ Estados de residentes calculados');
}
