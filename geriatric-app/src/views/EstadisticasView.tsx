import { useState } from 'react';
import { Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { api } from '../api/client';
import { useApp } from '../context/AppContext';
import { Cargando, ErrorBox, ExportarBotones, PageHeader, Vacio, useCarga } from '../components/ui';
import { fmtDiaCorto, hoyISO, TIPOS_NOTA } from '../utils/format';

interface Est {
  rango: { desde: string; hasta: string; dias: number };
  kpis: { notas: number; signos: number; administradas: number; omitidas: number; cumplimiento: number | null; residentesActivos: number; ingresos: number; egresos: number; alertasVitales: number; alertasCriticas: number };
  porDia: Array<{ fecha: string; notas: number; signos: number; administradas: number; omitidas: number }>;
  notasPorTipo: Array<{ tipo: string; total: number }>;
  estadoResidentes: Array<{ estado: string; total: number }>;
  administracionesPorEstado: Array<{ estado: string; total: number }>;
  topResidentes: Array<{ id: number; nombre: string; habitacion?: string; registros: number }>;
  porUsuario: Array<{ nombre: string; total: number }>;
  alertasPorParametro: Array<{ parametro: string; total: number }>;
  inventario: { vencidos: number; por_vencer: number; bajo_stock: number; ok: number };
}

const COLOR_ESTADO: Record<string, string> = { Estable: '#15803d', 'En Observación': '#d89211', Crítico: '#c9352b' };
const COLOR_ADMIN: Record<string, string> = { administrada: '#15803d', omitida: '#d89211', rechazada: '#c9352b', programada: '#1f78b4' };
const NOMBRE_ADMIN: Record<string, string> = { administrada: 'Administradas', omitida: 'Omitidas', rechazada: 'Rechazadas', programada: 'Pendientes/atrasadas' };
const PRESETS = [{ l: '7 días', d: 7 }, { l: '30 días', d: 30 }, { l: '90 días', d: 90 }];

const Grafica = ({ titulo, sub, children, vacio }: { titulo: string; sub?: string; children: React.ReactNode; vacio?: boolean }) => (
  <div className="card"><div className="card__t"><h3>{titulo}</h3>{sub && <small>{sub}</small>}</div>{vacio ? <Vacio icono="📊" texto="Sin datos en este periodo." /> : <div className="grafica">{children}</div>}</div>
);

export default function EstadisticasView() {
  const { tick } = useApp();
  const [desde, setDesde] = useState(hoyISO(-29));
  const [hasta, setHasta] = useState(hoyISO());
  const valido = desde <= hasta;
  const { datos: e, cargando, error, recargar } = useCarga(() => (valido ? api.get<Est>('/estadisticas', { desde, hasta }) : Promise.reject(new Error('La fecha inicial no puede ser posterior a la final'))), [desde, hasta, tick]);
  const dias = (d: number) => { setDesde(hoyISO(-(d - 1))); setHasta(hoyISO()); };
  const serie = (e?.porDia ?? []).map((d) => ({ ...d, dia: fmtDiaCorto(d.fecha) }));

  return (
    <>
      <PageHeader titulo="Estadísticas" descripcion="Actividad del hogar en el periodo que elijas.">
        <ExportarBotones tipo="estadisticas" params={{ desde, hasta }} />
      </PageHeader>
      <div className="card"><div className="barra">
        <label className="campo" style={{ gridAutoFlow: 'column', alignItems: 'center', gap: 6 }}><span>Desde</span><input className="input" type="date" value={desde} max={hasta} onChange={(x) => setDesde(x.target.value)} /></label>
        <label className="campo" style={{ gridAutoFlow: 'column', alignItems: 'center', gap: 6 }}><span>Hasta</span><input className="input" type="date" value={hasta} min={desde} max={hoyISO()} onChange={(x) => setHasta(x.target.value)} /></label>
        <span className="chips">{PRESETS.map((p) => <button key={p.d} className="chip" onClick={() => dias(p.d)}>Últimos {p.l}</button>)}</span>
        {e && <small>{e.rango.dias} días analizados</small>}</div></div>

      {cargando && !e && <Cargando />}{error && <ErrorBox mensaje={error} onReintentar={recargar} />}
      {e && <>
        <section className="kpis">
          <div className="kpi kpi--ok"><span><b>{e.kpis.notas}</b><span>Notas de enfermería</span></span></div>
          <div className="kpi"><span><b>{e.kpis.signos}</b><span>Registros de signos</span></span></div>
          <div className="kpi kpi--mor"><span><b>{e.kpis.administradas}</b><span>Dosis administradas</span></span></div>
          <div className={`kpi ${e.kpis.cumplimiento !== null && e.kpis.cumplimiento < 85 ? 'kpi--warn' : 'kpi--ok'}`}><span><b>{e.kpis.cumplimiento === null ? '—' : `${e.kpis.cumplimiento}%`}</b><span>Cumplimiento de medicación</span></span></div>
          <div className={`kpi ${e.kpis.alertasVitales ? 'kpi--warn' : 'kpi--ok'}`}><span><b>{e.kpis.alertasVitales}</b><span>Registros con alerta ({e.kpis.alertasCriticas} críticos)</span></span></div>
          <div className="kpi"><span><b>{e.kpis.ingresos}/{e.kpis.egresos}</b><span>Ingresos / egresos</span></span></div>
        </section>

        <section className="grid2">
          <Grafica titulo="Actividad por día" sub="Notas, signos vitales y dosis" vacio={!serie.some((d) => d.notas + d.signos + d.administradas)}>
            <ResponsiveContainer><BarChart data={serie} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}><CartesianGrid strokeDasharray="3 3" stroke="#ece1cf" /><XAxis dataKey="dia" fontSize={11} interval="preserveStartEnd" /><YAxis allowDecimals={false} fontSize={11} /><Tooltip /><Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="notas" name="Notas" fill="#0f7a5c" radius={[3, 3, 0, 0]} /><Bar dataKey="signos" name="Signos vitales" fill="#d4465c" radius={[3, 3, 0, 0]} /><Bar dataKey="administradas" name="Dosis administradas" fill="#6d4fd0" radius={[3, 3, 0, 0]} /></BarChart></ResponsiveContainer></Grafica>
          <Grafica titulo="Medicación: administradas vs omitidas" sub="Tendencia diaria" vacio={!serie.some((d) => d.administradas + d.omitidas)}>
            <ResponsiveContainer><LineChart data={serie} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}><CartesianGrid strokeDasharray="3 3" stroke="#ece1cf" /><XAxis dataKey="dia" fontSize={11} interval="preserveStartEnd" /><YAxis allowDecimals={false} fontSize={11} /><Tooltip /><Legend wrapperStyle={{ fontSize: 12 }} />
              <Line type="monotone" dataKey="administradas" name="Administradas" stroke="#15803d" strokeWidth={2} dot={false} /><Line type="monotone" dataKey="omitidas" name="Omitidas / rechazadas" stroke="#c9352b" strokeWidth={2} dot={false} /></LineChart></ResponsiveContainer></Grafica>
        </section>

        <section className="grid3">
          <Grafica titulo="Residentes por estado" sub="Situación actual" vacio={!e.estadoResidentes.length}>
            <ResponsiveContainer><PieChart><Pie data={e.estadoResidentes} dataKey="total" nameKey="estado" innerRadius={44} outerRadius={78} paddingAngle={2} label={(x) => `${x.value}`}>{e.estadoResidentes.map((s) => <Cell key={s.estado} fill={COLOR_ESTADO[s.estado] ?? '#888'} />)}</Pie><Tooltip /><Legend wrapperStyle={{ fontSize: 12 }} /></PieChart></ResponsiveContainer></Grafica>
          <Grafica titulo="Resultado de las dosis" vacio={!e.administracionesPorEstado.length}>
            <ResponsiveContainer><PieChart><Pie data={e.administracionesPorEstado.map((s) => ({ ...s, nombre: NOMBRE_ADMIN[s.estado] ?? s.estado }))} dataKey="total" nameKey="nombre" innerRadius={44} outerRadius={78} paddingAngle={2} label={(x) => `${x.value}`}>{e.administracionesPorEstado.map((s) => <Cell key={s.estado} fill={COLOR_ADMIN[s.estado] ?? '#888'} />)}</Pie><Tooltip /><Legend wrapperStyle={{ fontSize: 12 }} /></PieChart></ResponsiveContainer></Grafica>
          <Grafica titulo="Notas por tipo" vacio={!e.notasPorTipo.length}>
            <ResponsiveContainer><BarChart data={e.notasPorTipo.map((t) => ({ ...t, nombre: TIPOS_NOTA[t.tipo] ?? t.tipo }))} layout="vertical" margin={{ top: 4, right: 12, left: 10, bottom: 0 }}><CartesianGrid strokeDasharray="3 3" stroke="#ece1cf" /><XAxis type="number" allowDecimals={false} fontSize={11} /><YAxis type="category" dataKey="nombre" fontSize={11} width={84} /><Tooltip /><Bar dataKey="total" name="Notas" fill="#0f7a5c" radius={[0, 3, 3, 0]} /></BarChart></ResponsiveContainer></Grafica>
        </section>

        <section className="grid3">
          <Grafica titulo="Residentes con más registros" sub="Notas + signos" vacio={!e.topResidentes.some((t) => t.registros)}>
            <ResponsiveContainer><BarChart data={e.topResidentes.filter((t) => t.registros)} layout="vertical" margin={{ top: 4, right: 12, left: 10, bottom: 0 }}><CartesianGrid strokeDasharray="3 3" stroke="#ece1cf" /><XAxis type="number" allowDecimals={false} fontSize={11} /><YAxis type="category" dataKey="nombre" fontSize={10} width={110} /><Tooltip /><Bar dataKey="registros" name="Registros" fill="#1f78b4" radius={[0, 3, 3, 0]} /></BarChart></ResponsiveContainer></Grafica>
          <Grafica titulo="Signos alterados por parámetro" vacio={!e.alertasPorParametro.length}>
            <ResponsiveContainer><BarChart data={e.alertasPorParametro} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}><CartesianGrid strokeDasharray="3 3" stroke="#ece1cf" /><XAxis dataKey="parametro" fontSize={10} interval={0} angle={-20} textAnchor="end" height={46} /><YAxis allowDecimals={false} fontSize={11} /><Tooltip /><Bar dataKey="total" name="Alertas" fill="#d4465c" radius={[3, 3, 0, 0]} /></BarChart></ResponsiveContainer></Grafica>
          <Grafica titulo="Registros por funcionario" vacio={!e.porUsuario.length}>
            <ResponsiveContainer><BarChart data={e.porUsuario} layout="vertical" margin={{ top: 4, right: 12, left: 10, bottom: 0 }}><CartesianGrid strokeDasharray="3 3" stroke="#ece1cf" /><XAxis type="number" allowDecimals={false} fontSize={11} /><YAxis type="category" dataKey="nombre" fontSize={10} width={100} /><Tooltip /><Bar dataKey="total" name="Registros" fill="#0e8f86" radius={[0, 3, 3, 0]} /></BarChart></ResponsiveContainer></Grafica>
        </section>

        <div className="card"><div className="card__t"><h3>Estado del inventario</h3><small>Situación actual</small></div>
          <div className="kpis">
            <div className="kpi kpi--ok"><span><b>{e.inventario.ok}</b><span>En buen estado</span></span></div><div className="kpi kpi--warn"><span><b>{e.inventario.bajo_stock}</b><span>Stock bajo</span></span></div>
            <div className="kpi kpi--warn"><span><b>{e.inventario.por_vencer}</b><span>Por vencer</span></span></div><div className="kpi kpi--crit"><span><b>{e.inventario.vencidos}</b><span>Vencidos</span></span></div></div></div>
      </>}
    </>
  );
}
