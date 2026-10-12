import { FormEvent, useState } from 'react';
import { api } from '../api/client';
import { useApp } from '../context/AppContext';
import { useToast } from '../context/ToastContext';
import type { Administracion, Medicamento, Paginado, Prescripcion } from '../types';
import { ApiError } from '../api/client';
import { ESTADOS_ADMIN, fmtFecha, fmtFechaHora, fmtHora, mensajeError, nombreCompleto } from '../utils/format';
import PacienteSelect from './PacienteSelect';
import { IconoAlerta, IconoMas } from './Icons';
import { Campo, Cargando, Chips, Confirmar, ErrorBox, Modal, Paginacion, Vacio, useCarga } from './ui';

/* ===================== Administrar / omitir una dosis ===================== */
export function AccionesDosis({ dosis, onHecho }: { dosis: Administracion; onHecho: () => void }) {
  const { refrescar } = useApp();
  const toast = useToast();
  const [modo, setModo] = useState<null | 'administrar' | 'omitir' | 'rechazada'>(null);
  const [alergia, setAlergia] = useState<null | { mensaje: string; puedeForzar: boolean }>(null);
  const [obs, setObs] = useState('');
  const [enviando, setEnviando] = useState(false);

  const terminar = () => { setModo(null); setAlergia(null); setObs(''); refrescar(); onHecho(); };

  const administrar = async (forzar = false) => {
    setEnviando(true);
    try {
      const r = await api.post(`/administraciones/${dosis.id}/administrar`, { observaciones: obs, forzar_alergia: forzar });
      toast(`Dosis administrada. Stock restante: ${r.stockRestante}${r.stockBajo ? ' (stock bajo)' : ''}`, r.stockBajo ? 'warning' : 'success');
      terminar();
    } catch (e) {
      if (e instanceof ApiError && e.data?.codigo === 'ALERGIA') setAlergia({ mensaje: e.message, puedeForzar: !!e.data.puedeForzar });
      else toast(mensajeError(e), 'error');
    } finally { setEnviando(false); }
  };

  return (
    <>
      <span className="barra" style={{ justifyContent: 'flex-end' }}>
        <button className="btn btn--sm btn--ok" onClick={() => setModo('administrar')}>Administrar</button>
        <button className="btn btn--sm" onClick={() => setModo('omitir')}>Omitir</button>
        <button className="btn btn--sm" onClick={() => setModo('rechazada')}>Rechazó</button>
      </span>

      {modo === 'administrar' && !alergia && (
        <Modal titulo="Confirmar administración" tam="chico" onClose={() => setModo(null)} pie={<>
          <button className="btn" onClick={() => setModo(null)}>Cancelar</button>
          <button className="btn btn--ok" disabled={enviando} onClick={() => administrar(false)}>{enviando ? 'Registrando…' : 'Confirmar administración'}</button></>}>
          <div><b>{dosis.medicamento_nombre}</b> · {dosis.dosis_administrada ?? ''}<br />
            {dosis.paciente_nombre} {dosis.paciente_apellido} · Hab. {dosis.habitacion ?? '—'}<br /><small>Programada {fmtHora(dosis.horario_programado)} · Se descontarán {dosis.unidades_por_dosis ?? 1} unidad(es) del inventario (stock actual: {dosis.stock})</small></div>
          {dosis.paciente_alergias && !/^ning/i.test(dosis.paciente_alergias) && <div className="alerta alerta--warn"><IconoAlerta size={16} /><span>Alergias del residente: <b>{dosis.paciente_alergias}</b></span></div>}
          <Campo etiqueta="Observaciones (opcional)"><textarea className="textarea" rows={2} value={obs} onChange={(e) => setObs(e.target.value)} /></Campo>
        </Modal>)}

      {alergia && (
        <Modal titulo="⚠️ Alergia detectada" tam="chico" onClose={() => setAlergia(null)} pie={<>
          <button className="btn" onClick={() => setAlergia(null)}>Cancelar administración</button>
          {alergia.puedeForzar && <button className="btn btn--peligro" disabled={enviando} onClick={() => administrar(true)}>Confirmar y administrar de todos modos</button>}</>}>
          <div className="alerta alerta--error"><span>{alergia.mensaje}</span></div>
          <p>{alergia.puedeForzar ? 'Como jefe/administrador puedes confirmar una excepción; quedará registrada en la auditoría.' : 'No puedes administrar esta dosis. Consulta al jefe de enfermería o al médico tratante, y registra la omisión con su motivo.'}</p>
        </Modal>)}

      {(modo === 'omitir' || modo === 'rechazada') && (
        <Confirmar titulo={modo === 'omitir' ? 'Omitir dosis' : 'Registrar rechazo del residente'} pedirMotivo etiquetaMotivo={modo === 'omitir' ? 'Motivo de la omisión' : 'Detalle del rechazo'} textoAceptar="Registrar"
          mensaje={<><b>{dosis.medicamento_nombre}</b> · {dosis.paciente_nombre} {dosis.paciente_apellido} ({fmtHora(dosis.horario_programado)})</>}
          onCancelar={() => setModo(null)}
          onAceptar={async (motivo) => { await api.post(`/administraciones/${dosis.id}/omitir`, { motivo, estado: modo === 'rechazada' ? 'rechazada' : 'omitida' }); toast('Registro guardado', 'success'); terminar(); }} />)}
    </>
  );
}

