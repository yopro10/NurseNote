import { IconoCerrar } from './Icons';

interface NotaDetailPanelProps {
  isOpen: boolean;
  onClose: () => void;
  nota: any;
}

export default function NotaDetailPanel({ isOpen, onClose, nota }: NotaDetailPanelProps) {
  if (!isOpen || !nota) return null;

  return (
    <div className="panel-lateral-overlay" onClick={onClose}>
      <div className="panel-lateral" onClick={(e) => e.stopPropagation()}>
        <div className="panel-lateral__cabecera">
          <h3>Detalle de Nota</h3>
          <button type="button" className="boton boton--fantasma" onClick={onClose} aria-label="Cerrar">
            <IconoCerrar size={20} />
          </button>
        </div>

        <div className="panel-lateral__cuerpo">
          <div className="nota-detalle">
            <div className="nota-detalle__meta">
              <span className="badge badge--info">{nota.tipo_nota}</span>
              <span className="nota-detalle__fecha">
                {new Date(nota.fecha_registro).toLocaleString('es-ES')}
              </span>
            </div>

            <div className="nota-detalle__autor">
              <strong>Por:</strong> {nota.usuario_nombre} {nota.usuario_apellido}
            </div>

            <div className="nota-detalle__paciente">
              <strong>Paciente:</strong> {nota.paciente_nombre} {nota.paciente_apellido}
            </div>

            {nota.estado_paciente && (
              <div className="nota-detalle__estado">
                <strong>Estado del paciente:</strong> {nota.estado_paciente}
              </div>
            )}

            <div className="nota-detalle__contenido">
              <strong>Contenido:</strong>
              <p>{nota.contenido}</p>
            </div>

            {nota.observaciones && (
              <div className="nota-detalle__observaciones">
                <strong>Observaciones:</strong>
                <p>{nota.observaciones}</p>
              </div>
            )}

            {nota.signos_vitales && (
              <div className="nota-detalle__signos">
                <strong>Signos vitales:</strong>
                <pre>{JSON.stringify(nota.signos_vitales, null, 2)}</pre>
              </div>
            )}

            {nota.administracion_medicamentos && (
              <div className="nota-detalle__medicamentos">
                <strong>Administración de medicamentos:</strong>
                <pre>{JSON.stringify(nota.administracion_medicamentos, null, 2)}</pre>
              </div>
            )}

            {nota.fecha_actualizacion && (
              <div className="nota-detalle__actualizacion">
                <small>Última actualización: {new Date(nota.fecha_actualizacion).toLocaleString('es-ES')}</small>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
