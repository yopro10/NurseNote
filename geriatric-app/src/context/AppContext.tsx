import React, { createContext, useCallback, useContext, useEffect, useMemo, useReducer } from 'react';
import type {
  Usuario,
  NotaEnfermeria,
  HogarInfo,
  Metricas,
  VistaApp,
  TipoNota,
} from '../types';
import type { PacienteConCalculos } from '../utils/patientHelpers';
import * as authService from '../services/authService';
import * as pacienteService from '../services/pacienteService';
import * as hogarService from '../services/hogarService';

/**
 * ============================================================================
 * CONTEXT + REDUCER (Capa Controller)
 * Orquesta las llamadas a los servicios (Model) y expone el estado
 * resultante a las vistas (View) a través del hook useApp().
 * ============================================================================
 */

interface AppState {
  cargandoSesion: boolean;
  usuarioActual: Usuario | null;
  hogarActual: HogarInfo | null;
  metricas: Metricas | null;

  vista: VistaApp;
  moduloSeleccionado: TipoNota | null;
  pacienteSeleccionado: PacienteConCalculos | null;

  pacientes: PacienteConCalculos[];
  notasPacienteActual: NotaEnfermeria[];

  cargando: boolean;
  error: string | null;
}

type AppAction =
  | { type: 'SESION_RESTAURADA'; usuario: Usuario | null }
  | { type: 'LOGIN_EXITOSO'; usuario: Usuario }
  | { type: 'LOGOUT' }
  | { type: 'SET_HOGAR'; hogar: HogarInfo | null; metricas: Metricas | null }
  | { type: 'IR_A_DASHBOARD' }
  | { type: 'IR_A_NOTAS_ENFERMERIA' }
  | { type: 'IR_A_SIGNOS_VITALES' }
  | { type: 'IR_A_MEDICAMENTOS' }
  | { type: 'IR_A_GESTION_PACIENTES' }
  | { type: 'IR_A_ESTADISTICAS' }
  | { type: 'IR_A_INVENTARIO_MEDICAMENTOS' }
  | { type: 'IR_A_USUARIOS' }
  | { type: 'IR_A_REGISTRO'; paciente: PacienteConCalculos }
  | { type: 'SET_PACIENTES'; pacientes: PacienteConCalculos[] }
  | { type: 'SET_NOTAS_PACIENTE'; notas: NotaEnfermeria[] }
  | { type: 'NOTA_CREADA'; nota: NotaEnfermeria }
  | { type: 'SET_CARGANDO'; cargando: boolean }
  | { type: 'SET_ERROR'; error: string | null };

const estadoInicial: AppState = {
  cargandoSesion: true,
  usuarioActual: null,
  hogarActual: null,
  metricas: null,
  vista: 'login',
  moduloSeleccionado: null,
  pacienteSeleccionado: null,
  pacientes: [],
  notasPacienteActual: [],
  cargando: false,
  error: null,
};

function reducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SESION_RESTAURADA':
      return { ...state, cargandoSesion: false, usuarioActual: action.usuario, vista: action.usuario ? 'dashboard' : 'login' };
    case 'LOGIN_EXITOSO':
      return { ...state, usuarioActual: action.usuario, vista: 'dashboard', error: null };
    case 'LOGOUT':
      return { ...estadoInicial, cargandoSesion: false };
    case 'SET_HOGAR':
      return { ...state, hogarActual: action.hogar, metricas: action.metricas };
    case 'IR_A_DASHBOARD':
      return { ...state, vista: 'dashboard', moduloSeleccionado: null, pacienteSeleccionado: null };
    case 'IR_A_NOTAS_ENFERMERIA':
      return { ...state, vista: 'notas_enfermeria', moduloSeleccionado: 'evolucion', pacienteSeleccionado: null };
    case 'IR_A_SIGNOS_VITALES':
      return { ...state, vista: 'signos_vitales', moduloSeleccionado: 'signos_vitales', pacienteSeleccionado: null };
    case 'IR_A_MEDICAMENTOS':
      return { ...state, vista: 'medicamentos', moduloSeleccionado: 'medicacion', pacienteSeleccionado: null };
    case 'IR_A_GESTION_PACIENTES':
      return { ...state, vista: 'gestion_pacientes', moduloSeleccionado: null, pacienteSeleccionado: null };
    case 'IR_A_ESTADISTICAS':
      return { ...state, vista: 'estadisticas', moduloSeleccionado: null, pacienteSeleccionado: null };
    case 'IR_A_INVENTARIO_MEDICAMENTOS':
      return { ...state, vista: 'inventario_medicamentos', moduloSeleccionado: null, pacienteSeleccionado: null };
    case 'IR_A_USUARIOS':
      return { ...state, vista: 'usuarios', moduloSeleccionado: null, pacienteSeleccionado: null };
    case 'IR_A_REGISTRO':
      return { ...state, vista: 'registro', pacienteSeleccionado: action.paciente };
    case 'SET_PACIENTES':
      return { ...state, pacientes: action.pacientes };
    case 'SET_NOTAS_PACIENTE':
      return { ...state, notasPacienteActual: action.notas };
    case 'NOTA_CREADA':
      return { ...state, notasPacienteActual: [action.nota, ...state.notasPacienteActual] };
    case 'SET_CARGANDO':
      return { ...state, cargando: action.cargando };
    case 'SET_ERROR':
      return { ...state, error: action.error };
    default:
      return state;
  }
}

interface AppContextValue extends AppState {
  iniciarSesion: (email: string, password: string) => Promise<void>;
  cerrarSesion: () => Promise<void>;
  irADashboard: () => void;
  irANotasEnfermeria: () => void;
  irASignosVitales: () => void;
  irAMedicamentos: () => void;
  irAGestionPacientes: () => void;
  irAEstadisticas: () => void;
  irAInventarioMedicamentos: () => void;
  irAUsuarios: () => void;
  seleccionarModulo: (modulo: TipoNota) => void;
  seleccionarPaciente: (paciente: PacienteConCalculos) => Promise<void>;
  buscarPacientes: (query: string) => Promise<void>;
  guardarNota: (datos: Omit<NotaEnfermeria, 'id' | 'fecha_registro' | 'usuario_id'>) => Promise<void>;
  limpiarError: () => void;
}

