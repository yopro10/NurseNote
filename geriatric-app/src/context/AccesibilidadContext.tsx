import { createContext, useContext, useState, ReactNode } from 'react';

interface AccesibilidadContextType {
  tamanoLetra: 'normal' | 'grande' | 'muy-grande';
  cambiarTamanoLetra: (tamano: 'normal' | 'grande' | 'muy-grande') => void;
}

const AccesibilidadContext = createContext<AccesibilidadContextType | undefined>(undefined);

export function AccesibilidadProvider({ children }: { children: ReactNode }) {
  const [tamanoLetra, setTamanoLetra] = useState<'normal' | 'grande' | 'muy-grande'>('normal');

  const cambiarTamanoLetra = (tamano: 'normal' | 'grande' | 'muy-grande') => {
    setTamanoLetra(tamano);
    document.documentElement.setAttribute('data-tamano-letra', tamano);
  };

  return (
    <AccesibilidadContext.Provider value={{ tamanoLetra, cambiarTamanoLetra }}>
      {children}
    </AccesibilidadContext.Provider>
  );
}

export function useAccesibilidad() {
  const context = useContext(AccesibilidadContext);
  if (!context) {
    throw new Error('useAccesibilidad debe usarse dentro de AccesibilidadProvider');
  }
  return context;
}
