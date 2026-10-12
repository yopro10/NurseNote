import { useState } from 'react';
import { api } from '../api/client';
import { useApp } from '../context/AppContext';
import { AccionesDosis, HistorialAdministraciones, PrescripcionesLista } from '../components/medicacion';
import PacienteSelect from '../components/PacienteSelect';
import { Cargando, ErrorBox, ExportarBotones, PageHeader, Tabs, Vacio, useCarga } from '../components/ui';
import type { Administracion } from '../types';
import { fmtFecha, fmtHora, nombreCompleto } from '../utils/format';

interface Pendientes { fecha: string; total: number; atrasadas: number; items: Administracion[] }
type Tab = 'hoy' | 'prescripciones' | 'historial';

export default function MedicamentosView() {
  const { tick } = useApp();
  const [tab, setTab] = useState<Tab>('hoy');
  const [paciente, setPaciente] = useState<number | ''>('');
  const [n, setN] = useState(0);
  const { datos, cargando, error, recargar } = useCarga(() => api.get<Pendientes>('/administraciones/pendientes', { paciente_id: paciente }), [paciente, tick, n]);

  return (
    <>
      <PageHeader titulo="Medicación" descripcion="Dosis programadas del día, prescripciones activas e historial de administraciones. Cada dosis administrada descuenta el inventario.">
        <ExportarBotones tipo="administraciones" />
      </PageHeader>
      <Tabs valor={tab} onChange={setTab} tabs={[{ id: 'hoy', label: 'Pendientes de hoy', badge: datos?.atrasadas }, { id: 'prescripciones', label: 'Prescripciones' }, { id: 'historial', label: 'Historial' }]} />

      {tab === 'hoy' && <>
        <div className="barra"><div style={{ width: 240 }}><PacienteSelect valor={paciente} onChange={setPaciente} todos="Todos los residentes" /></div>
          {datos && <span className="barra"><span className="badge badge--info">{datos.total} pendientes</span>{datos.atrasadas > 0 && <span className="badge badge--crit">{datos.atrasadas} atrasadas</span>}</span>}
          <small>Hoy, {fmtFecha(datos?.fecha)}</small></div>
        {cargando && !datos && <Cargando />}{error && <ErrorBox mensaje={error} onReintentar={recargar} />}
        {datos && !datos.items.length && <Vacio icono="✅" texto="No hay dosis pendientes. ¡Todo al día!" />}
        {datos && datos.items.length > 0 && <div className="tabla-wrap"><table className="tabla"><thead><tr><th>Hora</th><th>Residente</th><th>Medicamento</th><th>Indicaciones</th><th>Stock</th><th /></tr></thead>
          <tbody>{datos.items.map((d) => (
            <tr key={d.id} className={d.atrasada ? 'fila--crit' : ''}>
              <td><b>{fmtHora(d.horario_programado)}</b>{d.atrasada && <small style={{ color: 'var(--rojo)', fontWeight: 700 }}>Atrasada</small>}{d.horario_programado.slice(0, 10) !== datos.fecha && <small>{fmtFecha(d.horario_programado)}</small>}</td>
              <td>{nombreCompleto({ nombre: d.paciente_nombre, apellido: d.paciente_apellido })}<small>Hab. {d.habitacion ?? '—'}{d.paciente_alergias && !/^ning/i.test(d.paciente_alergias) ? ` · ⚠ ${d.paciente_alergias}` : ''}</small></td>
              <td><b>{d.medicamento_nombre}</b><small>{d.dosis_administrada} · {d.frecuencia}</small></td>
              <td><small>{d.indicaciones || '—'}</small></td>
              <td><span className={`badge ${d.stock <= (d.unidades_por_dosis ?? 1) ? 'badge--crit' : 'badge--muted'}`}>{d.stock}</span></td>
              <td className="acc"><AccionesDosis dosis={d} onHecho={() => setN((x) => x + 1)} /></td></tr>))}</tbody></table></div>}
      </>}
      {tab === 'prescripciones' && <PrescripcionesLista />}
      {tab === 'historial' && <HistorialAdministraciones />}
    </>
  );
}
