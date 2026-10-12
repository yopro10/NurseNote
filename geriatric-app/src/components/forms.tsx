import { FormEvent, useState } from 'react';
import { api } from '../api/client';
import { useApp } from '../context/AppContext';
import { useToast } from '../context/ToastContext';
import type { EstadoPaciente, Nota, Paciente, TipoNota } from '../types';
import { fmtFechaHora, mensajeError, nombreCompleto, TIPOS_NOTA } from '../utils/format';
import { evaluarSignos } from '../utils/rangos';
import PacienteSelect from './PacienteSelect';
import { Campo, Confirmar, Cargando, Drawer, Dl, ErrorBox, Modal, useCarga } from './ui';

/* ============================== NOTAS ============================== */
export function NotaFormModal({ pacienteId, tipoInicial = 'evolucion', onClose, onGuardado }: { pacienteId?: number; tipoInicial?: TipoNota; onClose: () => void; onGuardado: () => void }) {
  const toast = useToast();
  const { refrescar } = useApp();
  const [paciente, setPaciente] = useState<number | ''>(pacienteId ?? '');
  const [tipo, setTipo] = useState<TipoNota>(tipoInicial);
  const [contenido, setContenido] = useState('');
  const [observaciones, setObservaciones] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState('');

  const guardar = async (e: FormEvent) => {
    e.preventDefault();
    if (!paciente) return setError('Selecciona un residente');
    if (contenido.trim().length < 3) return setError('Escribe el contenido de la nota (mínimo 3 caracteres)');
    setEnviando(true); setError('');
    try {
      await api.post('/notas', { paciente_id: paciente, tipo_nota: tipo, contenido, observaciones });
      toast('Nota registrada correctamente', 'success');
      refrescar(); onGuardado(); onClose();
    } catch (err) { setError(mensajeError(err)); } finally { setEnviando(false); }
  };

  return (
    <Modal titulo="Nueva nota de enfermería" onClose={onClose} pie={<>
      <button type="button" className="btn" onClick={onClose}>Cancelar</button>
      <button form="form-nota" className="btn btn--p" disabled={enviando}>{enviando ? 'Guardando…' : 'Guardar nota'}</button></>}>
      <form id="form-nota" onSubmit={guardar} className="form-grid">
        {error && <div className="alerta alerta--error ancho" role="alert">{error}</div>}
        {!pacienteId && <Campo etiqueta="Residente" requerido><PacienteSelect valor={paciente} onChange={setPaciente} /></Campo>}
        <Campo etiqueta="Tipo de nota" requerido>
          <select className="select" value={tipo} onChange={(e) => setTipo(e.target.value as TipoNota)}>
            {Object.entries(TIPOS_NOTA).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></Campo>
        <Campo etiqueta="Contenido" requerido ancho><textarea className="textarea" rows={5} maxLength={5000} value={contenido} onChange={(e) => setContenido(e.target.value)} placeholder="Describe el estado, evolución o novedades del residente…" autoFocus /></Campo>
        <Campo etiqueta="Observaciones adicionales" ancho><textarea className="textarea" rows={2} value={observaciones} onChange={(e) => setObservaciones(e.target.value)} placeholder="Opcional" /></Campo>
      </form>
    </Modal>
  );
}

export function NotaDetalleDrawer({ id, onClose, onCambio }: { id: number; onClose: () => void; onCambio: () => void }) {
  const { ir } = useApp();
  const toast = useToast();
  const { datos: n, cargando, error, recargar } = useCarga(() => api.get<Nota>(`/notas/${id}`), [id]);
  const [editando, setEditando] = useState(false);
  const [anulando, setAnulando] = useState(false);
  const [contenido, setContenido] = useState('');
  const [obs, setObs] = useState('');

  const guardar = async () => {
    try { await api.put(`/notas/${id}`, { contenido, observaciones: obs }); toast('Nota actualizada', 'success'); setEditando(false); recargar(); onCambio(); }
    catch (e) { toast(mensajeError(e), 'error'); }
  };

  return (
    <Drawer titulo={n ? `${TIPOS_NOTA[n.tipo_nota]} · ${n.paciente_nombre} ${n.paciente_apellido}` : 'Nota'} onClose={onClose}
      pie={n && <>
        <button className="btn" onClick={() => { onClose(); ir('ficha', { pacienteId: n.paciente_id, tab: 'notas' }); }}>Ver ficha</button>
        {n.editable && !editando && <button className="btn" onClick={() => { setContenido(n.contenido); setObs(n.observaciones ?? ''); setEditando(true); }}>Editar</button>}
        {n.editable && !editando && <button className="btn btn--peligro" onClick={() => setAnulando(true)}>Anular</button>}
        {editando && <><button className="btn" onClick={() => setEditando(false)}>Cancelar</button><button className="btn btn--p" onClick={guardar} disabled={contenido.trim().length < 3}>Guardar cambios</button></>}</>}>
      {cargando && <Cargando />}
      {error && <ErrorBox mensaje={error} onReintentar={recargar} />}
      {n && <>
        {n.anulada && <div className="alerta alerta--error"><span><b>Nota anulada</b> el {fmtFechaHora(n.fecha_anulacion)} por {n.anulada_por_nombre ?? '—'}.<br />Motivo: {n.motivo_anulacion}</span></div>}
        <Dl filas={[['Fecha', fmtFechaHora(n.fecha_registro)], ['Autor', nombreCompleto({ nombre: n.usuario_nombre, apellido: n.usuario_apellido })], ['Residente', `${n.paciente_nombre} ${n.paciente_apellido} · Hab. ${n.paciente_habitacion ?? '—'}`],
          ['Estado al registrar', n.estado_paciente], ['Última edición', n.fecha_actualizacion ? fmtFechaHora(n.fecha_actualizacion) : '—']]} />
        {editando ? <>
          <Campo etiqueta="Contenido" requerido><textarea className="textarea" rows={6} value={contenido} onChange={(e) => setContenido(e.target.value)} /></Campo>
          <Campo etiqueta="Observaciones"><textarea className="textarea" rows={2} value={obs} onChange={(e) => setObs(e.target.value)} /></Campo></> : <>
          <div><h4>Contenido</h4><p style={{ whiteSpace: 'pre-wrap' }}>{n.contenido}</p></div>
          {n.observaciones && <div><h4>Observaciones</h4><p style={{ whiteSpace: 'pre-wrap' }}>{n.observaciones}</p></div>}</>}
        {!n.editable && !n.anulada && <small>Solo el autor (durante las primeras 24 h) o un jefe/administrador puede editar o anular esta nota.</small>}
      </>}
      {anulando && <Confirmar titulo="Anular nota" peligro pedirMotivo etiquetaMotivo="Motivo de la anulación" textoAceptar="Anular nota"
        mensaje="La nota no se borra: quedará marcada como anulada en el historial clínico."
        onCancelar={() => setAnulando(false)} onAceptar={async (motivo) => { await api.post(`/notas/${id}/anular`, { motivo }); toast('Nota anulada', 'success'); setAnulando(false); recargar(); onCambio(); }} />}
    </Drawer>
  );
}

/* ============================== SIGNOS VITALES ============================== */
const CAMPOS_SV = [
  { k: 'presion_sistolica', l: 'PA sistólica (mmHg)', step: '1' }, { k: 'presion_diastolica', l: 'PA diastólica (mmHg)', step: '1' },
  { k: 'frecuencia_cardiaca', l: 'Frec. cardíaca (lpm)', step: '1' }, { k: 'temperatura', l: 'Temperatura (°C)', step: '0.1' },
  { k: 'saturacion_oxigeno', l: 'SpO₂ (%)', step: '1' }, { k: 'frecuencia_respiratoria', l: 'Frec. respiratoria (rpm)', step: '1' },
  { k: 'glucosa', l: 'Glucosa (mg/dL)', step: '1' }, { k: 'peso', l: 'Peso (kg)', step: '0.1' },
] as const;

export function SignosFormModal({ pacienteId, onClose, onGuardado }: { pacienteId?: number; onClose: () => void; onGuardado: () => void }) {
  const toast = useToast();
  const { refrescar } = useApp();
  const [paciente, setPaciente] = useState<number | ''>(pacienteId ?? '');
  const [v, setV] = useState<Record<string, string>>({});
  const [obs, setObs] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState('');
  const evaluacion = evaluarSignos(Object.fromEntries(Object.entries(v).map(([k, x]) => [k, x === '' ? null : Number(x)])));

  const guardar = async (e: FormEvent) => {
    e.preventDefault();
    if (!paciente) return setError('Selecciona un residente');
    setEnviando(true); setError('');
    try {
      const r = await api.post('/signos-vitales', { paciente_id: paciente, ...v, observaciones: obs });
      toast(r.estado?.cambio ? `Signos registrados. Estado del residente: ${r.estado.estado}` : 'Signos vitales registrados', r.nivel === 2 ? 'warning' : 'success');
      refrescar(); onGuardado(); onClose();
    } catch (err) { setError(mensajeError(err)); } finally { setEnviando(false); }
  };

  return (
    <Modal titulo="Registrar signos vitales" tam="ancho" onClose={onClose} pie={<>
      <button type="button" className="btn" onClick={onClose}>Cancelar</button>
      <button form="form-signos" className="btn btn--p" disabled={enviando}>{enviando ? 'Guardando…' : 'Guardar registro'}</button></>}>
      <form id="form-signos" onSubmit={guardar} className="form-grid">
        {error && <div className="alerta alerta--error ancho" role="alert">{error}</div>}
        {!pacienteId && <Campo etiqueta="Residente" requerido ancho><PacienteSelect valor={paciente} onChange={setPaciente} /></Campo>}
        {CAMPOS_SV.map((c) => {
          const h = evaluacion.hallazgos.find((x) => x.campo === c.k);
          return <Campo key={c.k} etiqueta={c.l}>
            <input className={`input ${h ? 'input--error' : ''}`} type="number" inputMode="decimal" step={c.step} value={v[c.k] ?? ''} onChange={(e) => setV((p) => ({ ...p, [c.k]: e.target.value }))} style={h?.nivel === 1 ? { borderColor: 'var(--ambar)' } : undefined} />
            {h && <small style={{ color: h.nivel === 2 ? 'var(--rojo)' : 'var(--ambar)', fontWeight: 700 }}>{h.texto}</small>}</Campo>;
        })}
        <Campo etiqueta="Observaciones" ancho><textarea className="textarea" rows={2} value={obs} onChange={(e) => setObs(e.target.value)} /></Campo>
        {evaluacion.nivel > 0 && <div className={`alerta ${evaluacion.nivel === 2 ? 'alerta--error' : 'alerta--warn'} ancho`} role="status">
          <span><b>{evaluacion.nivel === 2 ? 'Valores críticos: requiere atención inmediata.' : 'Hay valores fuera de rango.'}</b> Al guardar, el estado del residente se recalculará.</span></div>}
      </form>
    </Modal>
  );
}

/* ============================== RESIDENTES ============================== */
export function ResidenteFormModal({ paciente, onClose, onGuardado }: { paciente?: Paciente | null; onClose: () => void; onGuardado: () => void }) {
  const toast = useToast();
  const { refrescar } = useApp();
  const [f, setF] = useState({
    nombre: paciente?.nombre ?? '', apellido: paciente?.apellido ?? '', documento: paciente?.documento ?? '', fecha_nacimiento: paciente?.fecha_nacimiento ?? '',
    genero: paciente?.genero ?? '', habitacion: paciente?.habitacion ?? '', telefono: paciente?.telefono ?? '', direccion: paciente?.direccion ?? '',
    alergias: paciente?.alergias ?? '', enfermedades_cronicas: paciente?.enfermedades_cronicas ?? '', contacto_emergencia: paciente?.contacto_emergencia ?? '', telefono_emergencia: paciente?.telefono_emergencia ?? '',
  });
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState('');
  const set = (k: keyof typeof f) => (e: { target: { value: string } }) => setF((p) => ({ ...p, [k]: e.target.value }));

  const guardar = async (e: FormEvent) => {
    e.preventDefault();
    if (f.nombre.trim().length < 2 || f.apellido.trim().length < 2) return setError('Nombre y apellido son obligatorios (mínimo 2 caracteres)');
    setEnviando(true); setError('');
    try {
      if (paciente) await api.put(`/pacientes/${paciente.id}`, f); else await api.post('/pacientes', f);
      toast(paciente ? 'Residente actualizado' : 'Residente registrado', 'success');
      refrescar(); onGuardado(); onClose();
    } catch (err) { setError(mensajeError(err)); } finally { setEnviando(false); }
  };

  return (
    <Modal titulo={paciente ? `Editar a ${nombreCompleto(paciente)}` : 'Nuevo residente'} tam="ancho" onClose={onClose} pie={<>
      <button type="button" className="btn" onClick={onClose}>Cancelar</button>
      <button form="form-res" className="btn btn--p" disabled={enviando}>{enviando ? 'Guardando…' : 'Guardar'}</button></>}>
      <form id="form-res" onSubmit={guardar} className="form-grid">
        {error && <div className="alerta alerta--error ancho" role="alert">{error}</div>}
        <Campo etiqueta="Nombre" requerido><input className="input" value={f.nombre} onChange={set('nombre')} autoFocus /></Campo>
        <Campo etiqueta="Apellido" requerido><input className="input" value={f.apellido} onChange={set('apellido')} /></Campo>
        <Campo etiqueta="Documento"><input className="input" value={f.documento} onChange={set('documento')} maxLength={30} /></Campo>
        <Campo etiqueta="Fecha de nacimiento"><input className="input" type="date" max={new Date().toISOString().slice(0, 10)} value={f.fecha_nacimiento} onChange={set('fecha_nacimiento')} /></Campo>
        <Campo etiqueta="Género"><select className="select" value={f.genero} onChange={set('genero')}><option value="">—</option><option value="masculino">Masculino</option><option value="femenino">Femenino</option><option value="otro">Otro</option></select></Campo>
        <Campo etiqueta="Habitación"><input className="input" value={f.habitacion} onChange={set('habitacion')} maxLength={20} /></Campo>
        <Campo etiqueta="Alergias" ancho ayuda="Se usan para validar la medicación. Separa con comas (p. ej. Penicilina, Ibuprofeno)."><input className="input" value={f.alergias} onChange={set('alergias')} /></Campo>
        <Campo etiqueta="Enfermedades crónicas" ancho><input className="input" value={f.enfermedades_cronicas} onChange={set('enfermedades_cronicas')} /></Campo>
        <Campo etiqueta="Contacto de emergencia"><input className="input" value={f.contacto_emergencia} onChange={set('contacto_emergencia')} /></Campo>
        <Campo etiqueta="Teléfono de emergencia"><input className="input" value={f.telefono_emergencia} onChange={set('telefono_emergencia')} maxLength={20} /></Campo>
        <Campo etiqueta="Teléfono"><input className="input" value={f.telefono} onChange={set('telefono')} maxLength={20} /></Campo>
        <Campo etiqueta="Dirección"><input className="input" value={f.direccion} onChange={set('direccion')} /></Campo>
      </form>
    </Modal>
  );
}

export function EstadoManualModal({ paciente, onClose, onGuardado }: { paciente: Paciente; onClose: () => void; onGuardado: () => void }) {
  const toast = useToast();
  const { refrescar } = useApp();
  const [estado, setEstado] = useState<EstadoPaciente>(paciente.estado_calculado);
  const [motivo, setMotivo] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState('');
  const guardar = async (e: FormEvent) => {
    e.preventDefault();
    setEnviando(true); setError('');
    try { await api.post(`/pacientes/${paciente.id}/estado`, { estado, motivo }); toast('Estado actualizado y registrado en el historial', 'success'); refrescar(); onGuardado(); onClose(); }
    catch (err) { setError(mensajeError(err)); } finally { setEnviando(false); }
  };
  return (
    <Modal titulo={`Ajustar estado · ${nombreCompleto(paciente)}`} tam="chico" onClose={onClose} pie={<>
      <button type="button" className="btn" onClick={onClose}>Cancelar</button><button form="form-estado" className="btn btn--p" disabled={enviando || motivo.trim().length < 5}>Guardar ajuste</button></>}>
      <form id="form-estado" onSubmit={guardar} className="form-grid">
        {error && <div className="alerta alerta--error ancho" role="alert">{error}</div>}
        <div className="alerta alerta--info ancho"><span>El estado se calcula solo a partir de los signos vitales. Un ajuste manual queda en el historial y se vuelve a calcular con el siguiente registro de signos.</span></div>
        <Campo etiqueta="Nuevo estado" ancho><select className="select" value={estado} onChange={(e) => setEstado(e.target.value as EstadoPaciente)}><option>Estable</option><option>En Observación</option><option>Crítico</option></select></Campo>
        <Campo etiqueta="Motivo del ajuste" requerido ancho><textarea className="textarea" rows={3} value={motivo} onChange={(e) => setMotivo(e.target.value)} /></Campo>
      </form>
    </Modal>
  );
}