/* ===================== Formulario de prescripción ===================== */
const PRESETS: Record<string, string[]> = {
  'Una vez al día': ['08:00'], 'Cada 12 horas': ['08:00', '20:00'], 'Cada 8 horas': ['06:00', '14:00', '22:00'], 'Cada 6 horas': ['06:00', '12:00', '18:00', '00:00'],
  'Si es necesario (PRN)': [], 'Personalizada': [],
};

export function PrescripcionFormModal({ pacienteId, prescripcion, onClose, onGuardado }: { pacienteId?: number; prescripcion?: Prescripcion | null; onClose: () => void; onGuardado: () => void }) {
  const toast = useToast();
  const { refrescar } = useApp();
  const meds = useCarga(() => api.get<Medicamento[]>('/medicamentos'), []);
  const [paciente, setPaciente] = useState<number | ''>(prescripcion?.paciente_id ?? pacienteId ?? '');
  const [medId, setMedId] = useState<number | ''>(prescripcion?.medicamento_id ?? '');
  const [dosis, setDosis] = useState(prescripcion?.dosis_prescrita ?? '');
  const [frecuencia, setFrecuencia] = useState(prescripcion?.frecuencia ?? 'Una vez al día');
  const [horarios, setHorarios] = useState<string[]>(prescripcion?.horarios ? prescripcion.horarios.split(',') : ['08:00']);
  const [nuevo, setNuevo] = useState('');
  const [unidades, setUnidades] = useState(String(prescripcion?.unidades_por_dosis ?? 1));
  const [inicio, setInicio] = useState(prescripcion?.fecha_inicio ?? '');
  const [fin, setFin] = useState(prescripcion?.fecha_fin ?? '');
  const [obs, setObs] = useState(prescripcion?.observaciones ?? '');
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState('');
  const [alergia, setAlergia] = useState<string | null>(null);

  const elegirFrecuencia = (f: string) => { setFrecuencia(f); if (f !== 'Personalizada') setHorarios(PRESETS[f] ?? []); };
  const agregar = () => { if (/^([01]\d|2[0-3]):[0-5]\d$/.test(nuevo) && !horarios.includes(nuevo)) { setHorarios([...horarios, nuevo].sort()); setFrecuencia('Personalizada'); setNuevo(''); } };
  const medSel = meds.datos?.find((m) => m.id === medId);

  const guardar = async (e?: FormEvent, forzar = false) => {
    e?.preventDefault();
    if (!prescripcion && (!paciente || !medId)) return setError('Selecciona residente y medicamento');
    if (!dosis.trim()) return setError('Indica la dosis prescrita');
    setEnviando(true); setError('');
    try {
      const body = { dosis_prescrita: dosis, frecuencia, horarios, unidades_por_dosis: Number(unidades), fecha_fin: fin || (prescripcion ? null : undefined), observaciones: obs };
      if (prescripcion) await api.put(`/prescripciones/${prescripcion.id}`, body);
      else await api.post('/prescripciones', { ...body, paciente_id: paciente, medicamento_id: medId, fecha_inicio: inicio || undefined, forzar_alergia: forzar });
      toast(prescripcion ? 'Prescripción actualizada' : 'Prescripción creada: las dosis de hoy ya están programadas', 'success');
      refrescar(); onGuardado(); onClose();
    } catch (err) {
      if (err instanceof ApiError && err.data?.codigo === 'ALERGIA') setAlergia(err.message); else setError(mensajeError(err));
    } finally { setEnviando(false); }
  };

  return (
    <Modal titulo={prescripcion ? `Editar prescripción · ${prescripcion.medicamento_nombre}` : 'Nueva prescripción'} tam="ancho" onClose={onClose} pie={<>
      <button type="button" className="btn" onClick={onClose}>Cancelar</button>
      <button form="form-presc" className="btn btn--p" disabled={enviando}>{enviando ? 'Guardando…' : 'Guardar prescripción'}</button></>}>
      <form id="form-presc" onSubmit={(e) => guardar(e)} className="form-grid">
        {error && <div className="alerta alerta--error ancho" role="alert">{error}</div>}
        {alergia && <div className="alerta alerta--error ancho" role="alert"><IconoAlerta size={16} /><span><b>{alergia}</b><br />
          <button type="button" className="btn btn--sm btn--peligro" style={{ marginTop: 6 }} onClick={() => guardar(undefined, true)}>Confirmar excepción y prescribir</button></span></div>}
        {!prescripcion && !pacienteId && <Campo etiqueta="Residente" requerido><PacienteSelect valor={paciente} onChange={setPaciente} /></Campo>}
        {!prescripcion && <Campo etiqueta="Medicamento" requerido>
          <select className="select" value={medId} onChange={(e) => { const id = e.target.value ? Number(e.target.value) : ''; setMedId(id); const m = meds.datos?.find((x) => x.id === id); if (m?.dosis && !dosis) setDosis(m.dosis); }}>
            <option value="">{meds.cargando ? 'Cargando…' : 'Selecciona…'}</option>
            {(meds.datos ?? []).filter((m) => m.estado_inventario !== 'vencido').map((m) => <option key={m.id} value={m.id}>{m.nombre} (stock {m.cantidad_disponible})</option>)}</select></Campo>}
        <Campo etiqueta="Dosis prescrita" requerido><input className="input" value={dosis} onChange={(e) => setDosis(e.target.value)} placeholder="Ej. 500mg" /></Campo>
        <Campo etiqueta="Unidades por dosis" ayuda={medSel ? `Se descuentan del inventario (${medSel.presentacion ?? 'unidades'})` : 'Cuántas unidades se descuentan por toma'}>
          <input className="input" type="number" min={1} max={20} value={unidades} onChange={(e) => setUnidades(e.target.value)} /></Campo>
        <Campo etiqueta="Frecuencia" requerido ancho>
          <select className="select" value={Object.keys(PRESETS).includes(frecuencia) ? frecuencia : 'Personalizada'} onChange={(e) => elegirFrecuencia(e.target.value)}>{Object.keys(PRESETS).map((f) => <option key={f}>{f}</option>)}</select></Campo>
        <div className="ancho campo"><span>Horarios de administración {frecuencia.includes('PRN') && <small>(PRN: sin horario fijo, se registra como dosis extra)</small>}</span>
          <div className="horarios">
            {horarios.map((h) => <span key={h} className="chip">{h}<button type="button" onClick={() => setHorarios(horarios.filter((x) => x !== h))} aria-label={`Quitar ${h}`}>×</button></span>)}
            <input className="input" type="time" style={{ width: 120 }} value={nuevo} onChange={(e) => setNuevo(e.target.value)} aria-label="Nuevo horario" />
            <button type="button" className="btn btn--sm" onClick={agregar} disabled={!nuevo}><IconoMas size={13} /> Agregar</button></div></div>
        {!prescripcion && <Campo etiqueta="Fecha de inicio" ayuda="Vacío = hoy"><input className="input" type="date" value={inicio} onChange={(e) => setInicio(e.target.value)} /></Campo>}
        <Campo etiqueta="Fecha de fin" ayuda="Vacío = tratamiento continuo"><input className="input" type="date" value={fin} onChange={(e) => setFin(e.target.value)} /></Campo>
        <Campo etiqueta="Indicaciones" ancho><textarea className="textarea" rows={2} value={obs} onChange={(e) => setObs(e.target.value)} placeholder="Ej. Administrar con alimentos" /></Campo>
      </form>
    </Modal>
  );
}

