import { CSSProperties, useEffect, useState } from 'react';
import PageHeader from '../components/PageHeader';

interface EstadisticasData {
  pacientes: { total: number; con_alergias: number; con_condiciones: number };
  usuarios: { total: number; enfermeras: number; jefes: number; administradores: number };
  notas: { total: number; hoy: number; ultima_semana: number };
}

interface MedidaProps {
  etiqueta: string;
  valor: number;
  total: number;
  color: 'azul' | 'verde' | 'rojo' | 'ambar' | 'morado' | 'oscuro';
}

function Medida({ etiqueta, valor, total, color }: MedidaProps) {
  const pct = total > 0 ? Math.round((valor / total) * 100) : 0;
  return (
    <div>
      <div className="medida__fila">
        <span>{etiqueta}</span>
        <strong>{valor}</strong>
      </div>
      <div className="barra" role="img" aria-label={`${etiqueta}: ${valor} de ${total}`}>
        <div className={`barra__relleno barra__relleno--${color}`} style={{ '--pct': `${pct}%` } as CSSProperties} />
      </div>
    </div>
  );
}

export default function EstadisticasView() {
  const [estadisticas, setEstadisticas] = useState<EstadisticasData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Simular carga de estadísticas
    const timer = setTimeout(() => {
      setEstadisticas({
        pacientes: { total: 5, con_alergias: 3, con_condiciones: 4 },
        usuarios: { total: 4, enfermeras: 2, jefes: 1, administradores: 1 },
        notas: { total: 0, hoy: 0, ultima_semana: 0 },
      });
    }, 600);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div>
      <PageHeader titulo="Estadísticas del sistema" descripcion="Métricas generales de residentes, personal y registros clínicos del hogar." />

      {error ? (
        <div className="cargando-bloque" role="alert">
          <p className="alerta alerta--error">Error: {error}</p>
        </div>
      ) : !estadisticas ? (
        <div className="cargando-bloque" role="status">
          <div className="spinner" />
          <p>Calculando estadísticas…</p>
        </div>
      ) : estadisticas.pacientes.total === 0 ? (
        <div className="cargando-bloque">
          <p>No hay datos disponibles para mostrar estadísticas.</p>
        </div>
      ) : (
        <div className="panel-grid">
          <section className="panel">
            <div className="panel__cabecera">
              <h3>Residentes</h3>
              <span className="panel__total">{estadisticas.pacientes.total}</span>
            </div>
            <div className="panel__medidas">
              <Medida etiqueta="Con alergias" valor={estadisticas.pacientes.con_alergias} total={estadisticas.pacientes.total} color="rojo" />
              <Medida etiqueta="Con condiciones crónicas" valor={estadisticas.pacientes.con_condiciones} total={estadisticas.pacientes.total} color="ambar" />
            </div>
          </section>

          <section className="panel">
            <div className="panel__cabecera">
              <h3>Personal</h3>
              <span className="panel__total">{estadisticas.usuarios.total}</span>
            </div>
            <div className="panel__medidas">
              <Medida etiqueta="Enfermeras" valor={estadisticas.usuarios.enfermeras} total={estadisticas.usuarios.total} color="verde" />
              <Medida etiqueta="Jefes de enfermería" valor={estadisticas.usuarios.jefes} total={estadisticas.usuarios.total} color="morado" />
              <Medida etiqueta="Administradores" valor={estadisticas.usuarios.administradores} total={estadisticas.usuarios.total} color="oscuro" />
            </div>
          </section>

          <section className="panel">
            <div className="panel__cabecera">
              <h3>Registros clínicos</h3>
              <span className="panel__total">{estadisticas.notas.total}</span>
            </div>
            <div className="panel__medidas">
              <Medida etiqueta="Hoy" valor={estadisticas.notas.hoy} total={estadisticas.notas.total} color="azul" />
              <Medida etiqueta="Última semana" valor={estadisticas.notas.ultima_semana} total={estadisticas.notas.total} color="verde" />
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
