import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { descargar } from '../api/client';
import { useToast } from '../context/ToastContext';
import { CLASE_ESTADO, iniciales, mensajeError } from '../utils/format';
import { IconoAlerta, IconoBuscar, IconoCerrar, IconoDescargar } from './Icons';

/* ---------- Carga de datos ---------- */
export function useCarga<T>(fn: () => Promise<T>, deps: unknown[]) {
  const [datos, setDatos] = useState<T | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [n, setN] = useState(0);
  const ref = useRef(fn);
  ref.current = fn;
  useEffect(() => {
    let vivo = true;
    setCargando(true);
    ref.current().then((d) => { if (vivo) { setDatos(d); setError(null); } })
      .catch((e) => { if (vivo) setError(mensajeError(e)); })
      .finally(() => { if (vivo) setCargando(false); });
    return () => { vivo = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, n]);
  const recargar = useCallback(() => setN((x) => x + 1), []);
  return { datos, cargando, error, recargar, setDatos };
}

/** Debounce simple para buscadores. */
export function useDebounce<T>(valor: T, ms = 300): T {
  const [v, setV] = useState(valor);
  useEffect(() => { const t = setTimeout(() => setV(valor), ms); return () => clearTimeout(t); }, [valor, ms]);
  return v;
}

/* ---------- Estados ---------- */
export const Cargando = ({ texto = 'Cargando…' }: { texto?: string }) => (
  <div className="estado" role="status"><div className="spinner" /><p>{texto}</p></div>
);
export const ErrorBox = ({ mensaje, onReintentar }: { mensaje: string; onReintentar?: () => void }) => (
  <div className="estado estado--error" role="alert"><IconoAlerta size={26} /><p>{mensaje}</p>{onReintentar && <button className="btn btn--sm" onClick={onReintentar}>Reintentar</button>}</div>
);
export const Vacio = ({ texto, icono = '📭', accion }: { texto: string; icono?: string; accion?: ReactNode }) => (
  <div className="estado"><b>{icono}</b><p>{texto}</p>{accion}</div>
);

/* ---------- Cabecera de página ---------- */
export function PageHeader({ titulo, descripcion, children }: { titulo: string; descripcion?: string; children?: ReactNode }) {
  return (
    <div className="pagina-cab">
      <div><h2>{titulo}</h2>{descripcion && <p>{descripcion}</p>}</div>
      {children && <div className="pagina-cab__acc">{children}</div>}
    </div>
  );
}

/* ---------- Badges y avatar ---------- */
export const EstadoBadge = ({ estado }: { estado: string }) => <span className={`badge ${CLASE_ESTADO[estado] ?? 'badge--muted'}`}>{estado}</span>;
export const Avatar = ({ nombre, apellido, id = 0, sm, lg }: { nombre?: string; apellido?: string | null; id?: number; sm?: boolean; lg?: boolean }) => (
  <span className={`avatar avatar--t${id % 6} ${sm ? 'avatar--sm' : ''} ${lg ? 'avatar--lg' : ''}`} aria-hidden="true">{iniciales(nombre, apellido)}</span>
);

/* ---------- Buscador ---------- */
export function Buscador({ valor, onChange, placeholder = 'Buscar…' }: { valor: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <label className="buscador">
      <IconoBuscar size={16} /><span className="oculto-visual">{placeholder}</span>
      <input type="search" value={valor} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
    </label>
  );
}

/* ---------- Chips de filtro ---------- */
export function Chips<T extends string>({ opciones, valor, onChange }: { opciones: Array<{ id: T; etiqueta: string; cuenta?: number }>; valor: T; onChange: (v: T) => void }) {
  return (
    <div className="chips" role="group">
      {opciones.map((o) => (
        <button key={o.id} type="button" className={`chip ${valor === o.id ? 'chip--on' : ''}`} aria-pressed={valor === o.id} onClick={() => onChange(o.id)}>
          {o.etiqueta}{o.cuenta !== undefined && <i>{o.cuenta}</i>}
        </button>
      ))}
    </div>
  );
}

/* ---------- Tabs ---------- */
export function Tabs<T extends string>({ tabs, valor, onChange }: { tabs: Array<{ id: T; label: string; badge?: number }>; valor: T; onChange: (v: T) => void }) {
  return (
    <div className="tabs" role="tablist">
      {tabs.map((t) => (
        <button key={t.id} type="button" role="tab" aria-selected={valor === t.id} className={`tab ${valor === t.id ? 'tab--on' : ''}`} onClick={() => onChange(t.id)}>
          {t.label}{!!t.badge && <i>{t.badge}</i>}
        </button>
      ))}
    </div>
  );
}

/* ---------- Paginación ---------- */
export function Paginacion({ page, paginas, total, onChange }: { page: number; paginas: number; total: number; onChange: (p: number) => void }) {
  if (total === 0) return null;
  return (
    <div className="pager">
      <span>{total} resultado{total === 1 ? '' : 's'} · página {page} de {paginas}</span>
      <span className="barra">
        <button className="btn btn--sm" disabled={page <= 1} onClick={() => onChange(page - 1)}>← Anterior</button>
        <button className="btn btn--sm" disabled={page >= paginas} onClick={() => onChange(page + 1)}>Siguiente →</button>
      </span>
    </div>
  );
}

/* ---------- Modal / Drawer ---------- */
function useEscape(onClose: () => void) {
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [onClose]);
}

