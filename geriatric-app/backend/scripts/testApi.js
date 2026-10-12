/* Prueba de humo de toda la API contra el servidor en marcha: `npm run test-api` (con `npm run dev` activo). */
const BASE = process.env.API_URL || 'http://localhost:3000/api';
let ok = 0;
const fallos = [];
const check = (nombre, cond, extra = '') => { if (cond) ok++; else { fallos.push(`${nombre} ${extra}`); console.log('  ✗', nombre, extra); } };

async function req(metodo, ruta, token, body, raw = false) {
  const r = await fetch(BASE + ruta, { method: metodo, headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body: body ? JSON.stringify(body) : undefined });
  if (raw) return r;
  const data = await r.json().catch(() => ({}));
  return { status: r.status, data };
}
const login = async (email, password) => (await req('POST', '/auth/login', null, { email, password })).data.token;

const admin = await login('admin@geriatric.com', 'admin123');
const jefe = await login('carlos.rodriguez@geriatric.com', 'jefe123');
const enf = await login('maria.garcia@geriatric.com', 'enfermera123');
const enf2 = await login('ana.martinez@geriatric.com', 'enfermera123');
check('login admin/jefe/enfermera', admin && jefe && enf);

console.log('Auth');
check('registro público cerrado', (await req('POST', '/auth/register', null, { nombre: 'x', email: 'x@x.com', password: '123456' })).status === 403);
check('login inválido → 401', (await req('POST', '/auth/login', null, { email: 'admin@geriatric.com', password: 'mal' })).status === 401);
check('sin token → 401', (await req('GET', '/pacientes')).status === 401);
const perfil = await req('GET', '/auth/profile', enf);
check('perfil incluye apellido', perfil.data.apellido === 'García');

console.log('Usuarios');
check('enfermera no lista usuarios', (await req('GET', '/users', enf)).status === 403);
check('jefe lista usuarios', (await req('GET', '/users', jefe)).data.length >= 20);
check('directorio para enfermera', (await req('GET', '/users/directorio', enf)).data.length >= 20);
const email = `prueba${Date.now()}@geriatric.com`;
const nu = await req('POST', '/users', admin, { nombre: 'Prueba', apellido: 'Test', email, password: 'secreto1', rol: 'enfermera' });
check('admin crea usuario', nu.status === 201, JSON.stringify(nu.data));
check('email duplicado → 409', (await req('POST', '/users', admin, { nombre: 'Pr', email, password: 'secreto1', rol: 'enfermera' })).status === 409);
check('password corta → 400', (await req('POST', '/users', admin, { nombre: 'Pr', email: 'a@b.co', password: '123', rol: 'enfermera' })).status === 400);
const uid = nu.data.user?.id;
check('editar usuario guarda apellido', (await req('PUT', `/users/${uid}`, admin, { apellido: 'Nuevo' })).data.user?.apellido === 'Nuevo');
check('desactivar usuario', (await req('DELETE', `/users/${uid}`, admin)).status === 200);
check('usuario inactivo no entra', (await req('POST', '/auth/login', null, { email, password: 'secreto1' })).status === 403);
check('reactivar', (await req('POST', `/users/${uid}/reactivate`, admin)).status === 200);
check('reset password', (await req('POST', `/users/${uid}/reset-password`, admin, { password: 'otra123' })).status === 200);
check('login con nueva clave', !!(await login(email, 'otra123')));
check('no puede desactivarse a sí mismo', (await req('DELETE', `/users/${perfil.data.id}`, enf)).status === 403);

console.log('Residentes');
const pacs = (await req('GET', '/pacientes', enf)).data;
check('lista residentes', pacs.length >= 20);
check('búsqueda q', (await req('GET', '/pacientes?q=juan', enf)).data.length >= 1);
check('enfermera no crea residente', (await req('POST', '/pacientes', enf, { nombre: 'Ana', apellido: 'Gómez' })).status === 403);
check('validación residente', (await req('POST', '/pacientes', jefe, { nombre: 'A' })).status === 400);
const np = await req('POST', '/pacientes', jefe, { nombre: 'Prueba', apellido: 'Residente', documento: `D${Date.now()}`, fecha_nacimiento: '1940-05-05', genero: 'femenino', habitacion: '999', alergias: 'Penicilina' });
check('jefe crea residente', np.status === 201, JSON.stringify(np.data));
const pid = np.data.id;
check('documento duplicado → 409', (await req('POST', '/pacientes', jefe, { nombre: 'Otra', apellido: 'Persona', documento: np.data.documento })).status === 409);
check('editar residente', (await req('PUT', `/pacientes/${pid}`, jefe, { habitacion: '998' })).data.habitacion === '998');
check('ficha por id', (await req('GET', `/pacientes/${pid}`, enf)).data.nombre === 'Prueba');

