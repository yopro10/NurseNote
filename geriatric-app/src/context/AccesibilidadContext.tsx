import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

export type Tamano = 'normal' | 'grande' | 'muy-grande';
const Ctx = createContext<{ tamanoLetra: Tamano; cambiarTamanoLetra: (t: Tamano) => void } | undefined>(undefined);

export function AccesibilidadProvider({ children }: { children: ReactNode }) {
  const [tamanoLetra, setTamano] = useState<Tamano>(() => (localStorage.getItem('tamano_letra') as Tamano) || 'normal');
  useEffect(() => {
    document.documentElement.setAttribute('data-tamano-letra', tamanoLetra);
    localStorage.setItem('tamano_letra', tamanoLetra);
  }, [tamanoLetra]);
  return <Ctx.Provider value={{ tamanoLetra, cambiarTamanoLetra: setTamano }}>{children}</Ctx.Provider>;
}

export function useAccesibilidad() {
  const c = useContext(Ctx);
  if (!c) throw new Error('useAccesibilidad debe usarse dentro de AccesibilidadProvider');
  return c;
}
