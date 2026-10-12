import { useMemo, useState } from 'react';
import { api } from '../api/client';
import { useApp } from '../context/AppContext';
import { SignosFormModal } from '../components/forms';
import SignosGrafica from '../components/SignosGrafica';
import { IconoMas } from '../components/Icons';
import { Buscador, Cargando, Chips, Drawer, EstadoBadge, ErrorBox, ExportarBotones, PageHeader, Vacio, useCarga } from '../components/ui';
import type { ResumenSignos } from '../types';
import { fmtFechaHora, hace, nombreCompleto } from '../utils/format';
import { evaluarSignos, nivelDe } from '../utils/rangos';

type Filtro = 'todos' | 'criticos' | 'alterados' | 'sin';

export default function SignosVitalesView() {
  const { tick, ir } = useApp();
  const [q, setQ] = useState('');
  const [filtro, setFiltro] = useState<Filtro>('todos');
  const [sel, setSel] = useState<ResumenSignos | null>(null);
  const [form, setForm] = useState<null | { pacienteId?: number }>(null);
  const [n, setN] = useState(0);
  const { datos, cargando, error, recargar } = useCarga(() => api.get<ResumenSignos[]>('/signos-vitales/resumen'), [tick, n]);

  const filas = useMemo(() => (datos ?? []).map((f) => ({ ...f, ev: f.fecha_registro ? evaluarSignos(f) : null })), [datos]);
  const hace24 = (f?: string | null) => !!f && Date.now() - (Date.parse(f) || 0) < 24 * 3600 * 1000;
  const visibles = filas.filter((f) => {
    if (q && !nombreCompleto({ nombre: f.paciente_nombre, apellido: f.paciente_apellido }).toLowerCase().includes(q.toLowerCase()) && !(f.habitacion ?? '').includes(q)) return false;
    if (filtro === 'criticos') return f.ev?.nivel === 2;
    if (filtro === 'alterados') return (f.ev?.nivel ?? 0) > 0;
    if (filtro === 'sin') return !hace24(f.fecha_registro);
    return true;
  });
  const cuenta = { criticos: filas.filter((f) => f.ev?.nivel === 2).length, alterados: filas.filter((f) => (f.ev?.nivel ?? 0) > 0).length, sin: filas.filter((f) => !hace24(f.fecha_registro)).length };
  const celda = (f: ResumenSignos, campo: string, texto: unknown) => {
    const nivel = nivelDe(f, campo);
    return <td style={nivel ? { color: nivel === 2 ? 'var(--rojo)' : '#8a5300', fontWeight: 800 } : undefined}>{String(texto ?? '—')}</td>;
  };
  const selActual = sel ? filas.find((f) => f.paciente_id === sel.paciente_id) ?? sel : null;

  return (
    <>
      <PageHeader titulo="Signos vitales" descripcion="Último registro de cada residente. Los valores fuera de rango se resaltan y definen su estado.">
        <ExportarBotones tipo="signos" />
        <button className="btn btn--p" onClick={() => setForm({})}><IconoMas size={15} /> Registrar signos</button>
      </PageHeader>
      <div className="barra">
        <Buscador valor={q} onChange={setQ} placeholder="Buscar residente o habitación…" />
        <Chips valor={filtro} onChange={setFiltro} opciones={[{ id: 'todos', etiqueta: 'Todos', cuenta: filas.length }, { id: 'criticos', etiqueta: 'Críticos', cuenta: cuenta.criticos }, { id: 'alterados', etiqueta: 'Alterados', cuenta: cuenta.alterados }, { id: 'sin', etiqueta: 'Sin registro en 24 h', cuenta: cuenta.sin }]} />
      </div>
      {cargando && !datos && <Cargando />}{error && <ErrorBox mensaje={error} onReintentar={recargar} />}
      {datos && !visibles.length && <Vacio icono="🩺" texto="No hay residentes con este filtro." />}
      {visibles.length > 0 && <div className="tabla-wrap"><table className="tabla"><thead><tr><th>Residente</th><th>Estado</th><th>PA</th><th>FC</th><th>Temp</th><th>SpO₂</th><th>FR</th><th>Glucosa</th><th>Último registro</th><th /></tr></thead>
        <tbody>{visibles.map((f) => (
          <tr key={f.paciente_id} className={`click ${f.ev?.nivel === 2 ? 'fila--crit' : f.ev?.nivel === 1 ? 'fila--warn' : ''}`} onClick={() => setSel(f)}>
            <td>{nombreCompleto({ nombre: f.paciente_nombre, apellido: f.paciente_apellido })}<small>Hab. {f.habitacion ?? '—'}</small></td>
            <td><EstadoBadge estado={f.estado_calculado} /></td>
            {celda(f, 'presion_sistolica', f.presion_sistolica ? `${f.presion_sistolica}/${f.presion_diastolica}` : null)}
            {celda(f, 'frecuencia_cardiaca', f.frecuencia_cardiaca)}{celda(f, 'temperatura', f.temperatura)}{celda(f, 'saturacion_oxigeno', f.saturacion_oxigeno)}
            {celda(f, 'frecuencia_respiratoria', f.frecuencia_respiratoria)}{celda(f, 'glucosa', f.glucosa)}
            <td>{f.fecha_registro ? <>{hace(f.fecha_registro)}<small>{fmtFechaHora(f.fecha_registro)}</small></> : <span className="badge badge--muted">Sin registros</span>}</td>
            <td className="acc"><button className="btn btn--sm" onClick={(e) => { e.stopPropagation(); setSel(f); }}>Ver</button> <button className="btn btn--sm btn--p" onClick={(e) => { e.stopPropagation(); setForm({ pacienteId: f.paciente_id }); }}>+ Registrar</button></td></tr>))}</tbody></table></div>}

      {selActual && (
        <Drawer titulo={`${nombreCompleto({ nombre: selActual.paciente_nombre, apellido: selActual.paciente_apellido })} · Hab. ${selActual.habitacion ?? '—'}`} onClose={() => setSel(null)}
          pie={<><button className="btn" onClick={() => ir('ficha', { pacienteId: selActual.paciente_id, tab: 'signos' })}>Ver ficha completa</button><button className="btn btn--p" onClick={() => setForm({ pacienteId: selActual.paciente_id })}>Registrar signos</button></>}>
          <div className="barra"><EstadoBadge estado={selActual.estado_calculado} />{selActual.fecha_registro ? <small>Último registro: {fmtFechaHora(selActual.fecha_registro)}</small> : null}</div>
          {!selActual.fecha_registro ? <Vacio icono="🩺" texto="Este residente aún no tiene signos vitales." /> : <>
            <div className="signos-grid">
              {([['PA', 'presion_sistolica', selActual.presion_sistolica ? `${selActual.presion_sistolica}/${selActual.presion_diastolica}` : '—', 'mmHg'], ['Frec. cardíaca', 'frecuencia_cardiaca', selActual.frecuencia_cardiaca, 'lpm'], ['Temperatura', 'temperatura', selActual.temperatura, '°C'],
                ['SpO₂', 'saturacion_oxigeno', selActual.saturacion_oxigeno, '%'], ['Frec. resp.', 'frecuencia_respiratoria', selActual.frecuencia_respiratoria, 'rpm'], ['Glucosa', 'glucosa', selActual.glucosa, 'mg/dL']] as const).map(([l, c, v, u]) => {
                const nv = nivelDe(selActual, c); return <div key={l} className={`signo ${nv === 2 ? 'signo--crit' : nv === 1 ? 'signo--warn' : ''}`}><small>{l}</small><b>{v ?? '—'}</b> <small style={{ display: 'inline' }}>{v != null && v !== '—' ? u : ''}</small></div>; })}</div>
            {(() => { const e = evaluarSignos(selActual); return e.nivel > 0 ? <div className={`alerta ${e.nivel === 2 ? 'alerta--error' : 'alerta--warn'}`}><ul>{e.hallazgos.map((h) => <li key={h.campo}>{h.texto}</li>)}</ul></div> : <div className="alerta alerta--ok">Valores dentro de rango.</div>; })()}
            {selActual.observaciones && <p><b>Observaciones:</b> {selActual.observaciones}</p>}
            <SignosGrafica pacienteId={selActual.paciente_id} version={n} /></>}
        </Drawer>)}
      {form && <SignosFormModal pacienteId={form.pacienteId} onClose={() => setForm(null)} onGuardado={() => setN((x) => x + 1)} />}
    </>
  );
}