/* ===================== Lista de prescripciones ===================== */
export function PrescripcionesLista({ pacienteId }: { pacienteId?: number }) {
  const { esGestor, tick, refrescar } = useApp();
  const toast = useToast();
  const [soloActivas, setSoloActivas] = useState(true);
  const { datos, cargando, error, recargar } = useCarga(() => api.get<Prescripcion[]>('/prescripciones', { paciente_id: pacienteId, activo: soloActivas ? 'true' : undefined }), [pacienteId, soloActivas, tick]);
  const [form, setForm] = useState<null | { p: Prescripcion | null }>(null);
  const [suspender, setSuspender] = useState<Prescripcion | null>(null);
  const [extra, setExtra] = useState<Prescripcion | null>(null);

  return (
    <div className="card">
      <div className="card__t"><h3>Prescripciones</h3>
        <span className="barra"><Chips valor={soloActivas ? 'a' : 't'} onChange={(v) => setSoloActivas(v === 'a')} opciones={[{ id: 'a', etiqueta: 'Activas' }, { id: 't', etiqueta: 'Todas' }]} />
          {esGestor && <button className="btn btn--sm btn--p" onClick={() => setForm({ p: null })}><IconoMas size={13} /> Prescribir</button>}</span></div>
      {cargando && !datos && <Cargando />}
      {error && <ErrorBox mensaje={error} onReintentar={recargar} />}
      {datos && !datos.length && <Vacio icono="💊" texto="No hay prescripciones." />}
      {datos && datos.length > 0 && (
        <div className="tabla-wrap"><table className="tabla"><thead><tr>{!pacienteId && <th>Residente</th>}<th>Medicamento</th><th>Dosis</th><th>Horarios</th><th>Vigencia</th><th>Estado</th><th /></tr></thead>
          <tbody>{datos.map((p) => (
            <tr key={p.id}>
              {!pacienteId && <td>{p.paciente_nombre} {p.paciente_apellido}<small>Hab. {p.habitacion ?? '—'}</small></td>}
              <td><b>{p.medicamento_nombre}</b><small>{p.frecuencia} · {p.unidades_por_dosis} ud/dosis{p.observaciones ? ` · ${p.observaciones}` : ''}</small></td>
              <td>{p.dosis_prescrita}</td>
              <td>{p.horarios ? p.horarios.split(',').join(' · ') : <small>PRN</small>}</td>
              <td>{fmtFecha(p.fecha_inicio)} → {p.fecha_fin ? fmtFecha(p.fecha_fin) : 'continuo'}</td>
              <td>{p.activo ? <span className="badge badge--ok">Activa</span> : <span className="badge badge--muted" title={p.motivo_suspension ?? ''}>Suspendida</span>}</td>
              <td className="acc">{p.activo && <button className="btn btn--sm" onClick={() => setExtra(p)}>Dosis extra</button>}
                {p.activo && esGestor && <> <button className="btn btn--sm" onClick={() => setForm({ p })}>Editar</button> <button className="btn btn--sm" onClick={() => setSuspender(p)}>Suspender</button></>}</td>
            </tr>))}</tbody></table></div>)}
      {form && <PrescripcionFormModal pacienteId={pacienteId} prescripcion={form.p} onClose={() => setForm(null)} onGuardado={recargar} />}
      {suspender && <Confirmar titulo="Suspender prescripción" peligro pedirMotivo etiquetaMotivo="Motivo de la suspensión" textoAceptar="Suspender"
        mensaje={<>Se suspenderá <b>{suspender.medicamento_nombre}</b> de {suspender.paciente_nombre} y se cancelarán sus dosis futuras.</>} onCancelar={() => setSuspender(null)}
        onAceptar={async (motivo) => { await api.post(`/prescripciones/${suspender.id}/suspender`, { motivo }); toast('Prescripción suspendida', 'success'); setSuspender(null); refrescar(); recargar(); }} />}
      {extra && <DosisExtraModal p={extra} onClose={() => setExtra(null)} onHecho={() => { refrescar(); recargar(); }} />}
    </div>
  );
}

