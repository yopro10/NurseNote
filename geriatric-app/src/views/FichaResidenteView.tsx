import { useState } from 'react';
import { useToast } from '../context/ToastContext';
import { api } from '../api/client';
import { useApp } from '../context/AppContext';
import { EstadoManualModal, NotaDetalleDrawer, NotaFormModal, ResidenteFormModal, SignosFormModal } from '../components/forms';
import { HistorialAdministraciones, PrescripcionesLista } from '../components/medicacion';
import SignosGrafica from '../components/SignosGrafica';
import { IconoAlerta, IconoMas } from '../components/Icons';
import { Avatar, Cargando, Confirmar, Dl, ErrorBox, EstadoBadge, ExportarBotones, Paginacion, Tabs, Vacio, useCarga } from '../components/ui';
import type { HistorialEstado, Nota, Paciente, Paginado, SignosVitales } from '../types';
import { calcularEdad, fmtFecha, fmtFechaHora, hace, nombreCompleto, TIPOS_NOTA } from '../utils/format';
import { evaluarSignos, nivelDe } from '../utils/rangos';

type Tab = 'resumen' | 'notas' | 'signos' | 'medicacion' | 'estado';

export default function FichaResidenteView() {
  const { destino, ir, esGestor, usuario, tick, refrescar } = useApp();
  const id = destino.pacienteId ?? 0;
  const [tab, setTab] = useState<Tab>((destino.tab as Tab) ?? 'resumen');
  const [modal, setModal] = useState<null | 'nota' | 'signos' | 'editar' | 'estado'>(null);
  const [version, setVersion] = useState(0);
  const bump = () => { setVersion((v) => v + 1); refrescar(); };
  const p = useCarga(() => api.get<Paciente>(`/pacientes/${id}`), [id, tick, version]);

  if (!id) return <Vacio icono="🧑‍⚕️" texto="Selecciona un residente para ver su ficha." accion={<button className="btn btn--p" onClick={() => ir('residentes')}>Ir a residentes</button>} />;
  if (p.cargando && !p.datos) return <Cargando texto="Cargando ficha…" />;
  if (p.error || !p.datos) return <ErrorBox mensaje={p.error ?? 'No se encontró el residente'} onReintentar={p.recargar} />;
  const r = p.datos;
  const tieneAlergia = r.alergias && !/^ning/i.test(r.alergias);

  return (
    <>
      <div className="card" style={{ borderLeft: `5px solid ${r.estado_calculado === 'Crítico' ? 'var(--rojo)' : r.estado_calculado === 'En Observación' ? 'var(--ambar)' : 'var(--verde)'}` }}>
        <div className="barra">
          <button className="btn btn--sm btn--g" onClick={() => ir('residentes')}>← Residentes</button>
          <Avatar nombre={r.nombre} apellido={r.apellido} id={r.id} lg />
          <div style={{ flex: 1, minWidth: 200 }}>
            <h2>{nombreCompleto(r)} {!r.activo && <span className="badge badge--muted">Egresado</span>}</h2>
            <small>Hab. {r.habitacion ?? '—'} · {calcularEdad(r.fecha_nacimiento) ?? '—'} años · Doc. {r.documento ?? '—'} · Ingreso {fmtFecha(r.fecha_ingreso)}</small>
            <div className="chips" style={{ marginTop: 4 }}><EstadoBadge estado={r.activo ? r.estado_calculado : 'Egresado'} />
              {tieneAlergia ? <span className="badge badge--crit"><IconoAlerta size={11} /> Alergias: {r.alergias}</span> : null}
              {r.estado_motivo && r.activo ? <small>{r.estado_motivo}</small> : null}</div>
          </div>
          <div className="barra">
            {r.activo && <button className="btn btn--sm btn--p" onClick={() => setModal('nota')}><IconoMas size={13} /> Nota</button>}
            {r.activo && <button className="btn btn--sm" onClick={() => setModal('signos')}><IconoMas size={13} /> Signos</button>}
            {esGestor && r.activo && <button className="btn btn--sm" onClick={() => setModal('estado')}>Ajustar estado</button>}
            {esGestor && <button className="btn btn--sm" onClick={() => setModal('editar')}>Editar</button>}
            <ExportarBotones tipo="ficha" params={{ paciente_id: r.id }} etiqueta="Exportar ficha" />
          </div>
        </div>
      </div>

      <Tabs valor={tab} onChange={setTab} tabs={[{ id: 'resumen', label: 'Resumen' }, { id: 'notas', label: 'Notas' }, { id: 'signos', label: 'Signos vitales' }, { id: 'medicacion', label: 'Medicación' }, { id: 'estado', label: 'Historial de estado' }]} />

      {tab === 'resumen' && <Resumen r={r} version={version} irTab={setTab} />}
      {tab === 'notas' && <NotasTab id={id} version={version} activo={r.activo} onNueva={() => setModal('nota')} />}
      {tab === 'signos' && <SignosTab id={id} version={version} activo={r.activo} onNuevo={() => setModal('signos')} onCambio={bump} usuarioId={usuario?.id ?? 0} esGestor={esGestor} />}
      {tab === 'medicacion' && <><PrescripcionesLista pacienteId={id} /><HistorialAdministraciones pacienteId={id} /></>}
      {tab === 'estado' && <HistorialTab id={id} version={version} />}

      {modal === 'nota' && <NotaFormModal pacienteId={id} onClose={() => setModal(null)} onGuardado={bump} />}
      {modal === 'signos' && <SignosFormModal pacienteId={id} onClose={() => setModal(null)} onGuardado={bump} />}
      {modal === 'editar' && <ResidenteFormModal paciente={r} onClose={() => setModal(null)} onGuardado={bump} />}
      {modal === 'estado' && <EstadoManualModal paciente={r} onClose={() => setModal(null)} onGuardado={bump} />}
    </>
  );
}

