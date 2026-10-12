import { CartesianGrid, Legend, Line, LineChart, ReferenceArea, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { api } from '../api/client';
import { fmtFechaHora, aFecha } from '../utils/format';
import { Cargando, ErrorBox, Vacio, useCarga } from './ui';
import { useState } from 'react';

interface Punto { fecha: string; presion_sistolica?: number; presion_diastolica?: number; frecuencia_cardiaca?: number; temperatura?: number; saturacion_oxigeno?: number }

const etiq = (f: string) => { const d = aFecha(f); return d ? `${d.getDate()}/${d.getMonth() + 1} ${String(d.getHours()).padStart(2, '0')}h` : f; };

export default function SignosGrafica({ pacienteId, version = 0 }: { pacienteId: number; version?: number }) {
  const [dias, setDias] = useState(7);
  const { datos, cargando, error, recargar } = useCarga(() => api.get<Punto[]>(`/signos-vitales/paciente/${pacienteId}/tendencias`, { dias }), [pacienteId, dias, version]);
  if (cargando && !datos) return <Cargando texto="Cargando tendencias…" />;
  if (error) return <ErrorBox mensaje={error} onReintentar={recargar} />;
  const d = (datos ?? []).map((p) => ({ ...p, t: etiq(p.fecha), tip: fmtFechaHora(p.fecha) }));
  return (
    <div className="card">
      <div className="card__t"><h3>Tendencias</h3>
        <select className="select" style={{ width: 'auto' }} value={dias} onChange={(e) => setDias(Number(e.target.value))} aria-label="Periodo">
          <option value={7}>Últimos 7 días</option><option value={30}>Últimos 30 días</option><option value={90}>Últimos 90 días</option></select></div>
      {!d.length ? <Vacio icono="📈" texto="No hay registros en este periodo para graficar." /> : (
        <div className="grid2">
          <div className="grafica grafica--sm"><ResponsiveContainer>
            <LineChart data={d} margin={{ top: 4, right: 8, left: -18, bottom: 0 }}><CartesianGrid strokeDasharray="3 3" stroke="#ece1cf" />
              <XAxis dataKey="t" fontSize={10} interval="preserveStartEnd" /><YAxis fontSize={10} domain={['auto', 'auto']} /><Tooltip labelFormatter={(_, p) => p?.[0]?.payload?.tip} /><Legend wrapperStyle={{ fontSize: 11 }} />
              <Line type="monotone" dataKey="presion_sistolica" name="PA sistólica" stroke="#d4465c" dot={false} strokeWidth={2} connectNulls />
              <Line type="monotone" dataKey="presion_diastolica" name="PA diastólica" stroke="#e8909e" dot={false} strokeWidth={2} connectNulls />
              <Line type="monotone" dataKey="frecuencia_cardiaca" name="FC" stroke="#6d4fd0" dot={false} strokeWidth={2} connectNulls /></LineChart></ResponsiveContainer></div>
          <div className="grafica grafica--sm"><ResponsiveContainer>
            <LineChart data={d} margin={{ top: 4, right: 8, left: -18, bottom: 0 }}><CartesianGrid strokeDasharray="3 3" stroke="#ece1cf" />
              <XAxis dataKey="t" fontSize={10} interval="preserveStartEnd" /><YAxis yAxisId="o" fontSize={10} domain={[85, 100]} /><YAxis yAxisId="t" orientation="right" fontSize={10} domain={[35, 40]} />
              <Tooltip labelFormatter={(_, p) => p?.[0]?.payload?.tip} /><Legend wrapperStyle={{ fontSize: 11 }} />
              <ReferenceArea yAxisId="o" y1={95} y2={100} fill="#dff4ea" fillOpacity={0.5} />
              <Line yAxisId="o" type="monotone" dataKey="saturacion_oxigeno" name="SpO₂ %" stroke="#1f78b4" dot={false} strokeWidth={2} connectNulls />
              <Line yAxisId="t" type="monotone" dataKey="temperatura" name="Temp °C" stroke="#c27a0a" dot={false} strokeWidth={2} connectNulls /></LineChart></ResponsiveContainer></div>
        </div>)}
    </div>
  );
}
