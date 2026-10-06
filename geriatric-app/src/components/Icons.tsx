import type { SVGProps } from 'react';

type IconProps = SVGProps<SVGSVGElement> & { size?: number };

function Base({ size = 20, children, ...rest }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...rest}
    >
      {children}
    </svg>
  );
}

export const IconoPanel = (p: IconProps) => (
  <Base {...p}>
    <rect x="3" y="3" width="7" height="9" rx="2" />
    <rect x="14" y="3" width="7" height="5" rx="2" />
    <rect x="14" y="12" width="7" height="9" rx="2" />
    <rect x="3" y="16" width="7" height="5" rx="2" />
  </Base>
);

export const IconoNotas = (p: IconProps) => (
  <Base {...p}>
    <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
    <path d="M14 3v5h5" />
    <path d="M9 13h6M9 17h4" />
  </Base>
);

export const IconoVitales = (p: IconProps) => (
  <Base {...p}>
    <path d="M3 12h4l2-6 4 12 2-6h6" />
  </Base>
);

export const IconoMedicamentos = (p: IconProps) => (
  <Base {...p}>
    <path d="m10.5 20.5-7-7a4.95 4.95 0 0 1 7-7l7 7a4.95 4.95 0 0 1-7 7Z" />
    <path d="m8.5 8.5 7 7" />
  </Base>
);

export const IconoPacientes = (p: IconProps) => (
  <Base {...p}>
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </Base>
);

export const IconoEstadisticas = (p: IconProps) => (
  <Base {...p}>
    <path d="M18 20V10M12 20V4M6 20v-6" />
  </Base>
);

export const IconoInventario = (p: IconProps) => (
  <Base {...p}>
    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
    <path d="M3.27 6.96 12 12.01l8.73-5.05M12 22.08V12" />
  </Base>
);

export const IconoBuscar = (p: IconProps) => (
  <Base {...p}>
    <circle cx="11" cy="11" r="7" />
    <path d="m21 21-4.3-4.3" />
  </Base>
);

export const IconoVolver = (p: IconProps) => (
  <Base {...p}>
    <path d="M15 18l-6-6 6-6" />
  </Base>
);

export const IconoFlecha = (p: IconProps) => (
  <Base {...p}>
    <path d="M9 6l6 6-6 6" />
  </Base>
);

export const IconoCerrar = (p: IconProps) => (
  <Base {...p}>
    <path d="M18 6 6 18M6 6l12 12" />
  </Base>
);

export const IconoSalir = (p: IconProps) => (
  <Base {...p}>
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <path d="m16 17 5-5-5-5M21 12H9" />
  </Base>
);

export const IconoAlerta = (p: IconProps) => (
  <Base {...p}>
    <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
    <path d="M12 9v4M12 17h.01" />
  </Base>
);

export const IconoCheck = (p: IconProps) => (
  <Base {...p}>
    <path d="M20 6 9 17l-5-5" />
  </Base>
);

export const IconoError = (p: IconProps) => (
  <Base {...p}>
    <circle cx="12" cy="12" r="10" />
    <path d="m15 9-6 6M9 9l6 6" />
  </Base>
);

export const IconoInfo = (p: IconProps) => (
  <Base {...p}>
    <circle cx="12" cy="12" r="10" />
    <path d="M12 16v-4M12 8h.01" />
  </Base>
);

export const IconoHogar = (p: IconProps) => (
  <Base {...p}>
    <path d="M3 11.5 12 4l9 7.5" />
    <path d="M5 10v9a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1v-9" />
  </Base>
);

/** Marca del sistema: cruz médica con latido. */
export function MarcaSIG({ size = 40 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" aria-hidden="true">
      <defs>
        <linearGradient id="marca-grad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#12A06B" />
          <stop offset="1" stopColor="#0B7DB8" />
        </linearGradient>
      </defs>
      <rect width="40" height="40" rx="12" fill="url(#marca-grad)" />
      <path
        d="M7 21h6l3-7 5 13 3-8 2 2h7"
        fill="none"
        stroke="#fff"
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Trazo de electrocardiograma: elemento visual firma del sistema. */
const RUTA_ECG =
  'M0 62 H120 L140 62 L158 24 L180 100 L204 8 L226 62 H330 L348 62 L364 40 L384 84 L402 62 H520 L538 62 L556 20 L578 104 L602 4 L624 62 H800';

export function TrazoECG({ className }: { className?: string }) {
  return (
    <svg
      className={`ecg ${className ?? ''}`}
      viewBox="0 0 800 120"
      preserveAspectRatio="none"
      fill="none"
      aria-hidden="true"
    >
      <path
        className="ecg__base"
        d={RUTA_ECG}
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        className="ecg__linea"
        d={RUTA_ECG}
        pathLength={1}
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