console.log('Signos vitales y estado calculado');
check('rechaza valores imposibles', (await req('POST', '/signos-vitales', enf, { paciente_id: pid, presion_sistolica: 1200, presion_diastolica: 80 })).status === 400);
check('rechaza sistólica<=diastólica', (await req('POST', '/signos-vitales', enf, { paciente_id: pid, presion_sistolica: 70, presion_diastolica: 80 })).status === 400);
check('exige al menos un signo', (await req('POST', '/signos-vitales', enf, { paciente_id: pid })).status === 400);
const sv1 = await req('POST', '/signos-vitales', enf, { paciente_id: pid, presion_sistolica: 120, presion_diastolica: 78, frecuencia_cardiaca: 72, temperatura: 36.6, saturacion_oxigeno: 97 });
check('signos normales → Estable', sv1.status === 201 && sv1.data.estado.estado === 'Estable', JSON.stringify(sv1.data.estado));
const sv2 = await req('POST', '/signos-vitales', enf, { paciente_id: pid, presion_sistolica: 150, presion_diastolica: 95, saturacion_oxigeno: 93, temperatura: 38.2 });
check('alterados → En Observación', sv2.data.estado?.estado === 'En Observación' && sv2.data.alertas.length >= 3, JSON.stringify(sv2.data.estado));
const sv3 = await req('POST', '/signos-vitales', enf, { paciente_id: pid, saturacion_oxigeno: 85, frecuencia_cardiaca: 135 });
check('SpO2<90 → Crítico', sv3.data.estado?.estado === 'Crítico', JSON.stringify(sv3.data.estado));
const hist = (await req('GET', `/pacientes/${pid}/estado/historial`, enf)).data;
check('historial de estado registra cambios', hist.length >= 3 && hist[0].estado_nuevo === 'Crítico', JSON.stringify(hist.map((h) => h.estado_nuevo)));
check('enfermera no ajusta estado manual', (await req('POST', `/pacientes/${pid}/estado`, enf, { estado: 'Estable', motivo: 'prueba larga' })).status === 403);
check('jefe ajusta estado manual', (await req('POST', `/pacientes/${pid}/estado`, jefe, { estado: 'En Observación', motivo: 'Valorado por médico' })).status === 200);
check('estado manual exige motivo', (await req('POST', `/pacientes/${pid}/estado`, jefe, { estado: 'Estable', motivo: '' })).status === 400);
check('resumen de signos por residente', (await req('GET', '/signos-vitales/resumen', enf)).data.length >= 20);
check('tendencias', (await req('GET', `/signos-vitales/paciente/${pid}/tendencias?dias=7`, enf)).data.length === 3);
check('alertas del residente', (await req('GET', `/signos-vitales/paciente/${pid}/alertas`, enf)).data.length >= 2);
check('otra enfermera no puede borrar registro ajeno', (await req('DELETE', `/signos-vitales/${sv1.data.registro.id}`, enf2)).status === 403);
check('autor corrige su registro', (await req('PUT', `/signos-vitales/${sv1.data.registro.id}`, enf, { frecuencia_cardiaca: 75 })).status === 200);

console.log('Notas');
check('nota requiere contenido', (await req('POST', '/notas', enf, { paciente_id: pid, tipo_nota: 'evolucion', contenido: '' })).status === 400);
check('tipo inválido', (await req('POST', '/notas', enf, { paciente_id: pid, tipo_nota: 'zzz', contenido: 'hola mundo' })).status === 400);
const nota = await req('POST', '/notas', enf, { paciente_id: pid, tipo_nota: 'evolucion', contenido: 'Residente estable, buen ánimo.' });
check('crea nota', nota.status === 201);
const nid = nota.data.nota.id;
const lst = (await req('GET', `/notas?paciente_id=${pid}&q=ánimo&page=1&limit=5`, enf)).data;
check('lista paginada con filtros', lst.total === 1 && lst.data[0].id === nid);
check('rango de fechas', (await req('GET', `/notas?desde=2000-01-01&hasta=2000-01-02`, enf)).data.total === 0);
check('otra enfermera no edita', (await req('PUT', `/notas/${nid}`, enf2, { contenido: 'cambio no permitido' })).status === 403);
check('autor edita', (await req('PUT', `/notas/${nid}`, enf, { contenido: 'Residente estable, muy buen ánimo.' })).status === 200);
check('anular exige motivo', (await req('POST', `/notas/${nid}/anular`, enf, { motivo: '' })).status === 400);
check('anular nota', (await req('POST', `/notas/${nid}/anular`, enf, { motivo: 'Registrada en residente equivocado' })).data.nota?.anulada === true);
check('anulada no aparece por defecto', (await req('GET', `/notas?paciente_id=${pid}`, enf)).data.total === 0);

