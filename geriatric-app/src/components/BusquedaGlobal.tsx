import { useEffect, useState } from 'react';
import { api } from '../api/client';
import { useApp } from '../context/AppContext';
import type { Medicamento, Nota } from '../types';
import { fmtFecha, nombreCompleto, TIPOS_NOTA } from '../utils/format';
import { EstadoBadge, useDebounce } from './ui';
import { IconoBuscar, IconoCerrar } from './Icons';

interface Res { clave: string; sec: string; titulo: string; sub: string; extra?: string; ir: () => void }

export default function BusquedaGlobal({ onClose }: { onClose: () => void }) {
  const { pacientes, ir } = useApp();
  const [q, setQ] = useState('');
  const d = useDebounce(q.trim(), 250);
  const [remotos, setRemotos] = useState<{ meds: Medicamento[]; notas: Nota[] }>({ meds: [], notas: [] });
  const [cargando, setCargando] = useState(false);

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [onClose]);

  useEffect(() => {
    if (d.length < 2) { setRemotos({ meds: [], notas: [] }); return; }
    let vivo = true;
    setCargando(true);
    Promise.all([api.get<Medicamento[]>('/medicamentos', { q: d }), api.get<{ data: Nota[] }>('/notas', { q: d, limit: 5 })])
      .then(([meds, notas]) => { if (vivo) setRemotos({ meds: meds.slice(0, 5), notas: notas.data }); })
      .catch(() => { if (vivo) setRemotos({ meds: [], notas: [] }); })
      .finally(() => { if (vivo) setCargando(false); });
    return () => { vivo = false; };
  }, [d]);

  const norm = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  const resultados: Res[] = [];
  if (d.length >= 2) {
    pacientes.filter((p) => norm(`${nombreCompleto(p)} ${p.habitacion ?? ''} ${p.documento ?? ''}`).includes(norm(d))).slice(0, 6)
      .forEach((p) => resultados.push({ clave: `p${p.id}`, sec: 'Residentes', titulo: nombreCompleto(p), sub: `Hab. ${p.habitacion ?? '—'} · ${p.documento ?? 'sin documento'}`, extra: p.estado_calculado, ir: () => ir('ficha', { pacienteId: p.id }) }));
    remotos.meds.forEach((m) => resultados.push({ clave: `m${m.id}`, sec: 'Medicamentos', titulo: m.nombre, sub: `Stock ${m.cantidad_disponible} · vence ${fmtFecha(m.fecha_caducidad)}`, ir: () => ir('inventario', { id: m.id }) }));
    remotos.notas.forEach((n) => resultados.push({ clave: `n${n.id}`, sec: 'Notas', titulo: `${TIPOS_NOTA[n.tipo_nota]} · ${n.paciente_nombre} ${n.paciente_apellido}`, sub: (n.contenido || '').slice(0, 80), ir: () => ir('notas', { id: n.id }) }));
  }
  let ultima = '';

  return (
    <div className="overlay" style={{ alignItems: 'start' }} onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="busqueda" role="dialog" aria-label="Búsqueda global">
        <div className="busqueda__in"><IconoBuscar size={18} />
          <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar residentes, medicamentos o notas…" aria-label="Buscar" />
          <button className="btn btn--g btn--ic" onClick={onClose} aria-label="Cerrar búsqueda"><IconoCerrar size={16} /></button></div>
        <div className="busqueda__res">
          {d.length < 2 && <div className="estado"><p>Escribe al menos 2 letras.</p></div>}
          {d.length >= 2 && !cargando && !resultados.length && <div className="estado"><p>Sin resultados para “{d}”.</p></div>}
          {cargando && !resultados.length && <div className="estado"><div className="spinner" /></div>}
          {resultados.map((r) => {
            const cab = r.sec !== ultima ? <div className="busqueda__sec">{r.sec}</div> : null;
            ultima = r.sec;
            return <div key={r.clave}>{cab}
              <button className="noti" onClick={() => { r.ir(); onClose(); }}><span><strong>{r.titulo}</strong><small>{r.sub}</small></span>{r.extra && <span style={{ marginLeft: 'auto' }}><EstadoBadge estado={r.extra} /></span>}</button></div>;
          })}
        </div>
      </div>
    </div>
  );
}
