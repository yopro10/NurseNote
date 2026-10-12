import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { IconoCheck, IconoError, IconoAlerta, IconoInfo, IconoCerrar } from '../components/Icons';

type Tipo = 'success' | 'error' | 'warning' | 'info';
interface Toast { id: number; mensaje: string; tipo: Tipo }
interface Ctx { toast: (mensaje: string, tipo?: Tipo) => void }

const ToastCtx = createContext<Ctx | undefined>(undefined);
let contador = 0;
const ICONOS = { success: <IconoCheck size={18} />, error: <IconoError size={18} />, warning: <IconoAlerta size={18} />, info: <IconoInfo size={18} /> };

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<Toast[]>([]);
  const quitar = useCallback((id: number) => setItems((p) => p.filter((t) => t.id !== id)), []);
  const toast = useCallback((mensaje: string, tipo: Tipo = 'info') => {
    const id = ++contador;
    setItems((p) => [...p.slice(-3), { id, mensaje, tipo }]);
    setTimeout(() => quitar(id), tipo === 'error' ? 6000 : 3500);
  }, [quitar]);
  const valor = useMemo(() => ({ toast }), [toast]);

  return (
    <ToastCtx.Provider value={valor}>
      {children}
      <div className="toasts" aria-live="polite">
        {items.map((t) => (
          <div key={t.id} className={`toast toast--visible toast--${t.tipo}`} role={t.tipo === 'error' ? 'alert' : 'status'}>
            {ICONOS[t.tipo]}<span>{t.mensaje}</span>
            <button type="button" onClick={() => quitar(t.id)} aria-label="Cerrar aviso"><IconoCerrar size={14} /></button>
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}

export function useToast() {
  const c = useContext(ToastCtx);
  if (!c) throw new Error('useToast debe usarse dentro de <ToastProvider>');
  return c.toast;
}
