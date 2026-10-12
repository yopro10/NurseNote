import { useApp } from '../context/AppContext';

/** Selector de residente activo (ordenado por habitación). */
export default function PacienteSelect({ valor, onChange, todos, className = 'select', requerido }: {
  valor: number | ''; onChange: (id: number | '') => void; todos?: string; className?: string; requerido?: boolean;
}) {
  const { pacientes } = useApp();
  return (
    <select className={className} value={valor} required={requerido} aria-label="Residente" onChange={(e) => onChange(e.target.value ? Number(e.target.value) : '')}>
      <option value="">{todos ?? 'Selecciona un residente…'}</option>
      {pacientes.map((p) => <option key={p.id} value={p.id}>{p.habitacion ? `Hab. ${p.habitacion} · ` : ''}{p.nombre} {p.apellido}</option>)}
    </select>
  );
}