function Resumen({ r, version, irTab }: { r: Paciente; version: number; irTab: (t: Tab) => void }) {
  const ult = useCarga(() => api.get<SignosVitales[]>(`/signos-vitales/paciente/${r.id}/ultimos`, { limite: 1 }), [r.id, version]);
  const sv = ult.datos?.[0];
  const ev = sv ? evaluarSignos(sv) : null;
  const cel = (l: string, campo: string, val: unknown, u: string) => {
    const n = sv ? nivelDe(sv, campo) : 0;
    return <div className={`signo ${n === 2 ? 'signo--crit' : n === 1 ? 'signo--warn' : ''}`}><small>{l}</small><b>{String(val ?? '—')}</b> <small style={{ display: 'inline' }}>{val != null ? u : ''}</small></div>;
  };
  return (
    <div className="grid2">
      <div className="card"><div className="card__t"><h3>Datos del residente</h3></div>
        <Dl filas={[['Nacimiento', `${fmtFecha(r.fecha_nacimiento)} (${calcularEdad(r.fecha_nacimiento) ?? '—'} años)`], ['Género', r.genero], ['Teléfono', r.telefono], ['Dirección', r.direccion],
          ['Alergias', r.alergias || 'Ninguna conocida'], ['Enfermedades crónicas', r.enfermedades_cronicas || 'Ninguna registrada'],
          ['Contacto de emergencia', [r.contacto_emergencia, r.telefono_emergencia].filter(Boolean).join(' · ') || '—'], ...(r.activo ? [] : [['Egreso', `${fmtFecha(r.fecha_egreso)} · ${r.motivo_egreso ?? ''}`] as [string, string]])]} /></div>
      <div className="card"><div className="card__t"><h3>Último registro de signos</h3><button className="btn btn--sm" onClick={() => irTab('signos')}>Ver todos</button></div>
        {ult.cargando && !sv ? <Cargando /> : !sv ? <Vacio icono="🩺" texto="Aún no hay signos vitales registrados." /> : <>
          <small>{fmtFechaHora(sv.fecha_registro)} · {hace(sv.fecha_registro)} · por {sv.usuario_nombre}</small>
          <div className="signos-grid" style={{ marginTop: 6 }}>
            {cel('PA', 'presion_sistolica', sv.presion_sistolica ? `${sv.presion_sistolica}/${sv.presion_diastolica}` : null, 'mmHg')}
            {cel('Frec. cardíaca', 'frecuencia_cardiaca', sv.frecuencia_cardiaca, 'lpm')}{cel('Temperatura', 'temperatura', sv.temperatura, '°C')}
            {cel('SpO₂', 'saturacion_oxigeno', sv.saturacion_oxigeno, '%')}{cel('Frec. resp.', 'frecuencia_respiratoria', sv.frecuencia_respiratoria, 'rpm')}{cel('Glucosa', 'glucosa', sv.glucosa, 'mg/dL')}</div>
          {ev && ev.nivel > 0 && <div className={`alerta ${ev.nivel === 2 ? 'alerta--error' : 'alerta--warn'}`} style={{ marginTop: 8 }}><IconoAlerta size={16} /><ul>{ev.hallazgos.map((h) => <li key={h.campo}>{h.texto}</li>)}</ul></div>}</>}
      </div>
    </div>
  );
}

