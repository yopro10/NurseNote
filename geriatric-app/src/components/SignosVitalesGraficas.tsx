import { useState, useEffect } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

interface TendenciaData {
  fecha: string;
  presion_sistolica?: number;
  presion_diastolica?: number;
  frecuencia_cardiaca?: number;
  temperatura?: number;
  saturacion_oxigeno?: number;
}

interface SignosVitalesGraficasProps {
  pacienteId: number;
}

export default function SignosVitalesGraficas({ pacienteId }: SignosVitalesGraficasProps) {
  const [tendencias, setTendencias] = useState<TendenciaData[]>([]);
  const [cargando, setCargando] = useState(true);
  const [dias, setDias] = useState(30);

  useEffect(() => {
    cargarTendencias();
  }, [pacienteId, dias]);

  const cargarTendencias = async () => {
    try {
      const response = await fetch(`http://localhost:3000/api/signos-vitales/paciente/${pacienteId}/tendencias?dias=${dias}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      });
      const data = await response.json();
      setTendencias(data);
    } catch (error) {
      console.error('Error al cargar tendencias:', error);
    } finally {
      setCargando(false);
    }
  };

  if (cargando) {
    return (
      <div className="cargando-bloque">
        <div className="spinner"></div>
        <p>Cargando gráficas de tendencia...</p>
      </div>
    );
  }

  if (tendencias.length === 0) {
    return (
      <div className="alerta alerta--info">
        <p>No hay datos suficientes para mostrar las gráficas de tendencia.</p>
      </div>
    );
  }

  const datosFormateados = tendencias.map((t) => ({
    ...t,
    fecha: new Date(t.fecha).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' })
  }));

  return (
    <div className="signos-graficas">
      <div className="signos-graficas__header">
        <h3>Gráficas de Tendencia</h3>
        <select
          value={dias}
          onChange={(e) => setDias(parseInt(e.target.value))}
          className="boton boton--pequeno"
        >
          <option value={7}>Últimos 7 días</option>
          <option value={14}>Últimos 14 días</option>
          <option value={30}>Últimos 30 días</option>
          <option value={60}>Últimos 60 días</option>
        </select>
      </div>

      <div className="signos-graficas__contenedor">
        {/* Presión Arterial */}
        <div className="grafica-card">
          <h4>Presión Arterial</h4>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={datosFormateados}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="fecha" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="presion_sistolica"
                stroke="#ef4444"
                name="Sistólica"
                strokeWidth={2}
              />
              <Line
                type="monotone"
                dataKey="presion_diastolica"
                stroke="#3b82f6"
                name="Diastólica"
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Frecuencia Cardíaca */}
        <div className="grafica-card">
          <h4>Frecuencia Cardíaca</h4>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={datosFormateados}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="fecha" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="frecuencia_cardiaca"
                stroke="#10b981"
                name="FC (lpm)"
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Temperatura */}
        <div className="grafica-card">
          <h4>Temperatura</h4>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={datosFormateados}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="fecha" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="temperatura"
                stroke="#f59e0b"
                name="Temp (°C)"
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Saturación de Oxígeno */}
        <div className="grafica-card">
          <h4>Saturación de Oxígeno</h4>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={datosFormateados}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="fecha" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="saturacion_oxigeno"
                stroke="#8b5cf6"
                name="SpO₂ (%)"
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
