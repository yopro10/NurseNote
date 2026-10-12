import { FormEvent, useState } from 'react';
import { api } from '../api/client';
import { useApp } from '../context/AppContext';
import { useToast } from '../context/ToastContext';
import { IconoMas } from '../components/Icons';
import { Buscador, Campo, Cargando, Chips, Confirmar, Drawer, Dl, ErrorBox, ExportarBotones, Modal, PageHeader, Vacio, useCarga, useDebounce } from '../components/ui';
import type { Medicamento } from '../types';
import { ESTADOS_INV, fmtFecha, fmtFechaHora, mensajeError } from '../utils/format';

type Filtro = 'todos' | 'alerta' | 'stock_bajo' | 'por_vencer' | 'vencido';

export default function InventarioView() {
  const { esGestor, destino, ir, tick, refrescar } = useApp();
  const toast = useToast();
  const [q, setQ] = useState('');
  const dq = useDebounce(q);
  const [filtro, setFiltro] = useState<Filtro>('todos');
  const [sel, setSel] = useState<number | null>(destino.id ?? null);
  const [form, setForm] = useState<null | { m: Medicamento | null }>(null);
  const [stock, setStock] = useState<Medicamento | null>(null);
  const [retirar, setRetirar] = useState<Medicamento | null>(null);
  const { datos, cargando, error, recargar } = useCarga(() => api.get<Medicamento[]>('/medicamentos', { q: dq }), [dq, tick]);

  const lista = datos ?? [];
  const c = (e: string) => lista.filter((m) => m.estado_inventario === e).length;
  const visibles = lista.filter((m) => filtro === 'todos' || (filtro === 'alerta' ? m.estado_inventario !== 'ok' : filtro === 'stock_bajo' ? ['stock_bajo', 'agotado'].includes(m.estado_inventario) : m.estado_inventario === filtro));
  const alertas = lista.filter((m) => m.estado_inventario !== 'ok').length;

  return (
    <>
      <PageHeader titulo="Inventario de medicamentos" descripcion="Existencias, caducidades y movimientos. El stock baja automáticamente al administrar dosis.">
        <ExportarBotones tipo="inventario" />
        {esGestor && <button className="btn btn--p" onClick={() => setForm({ m: null })}><IconoMas size={15} /> Nuevo medicamento</button>}
      </PageHeader>
      <section className="kpis">
        <div className="kpi"><span><b>{lista.length}</b><span>Medicamentos</span></span></div>
        <div className="kpi kpi--crit"><span><b>{c('vencido')}</b><span>Vencidos</span></span></div>
        <div className="kpi kpi--warn"><span><b>{c('por_vencer')}</b><span>Por vencer (30 días)</span></span></div>
        <div className="kpi kpi--warn"><span><b>{c('stock_bajo') + c('agotado')}</b><span>Stock bajo o agotado</span></span></div>
      </section>
      <div className="barra"><Buscador valor={q} onChange={setQ} placeholder="Buscar por nombre, lote o proveedor…" />
        <Chips valor={filtro} onChange={setFiltro} opciones={[{ id: 'todos', etiqueta: 'Todos', cuenta: lista.length }, { id: 'alerta', etiqueta: 'Con alerta', cuenta: alertas }, { id: 'stock_bajo', etiqueta: 'Stock bajo' }, { id: 'por_vencer', etiqueta: 'Por vencer' }, { id: 'vencido', etiqueta: 'Vencidos' }]} /></div>

      {cargando && !datos && <Cargando />}{error && <ErrorBox mensaje={error} onReintentar={recargar} />}
      {datos && !visibles.length && <Vacio icono="📦" texto="No hay medicamentos con este filtro." />}
      {visibles.length > 0 && <div className="tabla-wrap"><table className="tabla"><thead><tr><th>Medicamento</th><th className="num">Stock</th><th>Caducidad</th><th>Lote / proveedor</th><th>Residentes</th><th>Estado</th><th /></tr></thead>
        <tbody>{visibles.map((m) => (
          <tr key={m.id} className={`click ${m.estado_inventario === 'vencido' || m.estado_inventario === 'agotado' ? 'fila--crit' : m.estado_inventario !== 'ok' ? 'fila--warn' : ''}`} onClick={() => setSel(m.id)}>
            <td><b>{m.nombre}</b><small>{m.presentacion} · {m.dosis}</small></td>
            <td className="num"><b>{m.cantidad_disponible}</b><small>mín. {m.stock_minimo ?? 10}</small></td>
            <td>{fmtFecha(m.fecha_caducidad)}<small>{m.dias_para_vencer <= 0 ? 'Vencido' : `en ${m.dias_para_vencer} días`}</small></td>
            <td>{m.lote ?? '—'}<small>{m.proveedor ?? ''}</small></td><td>{m.residentes_asignados}</td>
            <td><span className={`badge ${ESTADOS_INV[m.estado_inventario].clase}`}>{ESTADOS_INV[m.estado_inventario].texto}</span></td>
            <td className="acc"><button className="btn btn--sm" onClick={(e) => { e.stopPropagation(); setSel(m.id); }}>Ver</button>
              {esGestor && <> <button className="btn btn--sm" onClick={(e) => { e.stopPropagation(); setStock(m); }}>Stock</button></>}</td></tr>))}</tbody></table></div>}

      {sel && <DetalleMedicamento id={sel} onClose={() => setSel(null)} esGestor={esGestor} version={tick}
        onEditar={(m) => setForm({ m })} onStock={setStock} onRetirar={setRetirar} onVerResidente={(pid) => { setSel(null); ir('ficha', { pacienteId: pid, tab: 'medicacion' }); }} />}
      {form && <MedicamentoForm m={form.m} onClose={() => setForm(null)} onGuardado={() => { refrescar(); recargar(); }} />}
      {stock && <StockModal m={stock} onClose={() => setStock(null)} onGuardado={() => { refrescar(); recargar(); }} />}
      {retirar && <Confirmar titulo="Retirar del inventario" peligro textoAceptar="Retirar" mensaje={<>¿Retirar <b>{retirar.nombre}</b> del inventario? Dejará de aparecer en prescripciones.</>} onCancelar={() => setRetirar(null)}
        onAceptar={async () => { try { await api.del(`/medicamentos/${retirar.id}`); toast('Medicamento retirado', 'success'); setRetirar(null); setSel(null); refrescar(); recargar(); } catch (e) { toast(mensajeError(e), 'error'); setRetirar(null); } }} />}
    </>
  );
}