const AppContext = createContext<AppContextValue | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, estadoInicial);

  // Restaura la sesión activa al cargar la aplicación (JWT persistido)
  useEffect(() => {
    authService.getSesionActiva().then((usuario) => {
      dispatch({ type: 'SESION_RESTAURADA', usuario });
    });
  }, []);

  // Carga el hogar y sus métricas cada vez que hay un usuario autenticado
  useEffect(() => {
    if (!state.usuarioActual) return;
    let cancelado = false;

    Promise.all([
      hogarService.getHogarPorId('hogar-01'),
      hogarService.getMetricasHogar('hogar-01'),
    ]).then(([hogar, metricas]) => {
      if (!cancelado) dispatch({ type: 'SET_HOGAR', hogar: hogar ?? null, metricas });
    });

    pacienteService.getPacientes().then((pacientes) => {
      if (!cancelado) dispatch({ type: 'SET_PACIENTES', pacientes });
    });

    return () => {
      cancelado = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.usuarioActual?.id]);

  const iniciarSesion = useCallback(async (email: string, password: string) => {
    dispatch({ type: 'SET_CARGANDO', cargando: true });
    dispatch({ type: 'SET_ERROR', error: null });
    try {
      const response = await authService.login({ email, password });
      authService.saveAuthData(response.token, response.user);
      dispatch({ type: 'LOGIN_EXITOSO', usuario: response.user });
    } catch (err) {
      dispatch({ type: 'SET_ERROR', error: err instanceof Error ? err.message : 'Error desconocido.' });
    } finally {
      dispatch({ type: 'SET_CARGANDO', cargando: false });
    }
  }, []);

  const cerrarSesion = useCallback(async () => {
    await authService.logout();
    dispatch({ type: 'LOGOUT' });
  }, []);

  const irADashboard = useCallback(() => dispatch({ type: 'IR_A_DASHBOARD' }), []);

  const irANotasEnfermeria = useCallback(() => dispatch({ type: 'IR_A_NOTAS_ENFERMERIA' }), []);
  const irASignosVitales = useCallback(() => dispatch({ type: 'IR_A_SIGNOS_VITALES' }), []);
  const irAMedicamentos = useCallback(() => dispatch({ type: 'IR_A_MEDICAMENTOS' }), []);
  const irAGestionPacientes = useCallback(() => dispatch({ type: 'IR_A_GESTION_PACIENTES' }), []);
  const irAEstadisticas = useCallback(() => dispatch({ type: 'IR_A_ESTADISTICAS' }), []);
  const irAInventarioMedicamentos = useCallback(() => dispatch({ type: 'IR_A_INVENTARIO_MEDICAMENTOS' }), []);
  const irAUsuarios = useCallback(() => dispatch({ type: 'IR_A_USUARIOS' }), []);

  const seleccionarModulo = useCallback((modulo: TipoNota) => {
    switch (modulo) {
      case 'evolucion':
      case 'ingreso':
      case 'egreso':
      case 'observacion':
        dispatch({ type: 'IR_A_NOTAS_ENFERMERIA' });
        break;
      case 'signos_vitales':
        dispatch({ type: 'IR_A_SIGNOS_VITALES' });
        break;
      case 'medicacion':
        dispatch({ type: 'IR_A_MEDICAMENTOS' });
        break;
      default:
        dispatch({ type: 'IR_A_NOTAS_ENFERMERIA' });
    }
  }, []);

  const seleccionarPaciente = useCallback(async (paciente: PacienteConCalculos) => {
    dispatch({ type: 'IR_A_REGISTRO', paciente });
    dispatch({ type: 'SET_CARGANDO', cargando: true });
    const notas = await pacienteService.getNotasPorPaciente(paciente.id);
    dispatch({ type: 'SET_NOTAS_PACIENTE', notas });
    dispatch({ type: 'SET_CARGANDO', cargando: false });
  }, []);

  const buscarPacientes = useCallback(async (query: string) => {
    const pacientes = await pacienteService.buscarPacientes(query);
    dispatch({ type: 'SET_PACIENTES', pacientes });
  }, []);

  const guardarNota = useCallback(
    async (datos: Omit<NotaEnfermeria, 'id' | 'fecha_registro' | 'usuario_id'>) => {
      if (!state.usuarioActual) return;
      dispatch({ type: 'SET_CARGANDO', cargando: true });
      const nota = await pacienteService.crearNota(datos);
      dispatch({ type: 'NOTA_CREADA', nota });
      const metricas = await hogarService.getMetricasHogar('hogar-01');
      dispatch({ type: 'SET_HOGAR', hogar: state.hogarActual, metricas });
      dispatch({ type: 'SET_CARGANDO', cargando: false });
    },
    [state.usuarioActual, state.hogarActual]
  );

  const limpiarError = useCallback(() => dispatch({ type: 'SET_ERROR', error: null }), []);

  const value = useMemo<AppContextValue>(
    () => ({
      ...state,
      iniciarSesion,
      cerrarSesion,
      irADashboard,
      irANotasEnfermeria,
      irASignosVitales,
      irAMedicamentos,
      irAGestionPacientes,
      irAEstadisticas,
      irAInventarioMedicamentos,
      irAUsuarios,
      seleccionarModulo,
      seleccionarPaciente,
      buscarPacientes,
      guardarNota,
      limpiarError,
    }),
    [state, iniciarSesion, cerrarSesion, irADashboard, irANotasEnfermeria, irASignosVitales, irAMedicamentos, irAGestionPacientes, irAEstadisticas, irAInventarioMedicamentos, irAUsuarios, seleccionarModulo, seleccionarPaciente, buscarPacientes, guardarNota, limpiarError]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppContextValue {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp debe usarse dentro de un <AppProvider>.');
  return context;
}