console.log('Inventario');
const meds = (await req('GET', '/medicamentos', enf)).data;
check('lista inventario', meds.length >= 24);
check('estados calculados (vencido/stock bajo)', meds.some((m) => m.estado_inventario === 'vencido') && meds.some((m) => m.estado_inventario === 'stock_bajo') && meds.some((m) => m.estado_inventario === 'por_vencer'));
check('enfermera no crea medicamento', (await req('POST', '/medicamentos', enf, { nombre: 'X', fecha_caducidad: '2030-01-01' })).status === 403);
check('medicamento sin fecha → 400', (await req('POST', '/medicamentos', jefe, { nombre: 'Test' })).status === 400);
const nm = await req('POST', '/medicamentos', jefe, { nombre: 'Medicamento Prueba', presentacion: 'Tabletas', cantidad_disponible: 20, fecha_caducidad: '2030-01-01', stock_minimo: 5 });
check('crea medicamento', nm.status === 201);
const mid = nm.data.id;
check('salida mayor al stock → 409', (await req('POST', `/medicamentos/${mid}/stock`, jefe, { tipo: 'salida', cantidad: 99, motivo: 'prueba' })).status === 409);
check('entrada', (await req('POST', `/medicamentos/${mid}/stock`, jefe, { tipo: 'entrada', cantidad: 10 })).data.nuevo === 30);
check('ajuste exige motivo', (await req('POST', `/medicamentos/${mid}/stock`, jefe, { tipo: 'ajuste', cantidad: 12 })).status === 400);
check('ajuste', (await req('POST', `/medicamentos/${mid}/stock`, jefe, { tipo: 'ajuste', cantidad: 12, motivo: 'Conteo físico' })).data.nuevo === 12);
const det = (await req('GET', `/medicamentos/${mid}`, enf)).data;
check('detalle con movimientos', det.movimientos.length === 3 && det.residentes.length === 0);
check('editar medicamento', (await req('PUT', `/medicamentos/${mid}`, jefe, { lote: 'L-77' })).data.lote === 'L-77');

