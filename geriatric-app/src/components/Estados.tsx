interface EstadoCargandoProps {
  mensaje?: string;
}

export function EstadoCargando({ mensaje = 'Cargando...' }: EstadoCargandoProps) {
  return (
    <div className="estado estado--cargando">
      <div className="spinner"></div>
      <p>{mensaje}</p>
    </div>
  );
}

interface EstadoErrorProps {
  mensaje?: string;
  onReintentar?: () => void;
}

export function EstadoError({ mensaje = 'Ha ocurrido un error', onReintentar }: EstadoErrorProps) {
  return (
    <div className="estado estado--error">
      <div className="estado__icono">⚠️</div>
      <p>{mensaje}</p>
      {onReintentar && (
        <button onClick={onReintentar} className="boton boton--primario">
          Reintentar
        </button>
      )}
    </div>
  );
}

interface EstadoVacioProps {
  mensaje?: string;
  icono?: string;
}

export function EstadoVacio({ mensaje = 'No hay datos disponibles', icono = '📭' }: EstadoVacioProps) {
  return (
    <div className="estado estado--vacio">
      <div className="estado__icono">{icono}</div>
      <p>{mensaje}</p>
    </div>
  );
}
