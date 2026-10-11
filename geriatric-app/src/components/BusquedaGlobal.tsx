import { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { IconoBuscar, IconoCerrar } from './Icons';

interface ResultadoBusqueda {
  tipo: 'paciente' | 'nota' | 'medicamento';
  id: number;
  titulo: string;
  subtitulo: string;
  onClick: () => void;
}

interface BusquedaGlobalProps {
  onClose: () => void;
}

export default function BusquedaGlobal({ onClose }: BusquedaGlobalProps) {
  const [query, setQuery] = useState('');
  const [resultados, setResultados] = useState<ResultadoBusqueda[]>([]);
  const [cargando, setCargando] = useState(false);
  const { pacientes, seleccionarPaciente } = useApp();

  useEffect(() => {
    if (query.length >= 2) {
      buscar(query);
    } else {
      setResultados([]);
    }
  }, [query]);

  const buscar = async (texto: string) => {
    setCargando(true);
    try {
      const resultados: ResultadoBusqueda[] = [];

      // Buscar en pacientes
      const pacientesEncontrados = pacientes.filter(p =>
        p.nombreCompleto.toLowerCase().includes(texto.toLowerCase()) ||
        p.habitacion.toLowerCase().includes(texto.toLowerCase())
      );

      pacientesEncontrados.forEach(p => {
        resultados.push({
          tipo: 'paciente',
          id: p.id,
          titulo: p.nombreCompleto,
          subtitulo: `Habitación ${p.habitacion} · ${p.estado}`,
          onClick: () => {
            seleccionarPaciente(p);
            onClose();
          }
        });
      });

      setResultados(resultados);
    } catch (error) {
      console.error('Error en búsqueda:', error);
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="busqueda-global-overlay" onClick={onClose}>
      <div className="busqueda-global" onClick={(e) => e.stopPropagation()}>
        <div className="busqueda-global__header">
          <div className="busqueda-global__input">
            <IconoBuscar size={20} />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar pacientes, notas, medicamentos..."
              autoFocus
            />
            <button onClick={onClose} className="boton boton--fantasma">
              <IconoCerrar size={20} />
            </button>
          </div>
        </div>

        <div className="busqueda-global__resultados">
          {cargando && (
            <div className="cargando-bloque">
              <div className="spinner"></div>
              <p>Buscando...</p>
            </div>
          )}

          {!cargando && query.length < 2 && (
            <div className="busqueda-global__vacio">
              <p>Escribe al menos 2 caracteres para buscar</p>
            </div>
          )}

          {!cargando && query.length >= 2 && resultados.length === 0 && (
            <div className="busqueda-global__vacio">
              <p>No se encontraron resultados para "{query}"</p>
            </div>
          )}

          {!cargando && resultados.length > 0 && (
            <div className="busqueda-global__lista">
              {resultados.map((resultado) => (
                <button
                  key={`${resultado.tipo}-${resultado.id}`}
                  className="busqueda-global__item"
                  onClick={resultado.onClick}
                >
                  <span className={`busqueda-global__icono busqueda-global__icono--${resultado.tipo}`}>
                    {resultado.tipo === 'paciente' ? '👤' : resultado.tipo === 'nota' ? '📝' : '💊'}
                  </span>
                  <div className="busqueda-global__contenido">
                    <strong>{resultado.titulo}</strong>
                    <small>{resultado.subtitulo}</small>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="busqueda-global__footer">
          <small>Usa las flechas ↑↓ para navegar, Enter para seleccionar, Esc para cerrar</small>
        </div>
      </div>
    </div>
  );
}
