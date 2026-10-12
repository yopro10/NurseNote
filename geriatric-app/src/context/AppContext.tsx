import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { api } from '../api/client';
import type { Paciente, Usuario, VistaApp } from '../types';

/** Destino de navegación: la "ruta" de la SPA (sin librería externa). */
export interface Destino { vista: VistaApp; pacienteId?: number; tab?: string; id?: number }

interface Ctx {
  cargandoSesion: boolean;
  usuario: Usuario | null;
  destino: Destino;
  pacientes: Paciente[];
  tick: number; // se incrementa tras mutaciones para que las vistas recarguen
  iniciarSesion: (email: string, password: string) => Promise<void>;
  cerrarSesion: () => Promise<void>;
  ir: (vista: VistaApp, extra?: Omit<Destino, 'vista'>) => void;
  recargarPacientes: () => Promise<void>;
  refrescar: () => void;
  esGestor: boolean;
  esAdmin: boolean;
}

const AppCtx = createContext<Ctx | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [cargandoSesion, setCargandoSesion] = useState(true);
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [destino, setDestino] = useState<Destino>({ vista: 'dashboard' });
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [tick, setTick] = useState(0);

  const limpiarSesion = useCallback(() => {
    localStorage.removeItem('auth_token');
    setUsuario(null);
    setPacientes([]);
    setDestino({ vista: 'dashboard' });
  }, []);

  useEffect(() => {
    if (!localStorage.getItem('auth_token')) { setCargandoSesion(false); return; }
    api.get<Usuario>('/auth/profile').then(setUsuario).catch(() => localStorage.removeItem('auth_token')).finally(() => setCargandoSesion(false));
  }, []);

  useEffect(() => {
    const alExpirar = () => limpiarSesion();
    window.addEventListener('auth:expirada', alExpirar);
    return () => window.removeEventListener('auth:expirada', alExpirar);
  }, [limpiarSesion]);

  const recargarPacientes = useCallback(async () => {
    try { setPacientes(await api.get<Paciente[]>('/pacientes')); } catch { /* el error se muestra en cada vista */ }
  }, []);

  useEffect(() => { if (usuario) recargarPacientes(); }, [usuario, recargarPacientes, tick]);

  const iniciarSesion = useCallback(async (email: string, password: string) => {
    const r = await api.post<{ token: string; user: Usuario }>('/auth/login', { email, password });
    localStorage.setItem('auth_token', r.token);
    setUsuario(r.user);
    setDestino({ vista: 'dashboard' });
  }, []);

  const cerrarSesion = useCallback(async () => {
    try { await api.post('/auth/logout'); } catch { /* aunque falle, se cierra localmente */ }
    limpiarSesion();
  }, [limpiarSesion]);

  const ir = useCallback((vista: VistaApp, extra: Omit<Destino, 'vista'> = {}) => {
    setDestino({ vista, ...extra });
    document.querySelector('.app__contenido')?.scrollTo({ top: 0 });
  }, []);

  const refrescar = useCallback(() => setTick((t) => t + 1), []);

  const valor = useMemo<Ctx>(() => ({
    cargandoSesion, usuario, destino, pacientes, tick, iniciarSesion, cerrarSesion, ir, recargarPacientes, refrescar,
    esGestor: usuario?.rol === 'administrador' || usuario?.rol === 'jefe_enfermeria', esAdmin: usuario?.rol === 'administrador',
  }), [cargandoSesion, usuario, destino, pacientes, tick, iniciarSesion, cerrarSesion, ir, recargarPacientes, refrescar]);

  return <AppCtx.Provider value={valor}>{children}</AppCtx.Provider>;
}

export function useApp(): Ctx {
  const c = useContext(AppCtx);
  if (!c) throw new Error('useApp debe usarse dentro de <AppProvider>');
  return c;
}