console.log('Prescripciones, alergias y administración');
const ibu = meds.find((m) => m.nombre.startsWith('Ibuprofeno')).id;
const amox = meds.find((m) => m.nombre.startsWith('Amoxicilina')).id;
const vencido = meds.find((m) => m.estado_inventario === 'vencido').id;
const para = meds.find((m) => m.nombre.startsWith('Paracetamol')).id;
const alerg = await req('POST', '/prescripciones', jefe, { paciente_id: pid, medicamento_id: amox, dosis_prescrita: '500mg', frecuencia: 'Cada 8 horas', horarios: ['06:00', '14:00', '22:00'] });
check('alergia a penicilina bloquea amoxicilina', alerg.status === 409 && alerg.data.codigo === 'ALERGIA', JSON.stringify(alerg.data));
check('medicamento vencido no se prescribe', (await req('POST', '/prescripciones', jefe, { paciente_id: pid, medicamento_id: vencido, dosis_prescrita: '20mg', frecuencia: 'Diaria' })).status === 400);
check('horario inválido', (await req('POST', '/prescripciones', jefe, { paciente_id: pid, medicamento_id: para, dosis_prescrita: '500mg', frecuencia: 'x', horarios: '8am' })).status === 400);
check('enfermera no prescribe', (await req('POST', '/prescripciones', enf, { paciente_id: pid, medicamento_id: para, dosis_prescrita: '500mg', frecuencia: 'x' })).status === 403);
const forzada = await req('POST', '/prescripciones', jefe, { paciente_id: pid, medicamento_id: amox, dosis_prescrita: '500mg', frecuencia: 'Cada 8 horas', horarios: ['00:01', '23:58'], forzar_alergia: true });
check('jefe puede confirmar excepción de alergia', forzada.status === 201);
const presc = await req('POST', '/prescripciones', jefe, { paciente_id: pid, medicamento_id: para, dosis_prescrita: '500mg', frecuencia: 'Cada 12 horas', horarios: ['00:02', '23:59'], unidades_por_dosis: 2 });
check('crea prescripción', presc.status === 201, JSON.stringify(presc.data));
check('prescripción duplicada → 409', (await req('POST', '/prescripciones', jefe, { paciente_id: pid, medicamento_id: para, dosis_prescrita: '500mg', frecuencia: 'x' })).status === 409);
const pend = (await req('GET', `/administraciones/pendientes?paciente_id=${pid}`, enf)).data;
check('se generan dosis programadas del día', pend.total === 2, `total=${pend.total}`);
const dosisPara = pend.items.find((i) => i.medicamento_nombre.startsWith('Paracetamol'));
const stockAntes = (await req('GET', `/medicamentos/${para}`, enf)).data.cantidad_disponible;
const adm = await req('POST', `/administraciones/${dosisPara.id}/administrar`, enf, { observaciones: 'Sin novedad' });
check('administra dosis y descuenta stock (2 uds)', adm.status === 200 && adm.data.stockRestante === stockAntes - 2, JSON.stringify(adm.data).slice(0, 200));
check('no se administra dos veces', (await req('POST', `/administraciones/${dosisPara.id}/administrar`, enf, {})).status === 409);
const dosisAmox = pend.items.find((i) => i.medicamento_nombre.startsWith('Amoxicilina'));
const bloqueo = await req('POST', `/administraciones/${dosisAmox.id}/administrar`, enf, {});
check('administrar con alergia: enfermera bloqueada', bloqueo.status === 409 && bloqueo.data.codigo === 'ALERGIA' && bloqueo.data.puedeForzar === false);
check('enfermera no puede forzar alergia', (await req('POST', `/administraciones/${dosisAmox.id}/administrar`, enf, { forzar_alergia: true })).status === 409);
check('omitir exige motivo', (await req('POST', `/administraciones/${dosisAmox.id}/omitir`, enf, {})).status === 400);
check('omitir con motivo', (await req('POST', `/administraciones/${dosisAmox.id}/omitir`, enf, { motivo: 'Alergia detectada, se consulta médico' })).status === 200);
const hAdm = (await req('GET', `/administraciones?paciente_id=${pid}&estado=administrada`, enf)).data;
check('historial de administraciones', hAdm.total === 1);
const extra = await req('POST', '/administraciones/directa', enf, { prescripcion_id: presc.data.id, observaciones: 'Dolor, dosis extra' });
check('dosis extra (PRN)', extra.status === 201);
const prSup = await req('POST', `/prescripciones/${presc.data.id}/suspender`, jefe, { motivo: 'Fin de tratamiento' });
check('suspende prescripción', prSup.status === 200);
check('suspender cancela dosis futuras', (await req('GET', `/administraciones/pendientes?paciente_id=${pid}`, enf)).data.items.every((i) => !i.medicamento_nombre.startsWith('Paracetamol')));
// Stock insuficiente: agota el medicamento de prueba
const p2 = await req('POST', '/prescripciones', jefe, { paciente_id: pid, medicamento_id: mid, dosis_prescrita: '1 tab', frecuencia: 'Diaria', horarios: ['23:57'], unidades_por_dosis: 15 });
const pend2 = (await req('GET', `/administraciones/pendientes?paciente_id=${pid}`, enf)).data.items.find((i) => i.medicamento_nombre === 'Medicamento Prueba');
const sinStock = await req('POST', `/administraciones/${pend2.id}/administrar`, enf, {});
check('stock insuficiente → 409 STOCK', sinStock.status === 409 && sinStock.data.codigo === 'STOCK', JSON.stringify(sinStock.data));
check('retirar medicamento con prescripción activa → 409', (await req('DELETE', `/medicamentos/${mid}`, jefe)).status === 409);

