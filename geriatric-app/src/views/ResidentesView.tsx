import { useEffect, useMemo, useState } from 'react';
import { api } from '../api/client';
import { useApp } from '../context/AppContext';
import { useToast } from '../context/ToastContext';
import { ResidenteFormModal } from '../components/forms';
import { IconoAlerta, IconoMas } from '../components/Icons';
import { Avatar, Buscador, Chips, Confirmar, EstadoBadge, ErrorBox, ExportarBotones, PageHeader, Cargando, Vacio, useCarga } from '../components/ui';
import type { EstadoPaciente, Paciente } from '../types';
import { calcularEdad, CLASE_RES, fmtFecha, mensajeError, nombreCompleto } from '../utils/format';

export default function ResidentesView() {
  const { pacientes, ir, esGestor, refrescar, tick } = useApp();
  const toast = useToast();
  const [q, setQ] = useState('');
  const [filtro, setFiltro] = useState<'todos' | EstadoPaciente>('todos');
  const [verEgresados, setVerEgresados] = useState(false);
  const [modal, setModal] = useState<null | { paciente: Paciente | null }>(null);
  const [egresando, setEgresando] = useState<Paciente | null>(null);
  const [reingresando, setReingresando] = useState<Paciente | null>(null);
  const egresados = useCarga(() => (verEgresados ? api.get<Paciente[]>('/pacientes', { egresados: 'true' }) : Promise.resolve([] as Paciente[])), [verEgresados, tick]);

  useEffect(() => { setFiltro('todos'); }, [verEgresados]);
  const base = verEgresados ? egresados.datos ?? [] : pacientes;
  const norm = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  const filtrados = useMemo(() => base.filter((p) =>
    (filtro === 'todos' || p.estado_calculado === filtro) && (!q || norm(`${nombreCompleto(p)} ${p.habitacion ?? ''} ${p.documento ?? ''}`).includes(norm(q)))), [base, q, filtro]);
  const cuenta = (e: EstadoPaciente) => base.filter((p) => p.estado_calculado === e).length;

  return (
    <>
      <PageHeader titulo="Residentes" descripcion="Consulta la ficha completa de cada residente. El estado se calcula a partir de sus signos vitales.">
        <ExportarBotones tipo="residentes" />
        {esGestor && <button className="btn btn--p" onClick={() => setModal({ paciente: null })}><IconoMas size={15} /> Nuevo residente</button>}
      </PageHeader>
      <div className="barra">
        <Buscador valor={q} onChange={setQ} placeholder="Buscar por nombre, habitación o documento…" />
        {!verEgresados && <Chips valor={filtro} onChange={setFiltro} opciones={[
          { id: 'todos', etiqueta: 'Todos', cuenta: base.length }, { id: 'Estable', etiqueta: 'Estables', cuenta: cuenta('Estable') },
          { id: 'En Observación', etiqueta: 'En observación', cuenta: cuenta('En Observación') }, { id: 'Crítico', etiqueta: 'Críticos', cuenta: cuenta('Crítico') }]} />}
        <span className="espacio" />
        {esGestor && <button className={`chip ${verEgresados ? 'chip--on' : ''}`} onClick={() => setVerEgresados((v) => !v)}>{verEgresados ? '← Volver a residentes activos' : 'Ver egresados'}</button>}
      </div>

      {verEgresados && egresados.cargando && <Cargando />}
      {verEgresados && egresados.error && <ErrorBox mensaje={egresados.error} onReintentar={egresados.recargar} />}
      {!filtrados.length && !(verEgresados && egresados.cargando) ? (
        <Vacio icono="🔎" texto={q ? `No hay residentes que coincidan con “${q}”.` : verEgresados ? 'No hay residentes egresados.' : 'No hay residentes con este estado.'} />
      ) : (
        <ul className="residentes">
          {filtrados.map((p) => (
            <li key={p.id} className={`res ${CLASE_RES[p.estado_calculado] ?? ''}`}>
              <div className="res__cab"><Avatar nombre={p.nombre} apellido={p.apellido} id={p.id} />
                <div><strong>{nombreCompleto(p)}</strong><small>Hab. {p.habitacion ?? '—'} · {calcularEdad(p.fecha_nacimiento) ?? '—'} años</small></div></div>
              <p className="res__dx" title={p.enfermedades_cronicas ?? ''}>{p.enfermedades_cronicas || 'Sin diagnóstico registrado'}</p>
              <div className="res__pie">
                {verEgresados ? <span className="badge badge--muted">Egresó {fmtFecha(p.fecha_egreso)}</span> : <EstadoBadge estado={p.estado_calculado} />}
                {p.alergias && !/^ning/i.test(p.alergias) && <span className="badge badge--crit" title={`Alergias: ${p.alergias}`}><IconoAlerta size={11} /> Alergia</span>}
              </div>
              <div className="res__acc">
                <button className="btn btn--sm btn--p" style={{ flex: 1 }} onClick={() => ir('ficha', { pacienteId: p.id })}>Ver ficha</button>
                {esGestor && !verEgresados && <>
                  <button className="btn btn--sm" onClick={() => setModal({ paciente: p })}>Editar</button>
                  <button className="btn btn--sm" onClick={() => setEgresando(p)}>Egresar</button></>}
                {esGestor && verEgresados && <button className="btn btn--sm" onClick={() => setReingresando(p)}>Reingresar</button>}
              </div>
            </li>))}
        </ul>)}

      {modal && <ResidenteFormModal paciente={modal.paciente} onClose={() => setModal(null)} onGuardado={() => {}} />}
      {egresando && <Confirmar titulo="Egresar residente" peligro pedirMotivo etiquetaMotivo="Motivo del egreso" textoAceptar="Egresar"
        mensaje={<>¿Egresar a <b>{nombreCompleto(egresando)}</b>? Se suspenderán sus prescripciones y se cancelarán sus dosis futuras. Podrás reingresarlo después.</>}
        onCancelar={() => setEgresando(null)}
        onAceptar={async (motivo) => { try { await api.del(`/pacientes/${egresando.id}`, { motivo }); toast('Residente egresado', 'success'); setEgresando(null); refrescar(); } catch (e) { toast(mensajeError(e), 'error'); } }} />}
      {reingresando && <Confirmar titulo="Reingresar residente" textoAceptar="Reingresar"
        mensaje={<>¿Reingresar a <b>{nombreCompleto(reingresando)}</b> al hogar? Volverá a la lista de residentes activos con estado Estable.</>}
        onCancelar={() => setReingresando(null)}
        onAceptar={async () => { await api.post(`/pacientes/${reingresando.id}/reingresar`); toast('Residente reingresado', 'success'); setReingresando(null); refrescar(); }} />}
    </>
  );
}
