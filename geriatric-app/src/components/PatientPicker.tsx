import { useEffect, useMemo, useState } from 'react';
import { useApp } from '../context/AppContext';
import type { EstadoPaciente } from '../types';
import PageHeader from './PageHeader';
import { IconoBuscar, IconoAlerta } from './Icons';

const CLASE_ESTADO: Record<EstadoPaciente, string> = {
  Estable: 'badge badge--verde',
  'En Observación': 'badge badge--ambar',
  Crítico: 'badge badge--rojo',
};

const CLASE_TARJETA: Record<EstadoPaciente, string> = { Estable: 'ok', 'En Observación': 'obs', Crítico: 'crit' };

const FILTROS: Array<{ id: 'todos' | EstadoPaciente; etiqueta: string }> = [
  { id: 'todos', etiqueta: 'Todos' },
  { id: 'Estable', etiqueta: 'Estables' },
  { id: 'En Observación', etiqueta: 'En observación' },
  { id: 'Crítico', etiqueta: 'Críticos' },
];

interface PatientPickerProps {
  titulo: string;
  descripcion: string;
  textoAccion?: string;
  onSeleccionar?: (paciente: any) => void;
  onEditar?: (paciente: any) => void;
  onEgresar?: (paciente: any) => void;
  mostrarAcciones?: boolean;
}

/**
 * Lista de residentes con buscador, filtro por estado y acción de registro.
 * Reutilizada por Notas de enfermería, Signos vitales, Medicamentos y Residentes.
 */
export default function PatientPicker({ titulo, descripcion, textoAccion = 'Registrar', onSeleccionar, onEditar, onEgresar, mostrarAcciones = false }: PatientPickerProps) {
  const { pacientes, buscarPacientes, seleccionarPaciente } = useApp();
  const [query, setQuery] = useState('');
  const [filtro, setFiltro] = useState<'todos' | EstadoPaciente>('todos');

  // Búsqueda con pequeño debounce para no consultar en cada tecla
  useEffect(() => {
    const timeout = setTimeout(() => {
      buscarPacientes(query);
    }, 200);
    return () => clearTimeout(timeout);
  }, [query, buscarPacientes]);

  const cuentas = useMemo(() => {
    const base: Record<string, number> = { todos: pacientes.length };
    pacientes.forEach((p) => {
      base[p.estado] = (base[p.estado] ?? 0) + 1;
    });
    return base;
  }, [pacientes]);

  const visibles = filtro === 'todos' ? pacientes : pacientes.filter((p) => p.estado === filtro);

  return (
    <div>
      <PageHeader titulo={titulo} descripcion={descripcion} />

      <div className="barra-herramientas">
        <label className="buscador">
          <IconoBuscar size={20} />
          <span className="visualmente-oculto">Buscar residente</span>
          <input
            type="text"
            placeholder="Buscar por nombre, cédula o habitación…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>

        <div className="chips" role="group" aria-label="Filtrar por estado">
          {FILTROS.map((f) => (
            <button
              key={f.id}
              type="button"
              className={`chip ${filtro === f.id ? 'chip--activo' : ''}`}
              aria-pressed={filtro === f.id}
              onClick={() => setFiltro(f.id)}
            >
              {f.etiqueta}
              <span className="chip__cuenta">{cuentas[f.id] ?? 0}</span>
            </button>
          ))}
        </div>
      </div>

      {visibles.length === 0 ? (
        <p className="residentes__vacio">
          {query ? `No hay residentes que coincidan con “${query}”. Revisa el nombre o prueba con la cédula.` : 'No hay residentes con este estado.'}
        </p>
      ) : (
        <ul className="residentes">
          {visibles.map((p) => (
            <li key={p.id} className={`residente residente--${CLASE_TARJETA[p.estado]}`}>
              <div className="residente__cabecera">
                <span className={`avatar avatar--grande avatar--tono-${p.id % 6}`}>{p.avatarIniciales}</span>
                <span className="residente__hab">Hab. {p.habitacion}</span>
              </div>
              <h3>{p.nombreCompleto}</h3>
              <p className="residente__dx">{p.diagnosticoPrincipal}</p>
              <div className="residente__datos">
                <span className={CLASE_ESTADO[p.estado]}>{p.estado}</span>
                <span className="dato">{p.edad} años</span>
                {p.alergias && (
                  <span className="dato dato--alergia" title={`Alergias: ${p.alergias}`}>
                    <IconoAlerta size={14} /> Alergia
                  </span>
                )}
              </div>
              <div className="residente__acciones">
                <button type="button" className="boton boton--tema boton--bloque" onClick={() => onSeleccionar ? onSeleccionar(p) : seleccionarPaciente(p)}>
                  {textoAccion}
                </button>
                {mostrarAcciones && (
                  <div className="residente__acciones-secundarias">
                    <button
                      type="button"
                      className="boton boton--pequeno boton--secundario"
                      onClick={() => onEditar ? onEditar(p) : null}
                      title="Editar residente"
                    >
                      Editar
                    </button>
                    <button
                      type="button"
                      className="boton boton--pequeno boton--secundario"
                      onClick={() => onEgresar ? onEgresar(p) : null}
                      title="Egresar residente"
                    >
                      Egresar
                    </button>
                  </div>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
