import { useApp } from '../context/AppContext';
import type { VistaApp } from '../types';
import {
  IconoPanel,
  IconoNotas,
  IconoVitales,
  IconoMedicamentos,
  IconoPacientes,
  IconoEstadisticas,
  IconoInventario,
  IconoSalir,
  MarcaSIG,
  IconoAlerta,
} from './Icons';

type IdMenu =
  | 'dashboard'
  | 'notas'
  | 'signos'
  | 'medicamentos'
  | 'pacientes'
  | 'estadisticas'
  | 'inventario'
  | 'usuarios';

interface ItemMenu {
  id: IdMenu;
  etiqueta: string;
  icono: JSX.Element;
}

interface GrupoMenu {
  titulo?: string;
  items: ItemMenu[];
  roles?: string[]; // Si se especifica, solo mostrar a estos roles
}

const GRUPOS: GrupoMenu[] = [
  {
    items: [{ id: 'dashboard', etiqueta: 'Panel principal', icono: <IconoPanel /> }],
  },
  {
    titulo: 'Registro clínico',
    items: [
      { id: 'notas', etiqueta: 'Notas de enfermería', icono: <IconoNotas /> },
      { id: 'signos', etiqueta: 'Signos vitales', icono: <IconoVitales /> },
      { id: 'medicamentos', etiqueta: 'Medicamentos', icono: <IconoMedicamentos /> },
    ],
  },
  {
    titulo: 'Gestión del hogar',
    items: [
      { id: 'pacientes', etiqueta: 'Residentes', icono: <IconoPacientes /> },
      { id: 'inventario', etiqueta: 'Inventario', icono: <IconoInventario /> },
      { id: 'estadisticas', etiqueta: 'Estadísticas', icono: <IconoEstadisticas /> },
    ],
  },
  {
    titulo: 'Administración',
    items: [
      { id: 'usuarios', etiqueta: 'Usuarios', icono: <IconoAlerta /> },
    ],
    roles: ['administrador', 'jefe_enfermeria'], // Solo visible para admin y jefe
  },
];

const VISTAS_ACTIVAS: Record<IdMenu, VistaApp[]> = {
  dashboard: ['dashboard'],
  notas: ['notas_enfermeria', 'registro'],
  signos: ['signos_vitales'],
  medicamentos: ['medicamentos'],
  pacientes: ['gestion_pacientes'],
  inventario: ['inventario_medicamentos'],
  estadisticas: ['estadisticas'],
  usuarios: ['usuarios'],
};

const ROLES: Record<string, string> = {
  administrador: 'Administrador',
  enfermera: 'Enfermera',
  jefe_enfermeria: 'Jefe de enfermería',
};

export default function Sidebar() {
  const {
    vista,
    moduloSeleccionado,
    hogarActual,
    usuarioActual,
    cerrarSesion,
    irADashboard,
    irANotasEnfermeria,
    irASignosVitales,
    irAMedicamentos,
    irAGestionPacientes,
    irAEstadisticas,
    irAInventarioMedicamentos,
    irAUsuarios,
  } = useApp();

  const navegar: Record<IdMenu, () => void> = {
    dashboard: irADashboard,
    notas: irANotasEnfermeria,
    signos: irASignosVitales,
    medicamentos: irAMedicamentos,
    pacientes: irAGestionPacientes,
    inventario: irAInventarioMedicamentos,
    estadisticas: irAEstadisticas,
    usuarios: irAUsuarios,
  };

  const iniciales = usuarioActual
    ? `${usuarioActual.nombre[0]}${usuarioActual.apellido?.[0] ?? ''}`.toUpperCase()
    : '';

  return (
    <aside className="sidebar">
      <div className="sidebar__marca">
        <MarcaSIG size={42} />
        <div className="sidebar__marca-texto">
          <span className="sidebar__marca-titulo">SIG Geriátrico</span>
          <span className="sidebar__marca-subtitulo">{hogarActual?.nombre ?? 'Cargando hogar…'}</span>
        </div>
      </div>

      <nav className="sidebar__nav" aria-label="Navegación principal">
        {GRUPOS.filter(grupo => !grupo.roles || grupo.roles.includes(usuarioActual?.rol || '')).map((grupo, i) => (
          <div className="sidebar__grupo" key={grupo.titulo ?? i}>
            {grupo.titulo && <span className="sidebar__grupo-titulo">{grupo.titulo}</span>}
            {grupo.items.map((item) => {
              const idRegistro: IdMenu =
                moduloSeleccionado === 'signos_vitales' ? 'signos' : moduloSeleccionado === 'medicacion' ? 'medicamentos' : 'notas';
              const activo = vista === 'registro' ? item.id === idRegistro : VISTAS_ACTIVAS[item.id].includes(vista);
              return (
                <button
                  key={item.id}
                  type="button"
                  data-seccion={item.id}
                  className={`sidebar__item ${activo ? 'sidebar__item--activo' : ''}`}
                  aria-current={activo ? 'page' : undefined}
                  title={item.etiqueta}
                  onClick={navegar[item.id]}
                >
                  <span className="sidebar__item-icono">{item.icono}</span>
                  <span className="sidebar__item-texto">{item.etiqueta}</span>
                </button>
              );
            })}
          </div>
        ))}
      </nav>

      {usuarioActual && (
        <div className="sidebar__pie">
          <span className="avatar">{iniciales}</span>
          <div className="sidebar__pie-texto">
            <strong>{usuarioActual.nombre}</strong>
            <small>{ROLES[usuarioActual.rol] ?? usuarioActual.rol}</small>
          </div>
          <button type="button" className="sidebar__salir" onClick={cerrarSesion} aria-label="Cerrar sesión" title="Cerrar sesión">
            <IconoSalir />
          </button>
        </div>
      )}
    </aside>
  );
}
