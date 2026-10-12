import { FormEvent, useState } from 'react';
import { api } from '../api/client';
import { useApp } from '../context/AppContext';
import { useToast } from '../context/ToastContext';
import { Cargando, Confirmar, Drawer, Dl, ErrorBox, ExportarBotones, PageHeader, Paginacion, Tabs, Vacio, Campo, useCarga } from '../components/ui';
import type { ResumenTurno, Turno } from '../types';
import { fmtFechaHora, mensajeError, nombreCompleto, ROLES, TIPOS_NOTA } from '../utils/format';

function ResumenVista({ r }: { r: ResumenTurno }) {
  const lista = (vacio: string, items: Array<{ k: string; t: string; s?: string; clase?: string }>) => !items.length ? <small>{vacio}</small> :
    <ul className="lista">{items.map((i) => <li key={i.k} className={`fila ${i.clase ?? ''}`}><div><strong>{i.t}</strong>{i.s && <small>{i.s}</small>}</div></li>)}</ul>;
  return (
    <>
      <section className="kpis">
        <div className="kpi"><span><b>{r.residentes.total}</b><span>Residentes</span></span></div><div className="kpi kpi--crit"><span><b>{r.residentes.criticos}</b><span>Críticos</span></span></div>
        <div className="kpi kpi--warn"><span><b>{r.residentes.observacion}</b><span>En observación</span></span></div><div className="kpi kpi--mor"><span><b>{r.medicacion.administradas}</b><span>Dosis administradas</span></span></div>
        <div className={`kpi ${r.medicacion.atrasadas.length ? 'kpi--crit' : 'kpi--ok'}`}><span><b>{r.medicacion.atrasadas.length}</b><span>Dosis atrasadas</span></span></div>
        <div className={`kpi ${r.inventario.vencidos + r.inventario.bajoStock ? 'kpi--warn' : 'kpi--ok'}`}><span><b>{r.inventario.vencidos + r.inventario.porVencer + r.inventario.bajoStock}</b><span>Alertas inventario</span></span></div>
      </section>
      <div className="grid2">
        <div className="card"><h4>Residentes críticos y en observación</h4>{lista('Ninguno 🎉', [...r.criticos.map((c) => ({ k: `c${c.id}`, t: `${c.nombre} · Hab. ${c.habitacion ?? '—'}`, s: c.motivo, clase: 'fila--crit' })), ...r.observacion.map((c) => ({ k: `o${c.id}`, t: `${c.nombre} · Hab. ${c.habitacion ?? '—'}`, s: c.motivo, clase: 'fila--warn' }))])}</div>
        <div className="card"><h4>Signos vitales alterados</h4>{lista('Sin alteraciones en el periodo', r.signosAlterados.map((s, i) => ({ k: String(i), t: `${s.residente} · ${s.hora}`, s: s.hallazgos.join(' · '), clase: s.nivel === 2 ? 'fila--crit' : 'fila--warn' })))}</div>
        <div className="card"><h4>Dosis atrasadas</h4>{lista('Ninguna', r.medicacion.atrasadas.map((m) => ({ k: String(m.id), t: `${m.residente} · ${m.medicamento}`, s: `Programada ${m.hora}`, clase: 'fila--crit' })))}</div>
        <div className="card"><h4>Dosis omitidas o rechazadas</h4>{lista('Ninguna', r.medicacion.omitidas.map((m) => ({ k: String(m.id), t: `${m.residente} · ${m.medicamento} (${m.estado})`, s: `${m.hora}${m.motivo ? ` · ${m.motivo}` : ''}`, clase: 'fila--warn' })))}</div>
        <div className="card"><h4>Próximas dosis (4 h)</h4>{lista('Ninguna en las próximas horas', r.medicacion.proximas.map((m) => ({ k: String(m.id), t: `${m.hora} · ${m.residente}`, s: m.medicamento })))}</div>
        <div className="card"><h4>Notas del periodo ({r.notas.total})</h4>{lista('Sin notas', r.notas.recientes.map((n) => ({ k: String(n.id), t: `${n.hora} · ${n.residente} · ${TIPOS_NOTA[n.tipo] ?? n.tipo}`, s: `${n.resumen} — ${n.autor}` })))}</div>
      </div>
    </>
  );
}