function NotasTab({ id, version, activo, onNueva }: { id: number; version: number; activo: boolean; onNueva: () => void }) {
  const [page, setPage] = useState(1);
  const [ver, setVer] = useState<number | null>(null);
  const [n, setN] = useState(0);
  const { datos, cargando, error, recargar } = useCarga(() => api.get<Paginado<Nota>>('/notas', { paciente_id: id, page, limit: 8 }), [id, page, version, n]);
  return (
    <div className="card">
      <div className="card__t"><h3>Notas de enfermería</h3><span className="barra"><ExportarBotones tipo="notas" params={{ paciente_id: id, desde: '2000-01-01' }} />{activo && <button className="btn btn--sm btn--p" onClick={onNueva}><IconoMas size={13} /> Nueva nota</button>}</span></div>
      {cargando && !datos && <Cargando />}{error && <ErrorBox mensaje={error} onReintentar={recargar} />}
      {datos && !datos.data.length && <Vacio icono="📝" texto="Este residente aún no tiene notas." />}
      {datos && datos.data.length > 0 && <>
        <ul className="lista">{datos.data.map((x) => (
          <li key={x.id}><button className="fila" onClick={() => setVer(x.id)}>
            <div><strong>{TIPOS_NOTA[x.tipo_nota]} · {fmtFechaHora(x.fecha_registro)}</strong><small className="clamp2">{x.contenido}</small><small>Por {x.usuario_nombre} {x.usuario_apellido ?? ''}</small></div>
            <span className="badge badge--info">Ver</span></button></li>))}</ul>
        <Paginacion page={datos.page} paginas={datos.paginas} total={datos.total} onChange={setPage} /></>}
      {ver && <NotaDetalleDrawer id={ver} onClose={() => setVer(null)} onCambio={() => setN((x) => x + 1)} />}
    </div>
  );
}

