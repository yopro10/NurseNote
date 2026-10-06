import { IconoCheck, IconoAlerta } from './Icons';

interface ConfirmationModalProps {
  abierto: boolean;
  titulo: string;
  mensaje: string;
  textoAceptar?: string;
  textoCancelar?: string;
  cargando?: boolean;
  variante?: 'exito' | 'peligro';
  onAceptar: () => void;
  onCancelar: () => void;
}

export default function ConfirmationModal({
  abierto,
  titulo,
  mensaje,
  textoAceptar = 'Aceptar',
  textoCancelar = 'Cancelar',
  cargando = false,
  variante = 'exito',
  onAceptar,
  onCancelar,
}: ConfirmationModalProps) {
  if (!abierto) return null;

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="modal-titulo">
      <div className="modal-tarjeta">
        <div className={`modal-tarjeta__icono modal-tarjeta__icono--${variante}`}>
          {variante === 'exito' ? <IconoCheck size={30} strokeWidth={2.2} /> : <IconoAlerta size={30} strokeWidth={2.2} />}
        </div>

        <h2 id="modal-titulo">{titulo}</h2>
        <p>{mensaje}</p>

        <div className="modal-tarjeta__acciones">
          <button type="button" className="boton boton--fantasma boton--grande" onClick={onCancelar} disabled={cargando}>
            {textoCancelar}
          </button>
          <button
            type="button"
            className={`boton boton--grande ${variante === 'exito' ? 'boton--exito' : 'boton--oscuro'}`}
            onClick={onAceptar}
            disabled={cargando}
          >
            {cargando ? 'Guardando…' : textoAceptar}
          </button>
        </div>
      </div>
    </div>
  );
}
