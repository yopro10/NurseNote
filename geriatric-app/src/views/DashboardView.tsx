import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { api } from '../api/client';
import { useApp } from '../context/AppContext';
import { Avatar, Cargando, EstadoBadge, ErrorBox, ExportarBotones, Vacio, useCarga } from '../components/ui';
import { IconoAlerta, IconoFlecha, IconoInventario, IconoMedicamentos, IconoNotas, IconoPacientes, IconoTurno, IconoVitales } from '../components/Icons';
import { fmtDiaCorto, fmtHora, hace } from '../utils/format';

interface Resumen {
  pacientes: { total: number; criticos: number; observacion: number; estables: number };
  registrosHoy: { notas: number; signos: number; administraciones: number; total: number };
  inventario: { vencidos: number; por_vencer: number; bajo_stock: number; total: number };
  medicacion: { administradas: number; pendientes: number; atrasadas: number; omitidas: number; total: number; cumplimiento: number | null };
  prioritarios: Array<{ id: number; nombre: string; apellido: string; habitacion?: string; estado: string; motivo?: string; fecha_ultimo_estado?: string }>;
  proximasDosis: Array<{ id: number; horario_programado: string; paciente_id: number; nombre: string; apellido: string; habitacion?: string; medicamento: string; dosis_prescrita?: string; atrasada: boolean }>;
  ultimos7dias: Array<{ fecha: string; notas: number; signos: number; administraciones: number }>;
  alertasVitales: Array<{ nivel: number; residente: string; habitacion?: string; paciente_id: number; fecha: string; hallazgos: Array<{ texto: string }> }>;
  ultimoTurno: { id: number; fecha_entrega: string; turno?: string; confirmada: boolean; saliente?: string; entrante?: string } | null;
}

function saludo() { const h = new Date().getHours(); return h < 12 ? 'Buenos días' : h < 19 ? 'Buenas tardes' : 'Buenas noches'; }

