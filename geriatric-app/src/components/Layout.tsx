import { useEffect, useState, type ReactElement } from 'react';
import { api } from '../api/client';
import { useAccesibilidad, type Tamano } from '../context/AccesibilidadContext';
import { useApp } from '../context/AppContext';
import { useToast } from '../context/ToastContext';
import type { Notificacion, VistaApp } from '../types';
import { fmtFecha, hace, nombreCompleto, ROLES, iniciales } from '../utils/format';
import { mensajeError } from '../utils/format';
import BusquedaGlobal from './BusquedaGlobal';
import { IconoBuscar, IconoCampana, IconoEstadisticas, IconoInventario, IconoMedicamentos, IconoMenu, IconoNotas, IconoPacientes, IconoPanel, IconoSalir, IconoTurno, IconoUsuarios, IconoVitales, MarcaSIG } from './Icons';

interface Item { id: VistaApp; etiqueta: string; icono: ReactElement; ic: string; ics: string; roles?: string[] }
const GRUPOS: Array<{ titulo?: string; items: Item[] }> = [
  { items: [{ id: 'dashboard', etiqueta: 'Panel principal', icono: <IconoPanel size={16} />, ic: '#0f7a5c', ics: '#dff4ea' }] },
  { titulo: 'Registro clínico', items: [
    { id: 'notas', etiqueta: 'Notas de enfermería', icono: <IconoNotas size={16} />, ic: '#0f7a5c', ics: '#dff4ea' },
    { id: 'signos', etiqueta: 'Signos vitales', icono: <IconoVitales size={16} />, ic: '#d4465c', ics: '#fde4e8' },
    { id: 'medicamentos', etiqueta: 'Medicación', icono: <IconoMedicamentos size={16} />, ic: '#6d4fd0', ics: '#ece6fb' },
    { id: 'turnos', etiqueta: 'Entrega de turno', icono: <IconoTurno size={16} />, ic: '#b5563a', ics: '#fbe5dc' },
  ] },
  { titulo: 'Gestión del hogar', items: [
    { id: 'residentes', etiqueta: 'Residentes', icono: <IconoPacientes size={16} />, ic: '#1f78b4', ics: '#dcedf8' },
    { id: 'inventario', etiqueta: 'Inventario', icono: <IconoInventario size={16} />, ic: '#c27a0a', ics: '#fdecc8' },
    { id: 'estadisticas', etiqueta: 'Estadísticas', icono: <IconoEstadisticas size={16} />, ic: '#0e8f86', ics: '#d6f2ef' },
  ] },
  { titulo: 'Administración', items: [{ id: 'usuarios', etiqueta: 'Usuarios', icono: <IconoUsuarios size={16} />, ic: '#4b5d6b', ics: '#e3e9ee', roles: ['administrador', 'jefe_enfermeria'] }] },
];

const TITULOS: Record<VistaApp, string> = {
  dashboard: 'Panel principal', notas: 'Notas de enfermería', signos: 'Signos vitales', medicamentos: 'Medicación', residentes: 'Residentes', ficha: 'Ficha del residente',
  inventario: 'Inventario de medicamentos', estadisticas: 'Estadísticas', turnos: 'Entrega de turno', usuarios: 'Usuarios',
};

export function Sidebar({ abierto, onCerrar, sinLeer }: { abierto: boolean; onCerrar: () => void; sinLeer: number }) {
  const { destino, usuario, ir, cerrarSesion } = useApp();
  const activa: VistaApp = destino.vista === 'ficha' ? 'residentes' : destino.vista;
  if (!usuario) return null;
  return (
    <aside className={`sidebar ${abierto ? 'sidebar--abierto' : ''}`}>
      <div className="sidebar__marca"><MarcaSIG size={32} /><div><strong>NurseNote</strong><small>SIG Geriátrico</small></div></div>
      <nav aria-label="Navegación principal">
        {GRUPOS.filter((g) => g.items.some((i) => !i.roles || i.roles.includes(usuario.rol))).map((g, n) => (
          <div className="sidebar__grupo" key={g.titulo ?? n}>
            {g.titulo && <span className="sidebar__titulo">{g.titulo}</span>}
            {g.items.filter((i) => !i.roles || i.roles.includes(usuario.rol)).map((i) => (
              <button key={i.id} type="button" className={`nav ${activa === i.id ? 'nav--activo' : ''}`} aria-current={activa === i.id ? 'page' : undefined}
                style={{ ['--ic' as string]: i.ic, ['--ic-s' as string]: i.ics }} onClick={() => { ir(i.id); onCerrar(); }}>
                <span className="nav__ic">{i.icono}</span>{i.etiqueta}
                {i.id === 'turnos' && sinLeer > 0 && false}
              </button>
            ))}
          </div>
        ))}
      </nav>
      <div className="sidebar__pie">
        <span className="avatar avatar--sm">{iniciales(usuario.nombre, usuario.apellido)}</span>
        <div><strong>{usuario.nombre}</strong><small>{ROLES[usuario.rol]}</small></div>
        <button className="btn btn--g btn--ic" onClick={cerrarSesion} title="Cerrar sesión" aria-label="Cerrar sesión"><IconoSalir size={16} /></button>
      </div>
    </aside>
  );
}