function DetalleMedicamento({ id, onClose, esGestor, version, onEditar, onStock, onRetirar, onVerResidente }: {
  id: number; onClose: () => void; esGestor: boolean; version: number; onEditar: (m: Medicamento) => void; onStock: (m: Medicamento) => void; onRetirar: (m: Medicamento) => void; onVerResidente: (id: number) => void;
}) {
  const { datos: m, cargando, error, recargar } = useCarga(() => api.get<Medicamento>(`/medicamentos/${id}`), [id, version]);
  return (
    <Drawer titulo={m?.nombre ?? 'Medicamento'} onClose={onClose} pie={m && esGestor && <>
      <button className="btn btn--peligro" onClick={() => onRetirar(m)}>Retirar</button><button className="btn" onClick={() => onEditar(m)}>Editar</button><button className="btn btn--p" onClick={() => onStock(m)}>Ajustar stock</button></>}>
      {cargando && !m && <Cargando />}{error && <ErrorBox mensaje={error} onReintentar={recargar} />}
      {m && <>
        <div className="barra"><span className={`badge ${ESTADOS_INV[m.estado_inventario].clase}`}>{ESTADOS_INV[m.estado_inventario].texto}</span><b style={{ fontSize: '1.3rem' }}>{m.cantidad_disponible} uds</b><small>mínimo {m.stock_minimo ?? 10}</small></div>
        <Dl filas={[['Descripción', m.descripcion], ['Presentación', m.presentacion], ['Dosis', m.dosis], ['Vía', m.via_administracion], ['Caducidad', `${fmtFecha(m.fecha_caducidad)} (${m.dias_para_vencer <= 0 ? 'vencido' : `en ${m.dias_para_vencer} días`})`], ['Lote', m.lote], ['Proveedor', m.proveedor]]} />
        <div><h4>Residentes con prescripción activa ({m.residentes?.length ?? 0})</h4>
          {!m.residentes?.length ? <small>Ningún residente lo tiene prescrito.</small> : <ul className="lista" style={{ marginTop: 6 }}>{m.residentes.map((r) => (
            <li key={r.prescripcion_id}><button className="fila" onClick={() => onVerResidente(r.paciente_id)}><div><strong>{r.nombre} {r.apellido} · Hab. {r.habitacion ?? '—'}</strong><small>{r.dosis_prescrita} · {r.frecuencia}</small></div></button></li>))}</ul>}</div>
        <div><h4>Últimos movimientos</h4>
          {!m.movimientos?.length ? <small>Sin movimientos registrados.</small> : <ul className="lista" style={{ marginTop: 6 }}>{m.movimientos.map((x) => (
            <li key={x.id} className="fila"><div><strong>{x.tipo === 'administracion' ? 'Administración' : x.tipo.charAt(0).toUpperCase() + x.tipo.slice(1)}: {x.cantidad > 0 ? '+' : ''}{x.cantidad} → {x.stock_resultante}</strong><small>{fmtFechaHora(x.fecha)} · {x.usuario_nombre ?? 'sistema'}{x.motivo ? ` · ${x.motivo}` : ''}</small></div></li>))}</ul>}</div></>}
    </Drawer>
  );
}

