import { useApp } from '../context/AppContext';
import type { ModuloAcceso } from '../types';
import {
  IconoAlerta,
  IconoFlecha,
  IconoMedicamentos,
  IconoNotas,
  IconoPacientes,
  IconoVitales,
  TrazoECG,
} from '../components/Icons';

const ICONOS: Record<ModuloAcceso['icono'], JSX.Element> = {
  notas: <IconoNotas size={28} />,
  vitales: <IconoVitales size={28} />,
  medicamentos: <IconoMedicamentos size={28} />,
  pacientes: <IconoPacientes size={28} />,
};

const ACENTO_MODULO: Record<ModuloAcceso['icono'], string> = {
  notas: 'm-notas',
  vitales: 'm-signos',
  medicamentos: 'm-meds',
  pacientes: 'm-res',
};

const MODULOS: ModuloAcceso[] = [
  {
    id: 'evolucion',
    titulo: 'Notas de enfermería',
    descripcion: 'Registra observaciones clínicas y la evolución diaria de cada residente.',
    icono: 'notas',
  },
  {
    id: 'signos_vitales',
    titulo: 'Signos vitales',
    descripcion: 'Presión arterial, frecuencia cardíaca, temperatura y saturación de oxígeno.',
    icono: 'vitales',
  },
  {
    id: 'medicacion',
    titulo: 'Medicamentos',
    descripcion: 'Documenta la entrega y dosificación de medicamentos por residente.',
    icono: 'medicamentos',
  },
  {
    id: 'pacientes',
    titulo: 'Residentes',
    descripcion: 'Consulta la lista completa de residentes y su información básica.',
    icono: 'pacientes',
  },
];

function saludo(): string {
  const hora = new Date().getHours();
  if (hora < 12) return 'Buenos días';
  if (hora < 19) return 'Buenas tardes';
  return 'Buenas noches';
}

