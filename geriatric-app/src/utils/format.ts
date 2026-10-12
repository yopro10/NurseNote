import type { Paciente, EstadoPaciente } from '../types';

const pad = (n: number) => String(n).padStart(2, '0');

/** Convierte "YYYY-MM-DD" o "YYYY-MM-DDTHH:mm:ss" (hora local, sin zona) en Date local. */
export function aFecha(s?: string | null): Date | null {
  if (!s) return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2})(?::(\d{2}))?)?/.exec(s);
  if (!m) { const d = new Date(s); return Number.isNaN(d.getTime()) ? null : d; }
  return new Date(+m[1], +m[2] - 1, +m[3], +(m[4] ?? 0), +(m[5] ?? 0), +(m[6] ?? 0));
}
export const fmtFecha = (s?: string | null) => { const d = aFecha(s); return d ? `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}` : '—'; };
export const fmtHora = (s?: string | null) => { const d = aFecha(s); return d ? `${pad(d.getHours())}:${pad(d.getMinutes())}` : '—'; };
export const fmtFechaHora = (s?: string | null) => (aFecha(s) ? `${fmtFecha(s)} ${fmtHora(s)}` : '—');
export const hoyISO = (offsetDias = 0) => { const d = new Date(); d.setDate(d.getDate() + offsetDias); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; };
export const fmtDiaCorto = (s: string) => { const d = aFecha(s); return d ? `${pad(d.getDate())}/${pad(d.getMonth() + 1)}` : s; };

export function hace(s?: string | null): string {
  const d = aFecha(s);
  if (!d) return '—';
  const min = Math.round((Date.now() - d.getTime()) / 60000);
  if (min < 1) return 'ahora';
  if (min < 60) return `hace ${min} min`;
  if (min < 1440) return `hace ${Math.floor(min / 60)} h`;
  return `hace ${Math.floor(min / 1440)} d`;
}

export function calcularEdad(fecha?: string | null): number | null {
  const n = aFecha(fecha);
  if (!n) return null;
  const h = new Date();
  let e = h.getFullYear() - n.getFullYear();
  if (h.getMonth() < n.getMonth() || (h.getMonth() === n.getMonth() && h.getDate() < n.getDate())) e--;
  return e;
}

export const iniciales = (nombre?: string, apellido?: string | null) => `${nombre?.[0] ?? ''}${apellido?.[0] ?? ''}`.toUpperCase() || '?';
export const nombreCompleto = (p: { nombre?: string; apellido?: string | null }) => `${p.nombre ?? ''} ${p.apellido ?? ''}`.trim();
export const nombrePaciente = (p: Pick<Paciente, 'nombre' | 'apellido'>) => nombreCompleto(p);

export const CLASE_ESTADO: Record<string, string> = { Estable: 'badge--ok', 'En Observación': 'badge--warn', Crítico: 'badge--crit', Egresado: 'badge--muted' };
export const CLASE_RES: Record<EstadoPaciente, string> = { Estable: '', 'En Observación': 'res--obs', Crítico: 'res--crit' };

export const ROLES: Record<string, string> = { administrador: 'Administrador', enfermera: 'Enfermera', jefe_enfermeria: 'Jefe de enfermería' };
export const TIPOS_NOTA: Record<string, string> = { ingreso: 'Ingreso', evolucion: 'Evolución', egreso: 'Egreso', medicacion: 'Medicación', signos_vitales: 'Signos vitales', observacion: 'Observación', correccion: 'Corrección' };
export const ESTADOS_ADMIN: Record<string, { texto: string; clase: string }> = {
  programada: { texto: 'Pendiente', clase: 'badge--info' }, administrada: { texto: 'Administrada', clase: 'badge--ok' },
  omitida: { texto: 'Omitida', clase: 'badge--warn' }, rechazada: { texto: 'Rechazada', clase: 'badge--crit' }, cancelada: { texto: 'Cancelada', clase: 'badge--muted' },
};
export const ESTADOS_INV: Record<string, { texto: string; clase: string }> = {
  ok: { texto: 'Disponible', clase: 'badge--ok' }, stock_bajo: { texto: 'Stock bajo', clase: 'badge--warn' }, por_vencer: { texto: 'Por vencer', clase: 'badge--warn' },
  vencido: { texto: 'Vencido', clase: 'badge--crit' }, agotado: { texto: 'Agotado', clase: 'badge--crit' },
};
export const mensajeError = (e: unknown) => (e instanceof Error ? e.message : 'Ocurrió un error inesperado');