function DosisExtraModal({ p, onClose, onHecho }: { p: Prescripcion; onClose: () => void; onHecho: () => void }) {
  const toast = useToast();
  const [obs, setObs] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [alergia, setAlergia] = useState('');
  const registrar = async () => {
    setEnviando(true);
    try { const r = await api.post('/administraciones/directa', { prescripcion_id: p.id, observaciones: obs }); toast(`Dosis extra registrada. Stock restante: ${r.stockRestante}`, 'success'); onHecho(); onClose(); }
    catch (e) { if (e instanceof ApiError && e.data?.codigo === 'ALERGIA') setAlergia(e.message); else toast(mensajeError(e), 'error'); } finally { setEnviando(false); }
  };
  return (
    <Modal titulo="Registrar dosis extra / PRN" tam="chico" onClose={onClose} pie={<><button className="btn" onClick={onClose}>Cancelar</button><button className="btn btn--ok" onClick={registrar} disabled={enviando || !!alergia}>Registrar dosis</button></>}>
      <div><b>{p.medicamento_nombre}</b> {p.dosis_prescrita}<br />{p.paciente_nombre} {p.paciente_apellido}<br /><small>Se descontarán {p.unidades_por_dosis} unidad(es) (stock: {p.stock}).</small></div>
      {alergia && <div className="alerta alerta--error">{alergia}</div>}
      <Campo etiqueta="Motivo / observaciones"><textarea className="textarea" rows={2} value={obs} onChange={(e) => setObs(e.target.value)} placeholder="Ej. Dolor intenso, se administra dosis de rescate" /></Campo>
    </Modal>
  );
}

