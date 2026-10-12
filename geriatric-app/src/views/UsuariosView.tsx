import { FormEvent, useState } from 'react';
import { api } from '../api/client';
import { useApp } from '../context/AppContext';
import { useToast } from '../context/ToastContext';
import { IconoMas } from '../components/Icons';
import { Avatar, Buscador, Campo, Cargando, Confirmar, Drawer, Dl, ErrorBox, Modal, PageHeader, Vacio, useCarga, useDebounce } from '../components/ui';
import type { RolUsuario, Usuario } from '../types';
import { fmtFecha, mensajeError, nombreCompleto, ROLES } from '../utils/format';

export default function UsuariosView() {
  const { usuario: yo, esAdmin, tick } = useApp();
  const toast = useToast();
  const [q, setQ] = useState('');
  const dq = useDebounce(q);
  const [rol, setRol] = useState('');
  const [activo, setActivo] = useState('');
  const [sel, setSel] = useState<Usuario | null>(null);
  const [form, setForm] = useState<null | { u: Usuario | null }>(null);
  const [clave, setClave] = useState<Usuario | null>(null);
  const [toggle, setToggle] = useState<Usuario | null>(null);
  const { datos, cargando, error, recargar } = useCarga(() => api.get<Usuario[]>('/users', { q: dq, rol, activo }), [dq, rol, activo, tick]);

  return (
    <>
      <PageHeader titulo="Usuarios" descripcion={esAdmin ? 'Crea cuentas, asigna roles y restablece contraseñas. El registro público está deshabilitado.' : 'Consulta del personal (solo un administrador puede modificar cuentas).'}>
        {esAdmin && <button className="btn btn--p" onClick={() => setForm({ u: null })}><IconoMas size={15} /> Nuevo usuario</button>}
      </PageHeader>
      <div className="barra"><Buscador valor={q} onChange={setQ} placeholder="Buscar por nombre o correo…" />
        <select className="select" style={{ width: 'auto' }} value={rol} onChange={(e) => setRol(e.target.value)} aria-label="Rol"><option value="">Todos los roles</option>{Object.entries(ROLES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>
        <select className="select" style={{ width: 'auto' }} value={activo} onChange={(e) => setActivo(e.target.value)} aria-label="Estado"><option value="">Todos</option><option value="true">Activos</option><option value="false">Inactivos</option></select></div>
      {cargando && !datos && <Cargando />}{error && <ErrorBox mensaje={error} onReintentar={recargar} />}
      {datos && !datos.length && <Vacio icono="👥" texto="No hay usuarios con esos filtros." />}
      {datos && datos.length > 0 && <div className="tabla-wrap"><table className="tabla"><thead><tr><th>Usuario</th><th>Rol</th><th>Estado</th><th>Creado</th><th /></tr></thead>
        <tbody>{datos.map((u) => (
          <tr key={u.id} className="click" onClick={() => setSel(u)}>
            <td><span className="barra"><Avatar nombre={u.nombre} apellido={u.apellido} id={u.id} sm /><span>{nombreCompleto(u)}{u.id === yo?.id && <small>Tú</small>}<small>{u.email}</small></span></span></td>
            <td><span className="badge badge--info">{ROLES[u.rol]}</span></td><td>{u.activo ? <span className="badge badge--ok">Activo</span> : <span className="badge badge--muted">Inactivo</span>}</td><td>{fmtFecha(u.fecha_creacion)}</td>
            <td className="acc"><button className="btn btn--sm" onClick={(e) => { e.stopPropagation(); setSel(u); }}>Ver</button>
              {esAdmin && <> <button className="btn btn--sm" onClick={(e) => { e.stopPropagation(); setForm({ u }); }}>Editar</button></>}</td></tr>))}</tbody></table></div>}

      {sel && <Drawer titulo={nombreCompleto(sel)} onClose={() => setSel(null)} pie={esAdmin && <>
        <button className="btn" onClick={() => { setClave(sel); }}>Restablecer contraseña</button>
        {sel.id !== yo?.id && <button className={`btn ${sel.activo ? 'btn--peligro' : 'btn--ok'}`} onClick={() => setToggle(sel)}>{sel.activo ? 'Desactivar' : 'Reactivar'}</button>}
        <button className="btn btn--p" onClick={() => { setForm({ u: sel }); }}>Editar</button></>}>
        <Dl filas={[['Correo', sel.email], ['Rol', ROLES[sel.rol]], ['Estado', sel.activo ? 'Activo' : 'Inactivo'], ['Creado', fmtFecha(sel.fecha_creacion)]]} />
      </Drawer>}
      {form && <UsuarioForm u={form.u} onClose={() => setForm(null)} onGuardado={() => { setSel(null); recargar(); }} />}
      {clave && <ClaveModal u={clave} onClose={() => setClave(null)} />}
      {toggle && <Confirmar titulo={toggle.activo ? 'Desactivar usuario' : 'Reactivar usuario'} peligro={toggle.activo} textoAceptar={toggle.activo ? 'Desactivar' : 'Reactivar'}
        mensaje={toggle.activo ? <>{nombreCompleto(toggle)} ya no podrá iniciar sesión. Sus registros históricos se conservan.</> : <>{nombreCompleto(toggle)} podrá volver a iniciar sesión.</>} onCancelar={() => setToggle(null)}
        onAceptar={async () => { if (toggle.activo) await api.del(`/users/${toggle.id}`); else await api.post(`/users/${toggle.id}/reactivate`); toast(toggle.activo ? 'Usuario desactivado' : 'Usuario reactivado', 'success'); setToggle(null); setSel(null); recargar(); }} />}
    </>
  );
}

function UsuarioForm({ u, onClose, onGuardado }: { u: Usuario | null; onClose: () => void; onGuardado: () => void }) {
  const toast = useToast();
  const [f, setF] = useState({ nombre: u?.nombre ?? '', apellido: u?.apellido ?? '', email: u?.email ?? '', rol: (u?.rol ?? 'enfermera') as RolUsuario, password: '' });
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState('');
  const guardar = async (e: FormEvent) => {
    e.preventDefault(); setEnviando(true); setError('');
    try {
      if (u) { const { password: _p, ...resto } = f; await api.put(`/users/${u.id}`, resto); } else await api.post('/users', f);
      toast(u ? 'Usuario actualizado' : 'Usuario creado', 'success'); onGuardado(); onClose();
    } catch (err) { setError(mensajeError(err)); } finally { setEnviando(false); }
  };
  return (
    <Modal titulo={u ? 'Editar usuario' : 'Nuevo usuario'} onClose={onClose} pie={<><button className="btn" onClick={onClose}>Cancelar</button><button form="form-user" className="btn btn--p" disabled={enviando}>{enviando ? 'Guardando…' : 'Guardar'}</button></>}>
      <form id="form-user" onSubmit={guardar} className="form-grid">
        {error && <div className="alerta alerta--error ancho">{error}</div>}
        <Campo etiqueta="Nombre" requerido><input className="input" value={f.nombre} onChange={(e) => setF({ ...f, nombre: e.target.value })} autoFocus /></Campo>
        <Campo etiqueta="Apellido"><input className="input" value={f.apellido} onChange={(e) => setF({ ...f, apellido: e.target.value })} /></Campo>
        <Campo etiqueta="Correo" requerido ancho><input className="input" type="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} /></Campo>
        <Campo etiqueta="Rol" requerido><select className="select" value={f.rol} onChange={(e) => setF({ ...f, rol: e.target.value as RolUsuario })}>{Object.entries(ROLES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></Campo>
        {!u && <Campo etiqueta="Contraseña inicial" requerido ayuda="Mínimo 6 caracteres"><input className="input" type="text" value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} autoComplete="new-password" /></Campo>}
      </form>
    </Modal>
  );
}

function ClaveModal({ u, onClose }: { u: Usuario; onClose: () => void }) {
  const toast = useToast();
  const [p, setP] = useState('');
  const [error, setError] = useState('');
  const guardar = async (e: FormEvent) => {
    e.preventDefault();
    try { await api.post(`/users/${u.id}/reset-password`, { password: p }); toast('Contraseña restablecida', 'success'); onClose(); } catch (err) { setError(mensajeError(err)); }
  };
  return (
    <Modal titulo={`Restablecer contraseña · ${u.nombre}`} tam="chico" onClose={onClose} pie={<><button className="btn" onClick={onClose}>Cancelar</button><button form="form-clave" className="btn btn--p" disabled={p.length < 6}>Restablecer</button></>}>
      <form id="form-clave" onSubmit={guardar} className="form-grid">{error && <div className="alerta alerta--error ancho">{error}</div>}
        <Campo etiqueta="Nueva contraseña" requerido ancho ayuda="Mínimo 6 caracteres"><input className="input" type="text" value={p} onChange={(e) => setP(e.target.value)} autoFocus autoComplete="new-password" /></Campo></form>
    </Modal>
  );
}
