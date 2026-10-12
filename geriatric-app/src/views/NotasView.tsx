import { useEffect, useState } from 'react';
import { api } from '../api/client';
import { useApp } from '../context/AppContext';
import { NotaDetalleDrawer, NotaFormModal } from '../components/forms';
import PacienteSelect from '../components/PacienteSelect';
import { IconoMas } from '../components/Icons';
import { Buscador, Cargando, ErrorBox, ExportarBotones, PageHeader, Paginacion, Vacio, useCarga, useDebounce } from '../components/ui';
import type { Nota, Paginado } from '../types';
import { fmtFechaHora, nombreCompleto, TIPOS_NOTA } from '../utils/format';

export default function NotasView() {
  const { destino, tick } = useApp();
  const [q, setQ] = useState('');
  const dq = useDebounce(q);
  const [paciente, setPaciente] = useState<number | ''>('');
  const [tipo, setTipo] = useState('');
  const [desde, setDesde] = useState('');
  const [hasta, setHasta] = useState('');
  const [mias, setMias] = useState(false);
  const [page, setPage] = useState(1);
  const [ver, setVer] = useState<number | null>(destino.id ?? null);
  const [nueva, setNueva] = useState(false);
  const [n, setN] = useState(0);
  useEffect(() => { setPage(1); }, [dq, paciente, tipo, desde, hasta, mias]);

  const { datos, cargando, error, recargar } = useCarga(() => api.get<Paginado<Nota>>('/notas', {
    q: dq, paciente_id: paciente, tipo_nota: tipo, desde, hasta, mias: mias ? 'true' : undefined, page, limit: 15 }), [dq, paciente, tipo, desde, hasta, mias, page, tick, n]);
  const hayFiltros = !!(q || paciente || tipo || desde || hasta || mias);

  return (
    <>
      <PageHeader titulo="Notas de enfermería" descripcion="Todas las notas del hogar. Filtra por residente, tipo o fecha y abre una nota para ver su detalle.">
        <ExportarBotones tipo="notas" params={{ desde: desde || undefined, hasta: hasta || undefined, paciente_id: paciente || undefined, tipo_nota: tipo || undefined }} />
        <button className="btn btn--p" onClick={() => setNueva(true)}><IconoMas size={15} /> Nueva nota</button>
      </PageHeader>
      <div className="card">
        <div className="barra">
          <Buscador valor={q} onChange={setQ} placeholder="Buscar en el contenido…" />
          <div style={{ width: 210 }}><PacienteSelect valor={paciente} onChange={setPaciente} todos="Todos los residentes" /></div>
          <select className="select" style={{ width: 'auto' }} value={tipo} onChange={(e) => setTipo(e.target.value)} aria-label="Tipo de nota"><option value="">Todos los tipos</option>{Object.entries(TIPOS_NOTA).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>
          <input className="input" style={{ width: 140 }} type="date" value={desde} max={hasta || undefined} onChange={(e) => setDesde(e.target.value)} aria-label="Desde" />
          <input className="input" style={{ width: 140 }} type="date" value={hasta} min={desde || undefined} onChange={(e) => setHasta(e.target.value)} aria-label="Hasta" />
          <label className="chip" style={{ cursor: 'pointer' }}><input type="checkbox" checked={mias} onChange={(e) => setMias(e.target.checked)} /> Solo mías</label>
          {hayFiltros && <button className="btn btn--sm btn--g" onClick={() => { setQ(''); setPaciente(''); setTipo(''); setDesde(''); setHasta(''); setMias(false); }}>Limpiar</button>}
        </div>
      </div>
      {cargando && !datos && <Cargando />}{error && <ErrorBox mensaje={error} onReintentar={recargar} />}
      {datos && !datos.data.length && <Vacio icono="📝" texto={hayFiltros ? 'No hay notas con esos filtros.' : 'Todavía no hay notas registradas.'} accion={<button className="btn btn--p" onClick={() => setNueva(true)}>Crear la primera nota</button>} />}
      {datos && datos.data.length > 0 && <>
        <div className="tabla-wrap"><table className="tabla"><thead><tr><th>Fecha</th><th>Residente</th><th>Tipo</th><th>Contenido</th><th>Autor</th><th /></tr></thead>
          <tbody>{datos.data.map((x) => (
            <tr key={x.id} className="click" onClick={() => setVer(x.id)}>
              <td style={{ whiteSpace: 'nowrap' }}>{fmtFechaHora(x.fecha_registro)}</td>
              <td>{nombreCompleto({ nombre: x.paciente_nombre, apellido: x.paciente_apellido })}<small>Hab. {x.paciente_habitacion ?? '—'}</small></td>
              <td><span className="badge badge--info">{TIPOS_NOTA[x.tipo_nota]}</span></td>
              <td style={{ maxWidth: 420 }}><span className="clamp2">{x.contenido}</span></td>
              <td>{x.usuario_nombre} {x.usuario_apellido ?? ''}</td>
              <td className="acc"><button className="btn btn--sm" onClick={(e) => { e.stopPropagation(); setVer(x.id); }}>Ver</button></td></tr>))}</tbody></table></div>
        <Paginacion page={datos.page} paginas={datos.paginas} total={datos.total} onChange={setPage} /></>}
      {ver && <NotaDetalleDrawer id={ver} onClose={() => setVer(null)} onCambio={() => setN((x) => x + 1)} />}
      {nueva && <NotaFormModal onClose={() => setNueva(false)} onGuardado={() => setN((x) => x + 1)} />}
    </>
  );
}