/* ---------- Campana de notificaciones ---------- */
function Campana({ onNoLeidas }: { onNoLeidas: (n: number) => void }) {
  const { ir, tick } = useApp();
  const toast = useToast();
  const [abierta, setAbierta] = useState(false);
  const [items, setItems] = useState<Notificacion[]>([]);
  const [sinLeer, setSinLeer] = useState(0);
  const [cargando, setCargando] = useState(false);

  const cargar = async () => {
    try {
      setCargando(true);
      const r = await api.get<{ items: Notificacion[]; sinLeer: number }>('/notificaciones');
      setItems(r.items); setSinLeer(r.sinLeer); onNoLeidas(r.sinLeer);
    } catch { /* sin conexión: se conserva lo último */ } finally { setCargando(false); }
  };
  useEffect(() => { cargar(); const t = setInterval(cargar, 60000); return () => clearInterval(t); /* eslint-disable-next-line */ }, [tick]);

  const marcar = async (body: object) => { try { await api.post('/notificaciones/leer', body); await cargar(); } catch (e) { toast(mensajeError(e), 'error'); } };
  const abrir = (n: Notificacion) => {
    if (!n.leida) marcar({ claves: [n.clave] });
    setAbierta(false);
    const r = n.ruta;
    ir(r.vista as VistaApp, { pacienteId: r.pacienteId, tab: r.tab, id: r.id });
  };

  return (
    <div className="bell">
      <button className="btn btn--g btn--ic" aria-label={`Notificaciones${sinLeer ? `, ${sinLeer} sin leer` : ''}`} aria-expanded={abierta} onClick={() => { setAbierta((v) => !v); if (!abierta) cargar(); }}>
        <IconoCampana size={19} />{sinLeer > 0 && <span className="bell__n">{sinLeer > 99 ? '99+' : sinLeer}</span>}
      </button>
      {abierta && <>
        <div className="cobertura" onClick={() => setAbierta(false)} />
        <div className="popover" role="dialog" aria-label="Notificaciones">
          <div className="bell__cab"><strong>Alertas y notificaciones</strong>
            <button className="btn btn--sm btn--g" disabled={!sinLeer} onClick={() => marcar({ todas: true })}>Marcar todas como leídas</button></div>
          <div className="bell__lista">
            {cargando && !items.length && <div className="estado"><div className="spinner" /></div>}
            {!cargando && !items.length && <div className="estado"><b>✅</b><p>Todo en orden: no hay alertas.</p></div>}
            {items.map((n) => (
              <button key={n.clave} className={`noti ${n.leida ? '' : 'noti--no'}`} onClick={() => abrir(n)}>
                <span className={`noti__p s-${n.severidad}`} />
                <span><strong>{n.titulo}</strong><small>{n.detalle}</small>{n.fecha && <small>{hace(n.fecha)}</small>}</span>
              </button>
            ))}
          </div>
        </div>
      </>}
    </div>
  );
}

export function Header({ onMenu, onNoLeidas }: { onMenu: () => void; onNoLeidas: (n: number) => void }) {
  const { usuario, destino, cerrarSesion } = useApp();
  const { tamanoLetra, cambiarTamanoLetra } = useAccesibilidad();
  const [perfil, setPerfil] = useState(false);
  const [buscar, setBuscar] = useState(false);

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); setBuscar(true); } };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, []);
  if (!usuario) return null;

  return (
    <header className="header">
      <button className="btn btn--g btn--ic menu-movil" onClick={onMenu} aria-label="Abrir menú"><IconoMenu size={20} /></button>
      <div className="header__t"><h1>{TITULOS[destino.vista]}</h1><small>{new Date().toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</small></div>
      <div className="header__der">
        <button className="btn btn--g btn--ic" onClick={() => setBuscar(true)} title="Búsqueda global (Ctrl+K)" aria-label="Búsqueda global"><IconoBuscar size={18} /></button>
        <select className="select" style={{ width: 'auto', padding: '3px 6px' }} value={tamanoLetra} aria-label="Tamaño de letra" onChange={(e) => cambiarTamanoLetra(e.target.value as Tamano)}>
          <option value="normal">A</option><option value="grande">A+</option><option value="muy-grande">A++</option>
        </select>
        <Campana onNoLeidas={onNoLeidas} />
        <div className="perfil">
          <button className="perfil__btn" aria-expanded={perfil} onClick={() => setPerfil((v) => !v)}>
            <span className="avatar avatar--sm">{iniciales(usuario.nombre, usuario.apellido)}</span>
            <span><strong>{nombreCompleto(usuario)}</strong><small>{ROLES[usuario.rol]}</small></span>
          </button>
          {perfil && <>
            <div className="cobertura" onClick={() => setPerfil(false)} />
            <div className="popover" role="menu">
              <div><strong>{nombreCompleto(usuario)}</strong><br /><small>{usuario.email}</small></div>
              <dl className="dl" style={{ gridTemplateColumns: '90px 1fr' }}><dt>Rol</dt><dd>{ROLES[usuario.rol]}</dd><dt>Miembro desde</dt><dd>{fmtFecha(usuario.fecha_creacion)}</dd></dl>
              <button className="btn btn--bloque" onClick={cerrarSesion}>Cerrar sesión</button>
            </div>
          </>}
        </div>
      </div>
      {buscar && <BusquedaGlobal onClose={() => setBuscar(false)} />}
    </header>
  );
}