/* ===================== Historial de administraciones ===================== */
export function HistorialAdministraciones({ pacienteId }: { pacienteId?: number }) {
  const { tick } = useApp();
  const [estado, setEstado] = useState('');
  const [page, setPage] = useState(1);
  const { datos, cargando, error, recargar } = useCarga(() => api.get<Paginado<Administracion>>('/administraciones', { paciente_id: pacienteId, estado: estado || undefined, page, limit: 12 }), [pacienteId, estado, page, tick]);
  return (
    <div className="card">
      <div className="card__t"><h3>Historial de administraciones</h3>
        <Chips valor={estado} onChange={(v) => { setEstado(v); setPage(1); }} opciones={[{ id: '', etiqueta: 'Todas' }, { id: 'administrada', etiqueta: 'Administradas' }, { id: 'omitida', etiqueta: 'Omitidas' }, { id: 'rechazada', etiqueta: 'Rechazadas' }, { id: 'programada', etiqueta: 'Pendientes' }]} /></div>
      {cargando && !datos && <Cargando />}
      {error && <ErrorBox mensaje={error} onReintentar={recargar} />}
      {datos && !datos.data.length && <Vacio icono="🗂️" texto="No hay administraciones registradas con este filtro." />}
      {datos && datos.data.length > 0 && <>
        <div className="tabla-wrap"><table className="tabla"><thead><tr><th>Programada</th>{!pacienteId && <th>Residente</th>}<th>Medicamento</th><th>Estado</th><th>Registró</th><th>Detalle</th></tr></thead>
          <tbody>{datos.data.map((a) => (
            <tr key={a.id}><td>{fmtFechaHora(a.horario_programado)}</td>
              {!pacienteId && <td>{nombreCompleto({ nombre: a.paciente_nombre, apellido: a.paciente_apellido })}</td>}
              <td>{a.medicamento_nombre}<small>{a.dosis_administrada}</small></td>
              <td><span className={`badge ${ESTADOS_ADMIN[a.estado]?.clase}`}>{ESTADOS_ADMIN[a.estado]?.texto}</span></td>
              <td>{a.usuario_nombre ? <>{a.usuario_nombre}<small>{fmtFechaHora(a.horario_administracion)}</small></> : '—'}</td>
              <td><small>{a.motivo_omision || a.observaciones || '—'}</small></td></tr>))}</tbody></table></div>
        <Paginacion page={datos.page} paginas={datos.paginas} total={datos.total} onChange={setPage} /></>}
    </div>
  );
}