export default function DashboardView() {
  const { usuario, ir, tick } = useApp();
  const { datos: d, cargando, error, recargar } = useCarga(() => api.get<Resumen>('/dashboard/resumen'), [tick]);

  if (cargando && !d) return <Cargando texto="Cargando panel…" />;
  if (error || !d) return <ErrorBox mensaje={error ?? 'No se pudo cargar el panel'} onReintentar={recargar} />;

  const alertasInv = d.inventario.vencidos + d.inventario.por_vencer + d.inventario.bajo_stock;
  const serie = d.ultimos7dias.map((x) => ({ ...x, dia: fmtDiaCorto(x.fecha) }));

  return (
    <>
      <section className="bienvenida">
        <div>
          <h2>{saludo()}, {usuario?.nombre}</h2>
          <p>{d.pacientes.criticos === 0 ? 'Ningún residente en estado crítico.' : `${d.pacientes.criticos} residente${d.pacientes.criticos === 1 ? '' : 's'} en estado crítico requiere${d.pacientes.criticos === 1 ? '' : 'n'} seguimiento.`}
            {d.medicacion.atrasadas > 0 && ` ${d.medicacion.atrasadas} dosis atrasada${d.medicacion.atrasadas === 1 ? '' : 's'}.`}</p>
        </div>
        <button className="btn" onClick={() => ir('turnos')}><IconoTurno size={15} /> Entregar turno</button>
        <ExportarBotones tipo="residentes" etiqueta="Exportar residentes" />
      </section>

      <section className="kpis" aria-label="Resumen del hogar">
        <button className="kpi" onClick={() => ir('residentes')}><span className="kpi__ic"><IconoPacientes size={18} /></span><span><b>{d.pacientes.total}</b><span>Residentes activos</span></span></button>
        <button className="kpi kpi--warn" onClick={() => ir('residentes')}><span className="kpi__ic"><IconoAlerta size={18} /></span><span><b>{d.pacientes.observacion}</b><span>En observación</span></span></button>
        <button className="kpi kpi--crit" onClick={() => ir('residentes')}><span className="kpi__ic"><IconoVitales size={18} /></span><span><b>{d.pacientes.criticos}</b><span>Estado crítico</span></span></button>
        <button className="kpi kpi--ok" onClick={() => ir('notas')}><span className="kpi__ic"><IconoNotas size={18} /></span><span><b>{d.registrosHoy.total}</b><span>Registros hoy</span></span></button>
        <button className="kpi kpi--mor" onClick={() => ir('medicamentos')}><span className="kpi__ic"><IconoMedicamentos size={18} /></span>
          <span><b>{d.medicacion.cumplimiento === null ? '—' : `${d.medicacion.cumplimiento}%`}</b><span>Medicación de hoy</span></span></button>
        <button className={`kpi ${alertasInv ? 'kpi--warn' : 'kpi--ok'}`} onClick={() => ir('inventario')}><span className="kpi__ic"><IconoInventario size={18} /></span><span><b>{alertasInv}</b><span>Alertas de inventario</span></span></button>
      </section>

      <section className="grid2">
        <div className="card">
          <div className="card__t"><h3>Requieren atención</h3><small>{d.prioritarios.length} residentes</small></div>
          {!d.prioritarios.length ? <Vacio icono="🌿" texto="Todo en calma: ningún residente en observación." /> : (
            <ul className="lista">{d.prioritarios.map((p) => (
              <li key={p.id}><button className={`fila fila--${p.estado === 'Crítico' ? 'crit' : 'warn'}`} onClick={() => ir('ficha', { pacienteId: p.id })}>
                <Avatar nombre={p.nombre} apellido={p.apellido} id={p.id} sm />
                <div><strong>{p.nombre} {p.apellido} · Hab. {p.habitacion ?? '—'}</strong><small className="clamp2">{p.motivo ?? ''}</small></div>
                <EstadoBadge estado={p.estado} /><IconoFlecha size={14} /></button></li>))}</ul>)}
        </div>

        <div className="card">
          <div className="card__t"><h3>Próximas dosis de hoy</h3><button className="btn btn--sm" onClick={() => ir('medicamentos')}>Ver todas</button></div>
          {!d.proximasDosis.length ? <Vacio icono="💊" texto="No hay dosis pendientes para hoy." /> : (
            <ul className="lista">{d.proximasDosis.map((x) => (
              <li key={x.id}><button className={`fila ${x.atrasada ? 'fila--crit' : ''}`} onClick={() => ir('medicamentos')}>
                <div><strong>{x.medicamento} {x.dosis_prescrita ?? ''}</strong><small>{x.nombre} {x.apellido} · Hab. {x.habitacion ?? '—'}</small></div>
                <span className={`badge ${x.atrasada ? 'badge--crit' : 'badge--info'}`}>{x.atrasada ? 'Atrasada ' : ''}{fmtHora(x.horario_programado)}</span></button></li>))}</ul>)}
        </div>
      </section>

      <section className="grid2">
        <div className="card">
          <div className="card__t"><h3>Actividad de los últimos 7 días</h3><small>Notas · signos · dosis</small></div>
          <div className="grafica grafica--sm"><ResponsiveContainer>
            <BarChart data={serie} margin={{ top: 4, right: 4, left: -22, bottom: 0 }}><CartesianGrid strokeDasharray="3 3" stroke="#ece1cf" /><XAxis dataKey="dia" fontSize={11} /><YAxis allowDecimals={false} fontSize={11} />
              <Tooltip /><Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="notas" name="Notas" fill="#0f7a5c" radius={[3, 3, 0, 0]} /><Bar dataKey="signos" name="Signos vitales" fill="#d4465c" radius={[3, 3, 0, 0]} />
              <Bar dataKey="administraciones" name="Dosis" fill="#6d4fd0" radius={[3, 3, 0, 0]} /></BarChart></ResponsiveContainer></div>
        </div>
        <div className="card">
          <div className="card__t"><h3>Signos alterados (24 h)</h3><button className="btn btn--sm" onClick={() => ir('signos')}>Ver signos</button></div>
          {!d.alertasVitales.length ? <Vacio icono="❤️" texto="Sin signos vitales alterados en las últimas 24 horas." /> : (
            <ul className="lista">{d.alertasVitales.map((a) => (
              <li key={a.paciente_id}><button className={`fila fila--${a.nivel === 2 ? 'crit' : 'warn'}`} onClick={() => ir('ficha', { pacienteId: a.paciente_id, tab: 'signos' })}>
                <div><strong>{a.residente} · Hab. {a.habitacion ?? '—'}</strong><small>{a.hallazgos.map((h) => h.texto).join(' · ')}</small></div><small>{hace(a.fecha)}</small></button></li>))}</ul>)}
          <div className="barra" style={{ marginTop: 8 }}>
            <small>Último relevo: {d.ultimoTurno ? `${d.ultimoTurno.turno ?? ''} · ${d.ultimoTurno.saliente ?? ''} → ${d.ultimoTurno.entrante ?? ''} (${d.ultimoTurno.confirmada ? 'confirmado' : 'sin confirmar'})` : 'aún no hay entregas de turno'}</small>
          </div>
        </div>
      </section>
    </>
  );
}