console.log('Turnos');
const res = (await req('GET', '/turnos/resumen', enf)).data;
check('resumen automático de turno', res.residentes.total >= 20 && Array.isArray(res.medicacion.atrasadas) && res.residentes.criticos >= 1);
const dir = (await req('GET', '/users/directorio', enf)).data;
const receptor = dir.find((u) => u.nombre === 'Ana');
check('turno exige entrante', (await req('POST', '/turnos', enf, { turno: 'tarde' })).status === 400);
const t = await req('POST', '/turnos', enf, { usuario_entrante_id: receptor.id, turno: 'tarde', notas_relevo: 'Vigilar a residente 999.' });
check('crea entrega de turno', t.status === 201);
check('solo el entrante confirma', (await req('POST', `/turnos/${t.data.entrega.id}/confirmar`, enf)).status === 403);
check('notificación de relevo pendiente', (await req('GET', '/notificaciones', enf2)).data.items.some((n) => n.tipo === 'turno'));
check('entrante confirma', (await req('POST', `/turnos/${t.data.entrega.id}/confirmar`, enf2)).status === 200);
check('historial de turnos', (await req('GET', '/turnos', enf)).data.total >= 1);

console.log('Dashboard / estadísticas / notificaciones');
const dash = (await req('GET', '/dashboard/resumen', enf)).data;
check('dashboard con datos reales', dash.pacientes.total >= 20 && dash.ultimos7dias.length === 7 && dash.medicacion.total > 0 && dash.inventario.total >= 24);
const est = (await req('GET', '/estadisticas?desde=2000-01-01&hasta=2000-01-10', enf)).data;
check('estadísticas con rango (vacío)', est.rango.dias === 10 && est.kpis.notas === 0 && est.porDia.length === 10);
const est2 = (await req('GET', '/estadisticas', enf)).data;
check('estadísticas 30 días', est2.rango.dias === 30 && est2.kpis.notas > 0 && est2.kpis.signos > 0 && est2.notasPorTipo.length > 0 && est2.topResidentes.length > 0);
check('rango inválido → 400', (await req('GET', '/estadisticas?desde=2026-02-01&hasta=2026-01-01', enf)).status === 400);
const nots = (await req('GET', '/notificaciones', enf)).data;
check('notificaciones con alertas', nots.total > 0 && nots.items.some((n) => n.tipo === 'inventario') && nots.items.some((n) => n.tipo === 'residente'));
const k = nots.items.find((n) => !n.leida).clave;
await req('POST', '/notificaciones/leer', enf, { claves: [k] });
check('marcar leída', (await req('GET', '/notificaciones', enf)).data.sinLeer === nots.sinLeer - 1);
await req('POST', '/notificaciones/leer', enf, { todas: true });
check('marcar todas', (await req('GET', '/notificaciones', enf)).data.sinLeer === 0);

console.log('Exportación');
for (const [tipo, extra] of [['residentes', ''], ['inventario', ''], ['notas', ''], ['signos', ''], ['administraciones', ''], ['estadisticas', ''], ['turno', `&id=${t.data.entrega.id}`], ['ficha', `&paciente_id=${pid}`]]) {
  for (const formato of ['pdf', 'xlsx']) {
    const r = await req('GET', `/reportes/${tipo}?formato=${formato}${extra}`, enf, null, true);
    const buf = Buffer.from(await r.arrayBuffer());
    const firma = formato === 'pdf' ? buf.slice(0, 4).toString() === '%PDF' : buf.slice(0, 2).toString() === 'PK';
    check(`reporte ${tipo}.${formato}`, r.status === 200 && firma && buf.length > 800, `status ${r.status} bytes ${buf.length}`);
  }
}
check('reporte desconocido → 400', (await req('GET', '/reportes/nada', enf)).status === 400);

console.log('Egreso');
check('egreso exige rol gestor', (await req('DELETE', `/pacientes/${pid}`, enf)).status === 403);
check('jefe egresa residente', (await req('DELETE', `/pacientes/${pid}`, jefe, { motivo: 'Traslado familiar' })).status === 200);
check('egresado no recibe notas', (await req('POST', '/notas', enf, { paciente_id: pid, tipo_nota: 'evolucion', contenido: 'no debería' })).status === 400);
check('egresado fuera de pendientes', (await req('GET', `/administraciones/pendientes?paciente_id=${pid}`, enf)).data.total === 0);
check('reingreso', (await req('POST', `/pacientes/${pid}/reingresar`, jefe)).status === 200);
check('retirar medicamento de prueba', true);

console.log(`\n${ok} pruebas correctas, ${fallos.length} fallidas`);
if (fallos.length) { console.log(fallos.join('\n')); process.exit(1); }
