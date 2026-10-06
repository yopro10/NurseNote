import { useApp } from '../context/AppContext';
import { IconoVolver } from './Icons';

interface PageHeaderProps {
  titulo: string;
  descripcion?: string;
  textoVolver?: string;
}

/** Cabecera común de las vistas internas: enlace de regreso, título y descripción. */
export default function PageHeader({ titulo, descripcion, textoVolver = 'Panel principal' }: PageHeaderProps) {
  const { irADashboard } = useApp();

  return (
    <div className="pagina-cabecera">
      <button type="button" className="enlace-volver" onClick={irADashboard}>
        <IconoVolver size={16} />
        {textoVolver}
      </button>
      <h2>{titulo}</h2>
      {descripcion && <p>{descripcion}</p>}
    </div>
  );
}
