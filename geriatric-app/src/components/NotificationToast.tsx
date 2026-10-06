import { useEffect, useState } from 'react';
import { IconoCheck, IconoError, IconoAlerta, IconoInfo, IconoCerrar } from './Icons';

interface NotificationToastProps {
  message: string;
  type?: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
  onClose: () => void;
}

const ICONOS = {
  success: <IconoCheck size={22} />,
  error: <IconoError size={22} />,
  warning: <IconoAlerta size={22} />,
  info: <IconoInfo size={22} />,
};

export default function NotificationToast({ message, type = 'success', duration = 3000, onClose }: NotificationToastProps) {
  const [visible, setVisible] = useState(false);

  // Entrada: se monta oculto y pasa a visible en el siguiente frame para animar.
  useEffect(() => {
    const frame = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  const cerrar = () => {
    setVisible(false);
    setTimeout(onClose, 300);
  };

  useEffect(() => {
    const timer = setTimeout(cerrar, duration);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [duration]);

  return (
    <div className={`toast toast--${type} ${visible ? 'toast--visible' : ''}`} role={type === 'error' ? 'alert' : 'status'}>
      <span className="toast__icono">{ICONOS[type]}</span>
      <span className="toast__mensaje">{message}</span>
      <button type="button" className="toast__cerrar" onClick={cerrar} aria-label="Cerrar notificación">
        <IconoCerrar size={16} />
      </button>
    </div>
  );
}