export default function TurnosView() {
  const { usuario, tick, refrescar } = useApp();
  const toast = useToast();
  const [tab, setTab] = useState<'nueva' | 'historial'>('nueva');
  const resumen = useCarga(() => api.get<ResumenTurno>('/turnos/resumen'), [tick, tab]);
  const dir = useCarga(() => api.get<Array<{ id: number; nombre: string; apellido?: string; rol: string }>>('/users/directorio'), []);
  const [turno, setTurno] = useState('');
  const [entrante, setEntrante] = useState<number | ''>('');
  const [notas, setNotas] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [ver, setVer] = useState<number | null>(null);
  const [n, setN] = useState(0);
  const hist = useCarga(() => api.get<{ data: Turno[]; total: number; page: number; paginas: number }>('/turnos', { page, limit: 10 }), [page, tick, n]);

  const enviar = async (e: FormEvent) => {
    e.preventDefault();
    if (!entrante) return setError('Selecciona quién recibe el turno');
    setEnviando(true); setError('');
    try {
      await api.post('/turnos', { usuario_entrante_id: entrante, turno: turno || resumen.datos?.turnoSugerido, notas_relevo: notas });
      toast('Entrega de turno registrada. La persona que recibe la verá en sus notificaciones.', 'success');
      setNotas(''); setEntrante(''); refrescar(); setN((x) => x + 1); setTab('historial');
    } catch (err) { setError(mensajeError(err)); } finally { setEnviando(false); }
  };

  return (
    <>
      <PageHeader titulo="Entrega de turno" descripcion="El resumen se arma solo con lo ocurrido desde la última entrega. Revísalo, agrega tus notas y entrégalo.">
        {tab === 'nueva' && resumen.datos && <small>Cubre desde {fmtFechaHora(resumen.datos.desde)}</small>}
      </PageHeader>
      <Tabs valor={tab} onChange={setTab} tabs={[{ id: 'nueva', label: 'Nueva entrega' }, { id: 'historial', label: 'Historial', badge: hist.datos?.data.filter((t) => !t.confirmada && t.usuario_entrante_id === usuario?.id).length }]} />

      {tab === 'nueva' && <>
        {resumen.cargando && !resumen.datos && <Cargando texto="Generando resumen automático…" />}{resumen.error && <ErrorBox mensaje={resumen.error} onReintentar={resumen.recargar} />}
        {resumen.datos && <ResumenVista r={resumen.datos} />}
        <form className="card" onSubmit={enviar}>
          <div className="card__t"><h3>Entregar turno</h3></div>
          {error && <div className="alerta alerta--error" role="alert" style={{ marginBottom: 8 }}>{error}</div>}
          <div className="form-grid">
            <Campo etiqueta="Turno que entregas" requerido><select className="select" value={turno || resumen.datos?.turnoSugerido || 'mañana'} onChange={(e) => setTurno(e.target.value)}><option value="mañana">Mañana</option><option value="tarde">Tarde</option><option value="noche">Noche</option></select></Campo>
            <Campo etiqueta="Quién recibe" requerido><select className="select" value={entrante} onChange={(e) => setEntrante(e.target.value ? Number(e.target.value) : '')}>
              <option value="">Selecciona…</option>{(dir.datos ?? []).filter((u) => u.id !== usuario?.id).map((u) => <option key={u.id} value={u.id}>{nombreCompleto(u)} · {ROLES[u.rol]}</option>)}</select></Campo>
            <Campo etiqueta="Notas del relevo" ancho ayuda="Pendientes, indicaciones familiares o médicas, cosas a vigilar."><textarea className="textarea" rows={3} value={notas} onChange={(e) => setNotas(e.target.value)} /></Campo>
          </div>
          <div className="barra" style={{ marginTop: 10, justifyContent: 'flex-end' }}><button className="btn btn--p" disabled={enviando || !resumen.datos}>{enviando ? 'Entregando…' : 'Entregar turno'}</button></div>
        </form>
      </>}

      {tab === 'historial' && <>
        {hist.cargando && !hist.datos && <Cargando />}{hist.error && <ErrorBox mensaje={hist.error} onReintentar={hist.recargar} />}
        {hist.datos && !hist.datos.data.length && <Vacio icono="🔁" texto="Aún no hay entregas de turno." />}
        {hist.datos && hist.datos.data.length > 0 && <>
          <div className="tabla-wrap"><table className="tabla"><thead><tr><th>Fecha</th><th>Turno</th><th>Entrega</th><th>Recibe</th><th>Estado</th><th /></tr></thead>
            <tbody>{hist.datos.data.map((t) => (
              <tr key={t.id} className="click" onClick={() => setVer(t.id)}>
                <td>{fmtFechaHora(t.fecha_entrega)}</td><td style={{ textTransform: 'capitalize' }}>{t.turno ?? '—'}</td>
                <td>{nombreCompleto({ nombre: t.saliente_nombre, apellido: t.saliente_apellido })}</td><td>{nombreCompleto({ nombre: t.entrante_nombre, apellido: t.entrante_apellido })}</td>
                <td>{t.confirmada ? <span className="badge badge--ok">Confirmado</span> : <span className="badge badge--warn">Pendiente</span>}</td>
                <td className="acc"><button className="btn btn--sm" onClick={(e) => { e.stopPropagation(); setVer(t.id); }}>Ver</button></td></tr>))}</tbody></table></div>
          <Paginacion page={hist.datos.page} paginas={hist.datos.paginas} total={hist.datos.total} onChange={setPage} /></>}
      </>}
      {ver && <DetalleTurno id={ver} onClose={() => setVer(null)} onCambio={() => { setN((x) => x + 1); refrescar(); }} />}
    </>
  );
}