function MedicamentoForm({ m, onClose, onGuardado }: { m: Medicamento | null; onClose: () => void; onGuardado: () => void }) {
  const toast = useToast();
  const [f, setF] = useState({ nombre: m?.nombre ?? '', descripcion: m?.descripcion ?? '', presentacion: m?.presentacion ?? '', dosis: m?.dosis ?? '', via_administracion: m?.via_administracion ?? 'Oral',
    cantidad_disponible: String(m?.cantidad_disponible ?? 0), stock_minimo: String(m?.stock_minimo ?? 10), fecha_caducidad: m?.fecha_caducidad ?? '', lote: m?.lote ?? '', proveedor: m?.proveedor ?? '' });
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState('');
  const set = (k: keyof typeof f) => (e: { target: { value: string } }) => setF((p) => ({ ...p, [k]: e.target.value }));
  const guardar = async (e: FormEvent) => {
    e.preventDefault();
    if (f.nombre.trim().length < 2) return setError('El nombre es obligatorio');
    if (!f.fecha_caducidad) return setError('La fecha de caducidad es obligatoria');
    setEnviando(true); setError('');
    try {
      if (m) { const { cantidad_disponible: _c, ...resto } = f; await api.put(`/medicamentos/${m.id}`, resto); } else await api.post('/medicamentos', f);
      toast(m ? 'Medicamento actualizado' : 'Medicamento agregado al inventario', 'success'); onGuardado(); onClose();
    } catch (err) { setError(mensajeError(err)); } finally { setEnviando(false); }
  };
  return (
    <Modal titulo={m ? `Editar ${m.nombre}` : 'Nuevo medicamento'} tam="ancho" onClose={onClose} pie={<><button className="btn" onClick={onClose}>Cancelar</button><button form="form-med" className="btn btn--p" disabled={enviando}>{enviando ? 'Guardando…' : 'Guardar'}</button></>}>
      <form id="form-med" onSubmit={guardar} className="form-grid">
        {error && <div className="alerta alerta--error ancho" role="alert">{error}</div>}
        <Campo etiqueta="Nombre" requerido><input className="input" value={f.nombre} onChange={set('nombre')} autoFocus /></Campo>
        <Campo etiqueta="Presentación"><input className="input" value={f.presentacion} onChange={set('presentacion')} placeholder="Tabletas, cápsulas…" /></Campo>
        <Campo etiqueta="Dosis"><input className="input" value={f.dosis} onChange={set('dosis')} placeholder="500mg" /></Campo>
        <Campo etiqueta="Vía de administración"><input className="input" value={f.via_administracion} onChange={set('via_administracion')} /></Campo>
        {!m && <Campo etiqueta="Cantidad inicial" requerido><input className="input" type="number" min={0} value={f.cantidad_disponible} onChange={set('cantidad_disponible')} /></Campo>}
        <Campo etiqueta="Stock mínimo" ayuda="Se alerta al llegar a este valor"><input className="input" type="number" min={0} value={f.stock_minimo} onChange={set('stock_minimo')} /></Campo>
        <Campo etiqueta="Fecha de caducidad" requerido><input className="input" type="date" value={f.fecha_caducidad} onChange={set('fecha_caducidad')} /></Campo>
        <Campo etiqueta="Lote"><input className="input" value={f.lote} onChange={set('lote')} /></Campo>
        <Campo etiqueta="Proveedor"><input className="input" value={f.proveedor} onChange={set('proveedor')} /></Campo>
        <Campo etiqueta="Descripción" ancho><input className="input" value={f.descripcion} onChange={set('descripcion')} /></Campo>
        {m && <div className="alerta alerta--info ancho">Para cambiar la cantidad usa “Ajustar stock”: así queda registrado quién y por qué.</div>}
      </form>
    </Modal>
  );
}

