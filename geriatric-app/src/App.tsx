import { useState } from 'react';
import { useApp } from './context/AppContext';
import { Header, Sidebar } from './components/Layout';
import LoginView from './views/LoginView';
import DashboardView from './views/DashboardView';
import NotasView from './views/NotasView';
import SignosVitalesView from './views/SignosVitalesView';
import MedicamentosView from './views/MedicamentosView';
import ResidentesView from './views/ResidentesView';
import FichaResidenteView from './views/FichaResidenteView';
import InventarioView from './views/InventarioView';
import EstadisticasView from './views/EstadisticasView';
import TurnosView from './views/TurnosView';
import UsuariosView from './views/UsuariosView';

const TEMA: Record<string, string> = { dashboard: 'notas', notas: 'notas', signos: 'signos', medicamentos: 'medicamentos', residentes: 'residentes', ficha: 'residentes', inventario: 'inventario', estadisticas: 'estadisticas', turnos: 'turnos', usuarios: 'usuarios' };

export default function App() {
  const { cargandoSesion, usuario, destino, esGestor } = useApp();
  const [menu, setMenu] = useState(false);
  const [sinLeer, setSinLeer] = useState(0);

  if (cargandoSesion) return <div className="pantalla-carga"><div className="spinner" /><p>Cargando sesión…</p></div>;
  if (!usuario) return <LoginView />;

  const v = destino.vista;
  return (
    <div className="app" data-tema={TEMA[v]}>
      <Sidebar abierto={menu} onCerrar={() => setMenu(false)} sinLeer={sinLeer} />
      <div className="app__main">
        <Header onMenu={() => setMenu((m) => !m)} onNoLeidas={setSinLeer} />
        <main className="app__contenido" onClick={() => menu && setMenu(false)}>
          <div className="app__interior">
            {v === 'dashboard' && <DashboardView />}
            {v === 'notas' && <NotasView />}
            {v === 'signos' && <SignosVitalesView />}
            {v === 'medicamentos' && <MedicamentosView />}
            {v === 'residentes' && <ResidentesView />}
            {v === 'ficha' && <FichaResidenteView />}
            {v === 'inventario' && <InventarioView />}
            {v === 'estadisticas' && <EstadisticasView />}
            {v === 'turnos' && <TurnosView />}
            {v === 'usuarios' && (esGestor ? <UsuariosView /> : <div className="alerta alerta--error">No tienes permiso para ver esta sección.</div>)}
          </div>
        </main>
      </div>
    </div>
  );
}
