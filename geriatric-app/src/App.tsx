import { AppProvider, useApp } from './context/AppContext';
import { NotificationProvider, useNotifications } from './context/NotificationContext';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import LoginView from './views/LoginView';
import DashboardView from './views/DashboardView';
import PatientListView from './views/PatientListView';
import SignosVitalesView from './views/SignosVitalesView';
import MedicamentosView from './views/MedicamentosView';
import RegisterFormView from './views/RegisterFormView';
import EstadisticasView from './views/EstadisticasView';
import InventarioMedicamentosView from './views/InventarioMedicamentosView';
import UsuariosView from './views/UsuariosView';
import NotificationToast from './components/NotificationToast';

/**
 * Enrutador principal de la SPA.
 * No se usa una librería de enrutamiento externa: el "router" es el
 * estado `vista` del AppContext, que decide qué vista renderizar dentro
 * del layout maestro sin recargar la página.
 */
function EnrutadorPrincipal() {
  const { vista, cargandoSesion, usuarioActual, moduloSeleccionado } = useApp();
  const tema =
    vista === 'registro'
      ? ({ signos_vitales: 'signos', medicacion: 'medicamentos' } as Record<string, string>)[moduloSeleccionado ?? ''] ?? 'notas'
      : ({
          dashboard: 'inicio',
          notas_enfermeria: 'notas',
          signos_vitales: 'signos',
          medicamentos: 'medicamentos',
          gestion_pacientes: 'residentes',
          inventario_medicamentos: 'inventario',
          estadisticas: 'estadisticas',
          usuarios: 'usuarios',
        } as Record<string, string>)[vista] ?? 'inicio';

  if (cargandoSesion) {
    return (
      <div className="pantalla-carga">
        <div className="spinner" />
        <p>Cargando sesión…</p>
      </div>
    );
  }

  if (!usuarioActual) {
    return <LoginView />;
  }

  return (
    <div className="layout-maestro" data-tema={tema}>
      <Sidebar />
      <div className="layout-maestro__contenido">
        <Header />
        <main className="layout-maestro__area-trabajo">
          <div className="area-trabajo__interior">
            {vista === 'dashboard' && <DashboardView />}
            {vista === 'notas_enfermeria' && <PatientListView />}
            {vista === 'signos_vitales' && <SignosVitalesView />}
            {vista === 'medicamentos' && <MedicamentosView />}
            {vista === 'gestion_pacientes' && <PatientListView />}
            {vista === 'estadisticas' && <EstadisticasView />}
            {vista === 'inventario_medicamentos' && <InventarioMedicamentosView />}
            {vista === 'registro' && <RegisterFormView />}
            {vista === 'usuarios' && <UsuariosView />}
          </div>
        </main>
      </div>
    </div>
  );
}

function AppWithNotifications() {
  const { notifications, removeNotification } = useNotifications();

  return (
    <>
      <EnrutadorPrincipal />
      <div className="toasts" aria-live="polite">
        {notifications.map((notification) => (
          <NotificationToast
            key={notification.id}
            message={notification.message}
            type={notification.type}
            onClose={() => removeNotification(notification.id)}
          />
        ))}
      </div>
    </>
  );
}

export default function App() {
  return (
    <AppProvider>
      <NotificationProvider>
        <AppWithNotifications />
      </NotificationProvider>
    </AppProvider>
  );
}