function DetalleTurno({ id, onClose, onCambio }: { id: number; onClose: () => void; onCambio: () => void }) {
  const { usuario } = useApp();
  const toast = useToast();
  const { datos: t, cargando, error, recargar } = useCarga(() => api.get<Turno>(`/turnos/${id}`), [id]);
  const [confirmar, setConfirmar] = useState(false);
  const puede = t && !t.confirmada && t.usuario_entrante_id === usuario?.id;
  return (
    <Drawer titulo="Entrega de turno" onClose={onClose} pie={t && <><ExportarBotones tipo="turno" params={{ id }} />{puede && <button className="btn btn--p" onClick={() => setConfirmar(true)}>Confirmar recepción</button>}</>}>
      {cargando && !t && <Cargando />}{error && <ErrorBox mensaje={error} onReintentar={recargar} />}
      {t && <>
        <Dl filas={[['Fecha', fmtFechaHora(t.fecha_entrega)], ['Turno', t.turno], ['Entrega', nombreCompleto({ nombre: t.saliente_nombre, apellido: t.saliente_apellido })], ['Recibe', nombreCompleto({ nombre: t.entrante_nombre, apellido: t.entrante_apellido })],
          ['Estado', t.confirmada ? `Confirmado ${fmtFechaHora(t.fecha_confirmacion)}` : 'Pendiente de confirmar']]} />
        {t.notas_relevo && <div><h4>Notas del relevo</h4><p style={{ whiteSpace: 'pre-wrap' }}>{t.notas_relevo}</p></div>}
        {t.resumen && <ResumenVista r={t.resumen} />}</>}
      {confirmar && <Confirmar titulo="Confirmar recepción" textoAceptar="Confirmar" mensaje="Confirmas que recibiste este turno y revisaste el resumen." onCancelar={() => setConfirmar(false)}
        onAceptar={async () => { await api.post(`/turnos/${id}/confirmar`); toast('Turno confirmado', 'success'); setConfirmar(false); recargar(); onCambio(); }} />}
    </Drawer>
  );
}