function StockModal({ m, onClose, onGuardado }: { m: Medicamento; onClose: () => void; onGuardado: () => void }) {
  const toast = useToast();
  const [tipo, setTipo] = useState<'entrada' | 'salida' | 'ajuste'>('entrada');
  const [cantidad, setCantidad] = useState('');
  const [motivo, setMotivo] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState('');
  const n = Number(cantidad);
  const resultado = cantidad === '' || Number.isNaN(n) ? null : tipo === 'entrada' ? m.cantidad_disponible + n : tipo === 'salida' ? m.cantidad_disponible - n : n;
  const guardar = async (e: FormEvent) => {
    e.preventDefault(); setEnviando(true); setError('');
    try { await api.post(`/medicamentos/${m.id}/stock`, { tipo, cantidad: n, motivo }); toast('Stock actualizado', 'success'); onGuardado(); onClose(); } catch (err) { setError(mensajeError(err)); } finally { setEnviando(false); }
  };
  return (
    <Modal titulo={`Ajustar stock · ${m.nombre}`} tam="chico" onClose={onClose} pie={<><button className="btn" onClick={onClose}>Cancelar</button><button form="form-stock" className="btn btn--p" disabled={enviando || cantidad === '' || (resultado ?? 0) < 0}>Guardar movimiento</button></>}>
      <form id="form-stock" onSubmit={guardar} className="form-grid">
        {error && <div className="alerta alerta--error ancho">{error}</div>}
        <Campo etiqueta="Tipo de movimiento" ancho><select className="select" value={tipo} onChange={(e) => setTipo(e.target.value as typeof tipo)}><option value="entrada">Entrada (compra / reposición)</option><option value="salida">Salida (merma, daño, traslado)</option><option value="ajuste">Ajuste a un valor exacto (conteo físico)</option></select></Campo>
        <Campo etiqueta={tipo === 'ajuste' ? 'Nuevo stock' : 'Cantidad'} requerido><input className="input" type="number" min={tipo === 'ajuste' ? 0 : 1} value={cantidad} onChange={(e) => setCantidad(e.target.value)} autoFocus /></Campo>
        <Campo etiqueta={`Motivo${tipo === 'entrada' ? ' (opcional)' : ''}`} requerido={tipo !== 'entrada'}><input className="input" value={motivo} onChange={(e) => setMotivo(e.target.value)} /></Campo>
        <div className="ancho alerta alerta--info">Stock actual: <b>{m.cantidad_disponible}</b>{resultado !== null && <> → resultado: <b style={{ color: resultado < 0 ? 'var(--rojo)' : undefined }}>{resultado}</b></>}</div>
      </form>
    </Modal>
  );
}