function SignosTab({ id, version, activo, onNuevo, onCambio, usuarioId, esGestor }: { id: number; version: number; activo: boolean; onNuevo: () => void; onCambio: () => void; usuarioId: number; esGestor: boolean }) {
  const toast = useToast();
  const { datos, cargando, error, recargar } = useCarga(() => api.get<SignosVitales[]>(`/signos-vitales/paciente/${id}`, { limit: 30 }), [id, version]);
  const [borrar, setBorrar] = useState<SignosVitales | null>(null);
  const puede = (s: SignosVitales) => esGestor || (s.usuario_id === usuarioId && Date.now() - (Date.parse(s.fecha_registro) || 0) < 24 * 3600 * 1000);
  return (
    <>
      <SignosGrafica pacienteId={id} version={version} />
      <div className="card">
        <div className="card__t"><h3>Registros recientes</h3><span className="barra"><ExportarBotones tipo="signos" params={{ paciente_id: id, desde: '2000-01-01' }} />{activo && <button className="btn btn--sm btn--p" onClick={onNuevo}><IconoMas size={13} /> Registrar signos</button>}</span></div>
        {cargando && !datos && <Cargando />}{error && <ErrorBox mensaje={error} onReintentar={recargar} />}
        {datos && !datos.length && <Vacio icono="🩺" texto="Sin registros de signos vitales." />}
        {datos && datos.length > 0 && <div className="tabla-wrap"><table className="tabla"><thead><tr><th>Fecha</th><th>PA</th><th>FC</th><th>Temp</th><th>SpO₂</th><th>FR</th><th>Glucosa</th><th>Alertas</th><th /></tr></thead>
          <tbody>{datos.map((s) => { const ev = s.evaluacion ?? evaluarSignos(s); return (
            <tr key={s.id} className={ev.nivel === 2 ? 'fila--crit' : ev.nivel === 1 ? 'fila--warn' : ''}>
              <td>{fmtFechaHora(s.fecha_registro)}<small>{s.usuario_nombre}</small></td><td>{s.presion_sistolica ? `${s.presion_sistolica}/${s.presion_diastolica}` : '—'}</td><td>{s.frecuencia_cardiaca ?? '—'}</td>
              <td>{s.temperatura ?? '—'}</td><td>{s.saturacion_oxigeno ?? '—'}</td><td>{s.frecuencia_respiratoria ?? '—'}</td><td>{s.glucosa ?? '—'}</td>
              <td>{ev.nivel === 0 ? <span className="badge badge--ok">Normal</span> : <small>{ev.hallazgos.map((h) => h.texto).join(' · ')}</small>}</td>
              <td className="acc">{puede(s) && <button className="btn btn--sm btn--g" onClick={() => setBorrar(s)}>Eliminar</button>}</td></tr>); })}</tbody></table></div>}
      </div>
      {borrar && <Confirmar titulo="Eliminar registro" peligro textoAceptar="Eliminar" mensaje={`¿Eliminar el registro de ${fmtFechaHora(borrar.fecha_registro)}? El estado del residente se recalculará.`} onCancelar={() => setBorrar(null)}
        onAceptar={async () => { await api.del(`/signos-vitales/${borrar.id}`); toast('Registro eliminado', 'success'); setBorrar(null); onCambio(); recargar(); }} />}
    </>
  );
}

function HistorialTab({ id, version }: { id: number; version: number }) {
  const { datos, cargando, error, recargar } = useCarga(() => api.get<HistorialEstado[]>(`/pacientes/${id}/estado/historial`), [id, version]);
  return (
    <div className="card"><div className="card__t"><h3>Historial de estado</h3><small>Cada cambio, con su origen y motivo</small></div>
      {cargando && !datos && <Cargando />}{error && <ErrorBox mensaje={error} onReintentar={recargar} />}
      {datos && !datos.length && <Vacio texto="Sin cambios de estado registrados." />}
      {datos && datos.length > 0 && <ul className="tl">{datos.map((h) => (
        <li key={h.id}><div className="barra"><b>{h.estado_anterior ? `${h.estado_anterior} → ` : ''}{h.estado_nuevo}</b><span className={`badge ${h.origen === 'manual' ? 'badge--mor' : 'badge--info'}`}>{h.origen === 'manual' ? 'Ajuste manual' : 'Automático'}</span></div>
          <small>{fmtFechaHora(h.fecha)}{h.usuario_nombre ? ` · ${h.usuario_nombre} ${h.usuario_apellido ?? ''}` : ''}</small><p style={{ fontSize: '.88rem' }}>{h.motivo}</p></li>))}</ul>}
    </div>
  );
}