export function Modal({ titulo, onClose, children, pie, tam }: { titulo: string; onClose: () => void; children: ReactNode; pie?: ReactNode; tam?: 'ancho' | 'chico' }) {
  useEscape(onClose);
  return (
    <div className="overlay" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className={`modal ${tam ? `modal--${tam}` : ''}`} role="dialog" aria-modal="true" aria-label={titulo}>
        <div className="modal__cab"><h3>{titulo}</h3><button className="btn btn--g btn--ic" onClick={onClose} aria-label="Cerrar"><IconoCerrar size={18} /></button></div>
        <div className="modal__cuerpo">{children}</div>
        {pie && <div className="modal__pie">{pie}</div>}
      </div>
    </div>
  );
}

export function Drawer({ titulo, onClose, children, pie }: { titulo: ReactNode; onClose: () => void; children: ReactNode; pie?: ReactNode }) {
  useEscape(onClose);
  return (
    <div className="drawer-overlay" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <aside className="drawer" role="dialog" aria-modal="true">
        <div className="drawer__cab"><h3>{titulo}</h3><button className="btn btn--g btn--ic" onClick={onClose} aria-label="Cerrar panel"><IconoCerrar size={18} /></button></div>
        <div className="drawer__cuerpo">{children}</div>
        {pie && <div className="drawer__pie">{pie}</div>}
      </aside>
    </div>
  );
}

/** Diálogo de confirmación; si `pedirMotivo`, exige texto antes de aceptar. */
export function Confirmar({ titulo, mensaje, textoAceptar = 'Aceptar', peligro, pedirMotivo, etiquetaMotivo = 'Motivo', onAceptar, onCancelar }: {
  titulo: string; mensaje: ReactNode; textoAceptar?: string; peligro?: boolean; pedirMotivo?: boolean; etiquetaMotivo?: string;
  onAceptar: (motivo: string) => Promise<void> | void; onCancelar: () => void;
}) {
  const [motivo, setMotivo] = useState('');
  const [enviando, setEnviando] = useState(false);
  const toast = useToast();
  const invalido = pedirMotivo && motivo.trim().length < 3;
  const aceptar = async () => {
    setEnviando(true);
    try { await onAceptar(motivo.trim()); } catch (e) { toast(mensajeError(e), 'error'); } finally { setEnviando(false); }
  };
  return (
    <Modal titulo={titulo} tam="chico" onClose={onCancelar} pie={<>
      <button className="btn" onClick={onCancelar} disabled={enviando}>Cancelar</button>
      <button className={`btn ${peligro ? 'btn--peligro' : 'btn--p'}`} onClick={aceptar} disabled={enviando || !!invalido}>{enviando ? 'Procesando…' : textoAceptar}</button>
    </>}>
      <div>{mensaje}</div>
      {pedirMotivo && (
        <label className="campo"><span>{etiquetaMotivo} <em>*</em></span>
          <textarea className="textarea" rows={2} value={motivo} onChange={(e) => setMotivo(e.target.value)} autoFocus />
        </label>
      )}
    </Modal>
  );
}

/* ---------- Exportar ---------- */
export function ExportarBotones({ tipo, params = {}, etiqueta = 'Exportar' }: { tipo: string; params?: Record<string, string | number | undefined>; etiqueta?: string }) {
  const toast = useToast();
  const [cargando, setCargando] = useState<string | null>(null);
  const exportar = async (formato: 'pdf' | 'xlsx') => {
    setCargando(formato);
    try { await descargar(`/reportes/${tipo}`, { ...params, formato }, `nursenote-${tipo}`); toast(`Reporte ${formato === 'pdf' ? 'PDF' : 'Excel'} descargado`, 'success'); }
    catch (e) { toast(mensajeError(e), 'error'); }
    finally { setCargando(null); }
  };
  return (
    <span className="barra" role="group" aria-label={etiqueta}>
      <button className="btn btn--sm" onClick={() => exportar('pdf')} disabled={!!cargando}><IconoDescargar size={14} />{cargando === 'pdf' ? '…' : 'PDF'}</button>
      <button className="btn btn--sm" onClick={() => exportar('xlsx')} disabled={!!cargando}><IconoDescargar size={14} />{cargando === 'xlsx' ? '…' : 'Excel'}</button>
    </span>
  );
}

/* ---------- Campos de formulario ---------- */
export function Campo({ etiqueta, requerido, ayuda, children, ancho }: { etiqueta: string; requerido?: boolean; ayuda?: string; children: ReactNode; ancho?: boolean }) {
  return (
    <label className={`campo ${ancho ? 'ancho' : ''}`}>
      <span>{etiqueta}{requerido && <em> *</em>}</span>
      {children}
      {ayuda && <small>{ayuda}</small>}
    </label>
  );
}

export function Dl({ filas }: { filas: Array<[string, ReactNode]> }) {
  return <dl className="dl">{filas.map(([k, v]) => <div key={k} style={{ display: 'contents' }}><dt>{k}</dt><dd>{v ?? '—'}</dd></div>)}</dl>;
}