export default function DashboardView() {
  const { pacientes, seleccionarPaciente, irAInventarioMedicamentos, usuarioActual, hogarActual, metricas, irANotasEnfermeria, irASignosVitales, irAMedicamentos, irAGestionPacientes } = useApp();

  const nombreUsuario = usuarioActual?.nombre || 'equipo';

  const handleModuloClick = (moduloId: string) => {
    switch (moduloId) {
      case 'evolucion':
        irANotasEnfermeria();
        break;
      case 'signos_vitales':
        irASignosVitales();
        break;
      case 'medicacion':
        irAMedicamentos();
        break;
      case 'pacientes':
        irAGestionPacientes();
        break;
    }
  };

  const criticos = metricas?.pacientesCriticos ?? 0;
  const prioritarios = pacientes
    .filter((p) => p.estado !== 'Estable')
    .sort((a, b) => (a.estado === 'Crítico' ? -1 : 1) - (b.estado === 'Crítico' ? -1 : 1))
    .slice(0, 4);
  const alertasInv = (metricas?.medicamentosVencidos ?? 0) + (metricas?.medicamentosBajoStock ?? 0);

  return (
    <div className="dashboard">
      <section className="bienvenida">
        <TrazoECG className="bienvenida__ecg" />
        <div className="bienvenida__texto">
          <h2>
            {saludo()}, {nombreUsuario}
          </h2>
          <p>
            Este es el resumen de {hogarActual?.nombre ?? 'tu hogar geriátrico'} para hoy. Elige un módulo para
            empezar a registrar.
          </p>
        </div>

        {metricas && (
          <div className={`bienvenida__aviso ${criticos === 0 ? 'bienvenida__aviso--ok' : ''}`} role="status">
            <span className="bienvenida__aviso-numero">{criticos}</span>
            <span>
              {criticos === 0
                ? 'Ningún residente en estado crítico'
                : criticos === 1
                  ? 'residente en estado crítico necesita seguimiento'
                  : 'residentes en estado crítico necesitan seguimiento'}
            </span>
          </div>
        )}
      </section>

      {metricas && (
        <section className="resumen" aria-label="Resumen del hogar">
          <div className="tarjeta-resumen">
            <span className="tarjeta-resumen__icono">
              <IconoPacientes size={26} />
            </span>
            <div>
              <span className="tarjeta-resumen__valor">{metricas.totalPacientes}</span>
              <span className="tarjeta-resumen__etiqueta">Residentes activos</span>
            </div>
          </div>
          <div className="tarjeta-resumen tarjeta-resumen--observacion">
            <span className="tarjeta-resumen__icono">
              <IconoAlerta size={26} />
            </span>
            <div>
              <span className="tarjeta-resumen__valor">{metricas.pacientesEnObservacion}</span>
              <span className="tarjeta-resumen__etiqueta">En observación</span>
            </div>
          </div>
          <div className="tarjeta-resumen tarjeta-resumen--critico">
            <span className="tarjeta-resumen__icono">
              <IconoVitales size={26} />
            </span>
            <div>
              <span className="tarjeta-resumen__valor">{metricas.pacientesCriticos}</span>
              <span className="tarjeta-resumen__etiqueta">Estado crítico</span>
            </div>
          </div>
          <div className="tarjeta-resumen tarjeta-resumen--estable">
            <span className="tarjeta-resumen__icono">
              <IconoNotas size={26} />
            </span>
            <div>
              <span className="tarjeta-resumen__valor">{metricas.registrosHoy}</span>
              <span className="tarjeta-resumen__etiqueta">Registros hoy</span>
            </div>
          </div>
        </section>
      )}

      <section className="dashboard__dos">
        <div className="atencion">
          <div className="seccion-titulo">
            <h3>Requieren atención hoy</h3>
            <p>{prioritarios.length} residentes</p>
          </div>
          {prioritarios.length === 0 && <p className="atencion__vacio">Todo en calma: ningún residente en observación.</p>}
          {prioritarios.map((p) => (
            <button key={p.id} type="button" className={`atencion__fila atencion__fila--${p.estado === 'Crítico' ? 'crit' : 'obs'}`} onClick={() => seleccionarPaciente(p)}>
              <span className={`avatar avatar--tono-${p.id % 6}`}>{p.avatarIniciales}</span>
              <span className="atencion__datos">
                <strong>{p.nombreCompleto}</strong>
                <small>Hab. {p.habitacion} · {p.diagnosticoPrincipal}</small>
              </span>
              <span className={p.estado === 'Crítico' ? 'badge badge--rojo' : 'badge badge--ambar'}>{p.estado}</span>
              <IconoFlecha size={18} />
            </button>
          ))}
        </div>
        <button type="button" className={`aviso-inventario ${alertasInv === 0 ? 'aviso-inventario--ok' : ''}`} onClick={irAInventarioMedicamentos}>
          <span className="aviso-inventario__icono"><IconoMedicamentos size={26} /></span>
          <strong>{alertasInv === 0 ? 'Inventario al día' : `${alertasInv} ${alertasInv === 1 ? 'alerta' : 'alertas'} de inventario`}</strong>
          <small>{metricas?.medicamentosVencidos ?? 0} {metricas?.medicamentosVencidos === 1 ? 'vencido' : 'vencidos'} · {metricas?.medicamentosBajoStock ?? 0} con stock bajo</small>
          <span className="aviso-inventario__ir">Revisar inventario <IconoFlecha size={16} /></span>
        </button>
      </section>

      <section>
        <div className="seccion-titulo">
          <h3>Módulos de registro</h3>
          <p>Elige por dónde empezar el turno</p>
        </div>
        <div className="dashboard__grid-tarjetas">
          {MODULOS.map((modulo) => (
            <button
              key={modulo.id}
              type="button"
              className={`tarjeta-modulo ${ACENTO_MODULO[modulo.icono]}`}
              onClick={() => handleModuloClick(modulo.id)}
            >
              <span className="tarjeta-modulo__icono">{ICONOS[modulo.icono]}</span>
              <span className="tarjeta-modulo__titulo">{modulo.titulo}</span>
              <span className="tarjeta-modulo__descripcion">{modulo.descripcion}</span>
              <span className="tarjeta-modulo__accion">
                Abrir
                <IconoFlecha size={18} />
              </span>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
