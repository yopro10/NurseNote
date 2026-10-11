import { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { IconoPacientes, IconoCerrar } from '../components/Icons';

interface UsuarioConRol {
  id: number;
  nombre: string;
  apellido?: string;
  email: string;
  rol: string;
  fecha_creacion: string;
  activo: boolean;
}

export default function UsuariosView() {
  const { usuarioActual } = useApp();
  const [usuarios, setUsuarios] = useState<UsuarioConRol[]>([]);
  const [cargando, setCargando] = useState(true);
  const [filtroRol, setFiltroRol] = useState<string>('todos');
  const [mostrarModalCrear, setMostrarModalCrear] = useState(false);
  const [mostrarModalEditar, setMostrarModalEditar] = useState(false);
  const [usuarioSeleccionado, setUsuarioSeleccionado] = useState<UsuarioConRol | null>(null);
  const [formulario, setFormulario] = useState({
    nombre: '',
    apellido: '',
    email: '',
    password: '',
    rol: 'enfermera'
  });

  useEffect(() => {
    cargarUsuarios();
  }, []);

  const cargarUsuarios = async () => {
    try {
      const response = await fetch('http://localhost:3000/api/users', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      });
      const data = await response.json();
      setUsuarios(data);
    } catch (error) {
      console.error('Error al cargar usuarios:', error);
    } finally {
      setCargando(false);
    }
  };

  const crearUsuario = async () => {
    try {
      const response = await fetch('http://localhost:3000/api/users', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formulario)
      });

      if (response.ok) {
        alert('Usuario creado exitosamente');
        setMostrarModalCrear(false);
        setFormulario({ nombre: '', apellido: '', email: '', password: '', rol: 'enfermera' });
        cargarUsuarios();
      } else {
        alert('Error al crear usuario');
      }
    } catch (error) {
      console.error('Error al crear usuario:', error);
      alert('Error al crear usuario');
    }
  };

  const actualizarUsuario = async () => {
    if (!usuarioSeleccionado) return;

    try {
      const response = await fetch(`http://localhost:3000/api/users/${usuarioSeleccionado.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          nombre: formulario.nombre,
          apellido: formulario.apellido,
          email: formulario.email,
          rol: formulario.rol
        })
      });

      if (response.ok) {
        alert('Usuario actualizado exitosamente');
        setMostrarModalEditar(false);
        setUsuarioSeleccionado(null);
        setFormulario({ nombre: '', apellido: '', email: '', password: '', rol: 'enfermera' });
        cargarUsuarios();
      } else {
        alert('Error al actualizar usuario');
      }
    } catch (error) {
      console.error('Error al actualizar usuario:', error);
      alert('Error al actualizar usuario');
    }
  };

  const desactivarUsuario = async (id: number) => {
    if (!confirm('¿Estás seguro de desactivar este usuario?')) return;

    try {
      const response = await fetch(`http://localhost:3000/api/users/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      });

      if (response.ok) {
        alert('Usuario desactivado exitosamente');
        cargarUsuarios();
      } else {
        alert('Error al desactivar usuario');
      }
    } catch (error) {
      console.error('Error al desactivar usuario:', error);
      alert('Error al desactivar usuario');
    }
  };

  const reactivarUsuario = async (id: number) => {
    try {
      const response = await fetch(`http://localhost:3000/api/users/${id}/reactivate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      });

      if (response.ok) {
        alert('Usuario reactivado exitosamente');
        cargarUsuarios();
      } else {
        alert('Error al reactivar usuario');
      }
    } catch (error) {
      console.error('Error al reactivar usuario:', error);
      alert('Error al reactivar usuario');
    }
  };

  const restablecerPassword = async (id: number) => {
    const nuevaPassword = prompt('Ingrese la nueva contraseña (mínimo 6 caracteres):');
    if (!nuevaPassword || nuevaPassword.length < 6) {
      alert('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    try {
      const response = await fetch(`http://localhost:3000/api/users/${id}/reset-password`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ newPassword: nuevaPassword })
      });

      if (response.ok) {
        alert('Contraseña restablecida exitosamente');
      } else {
        alert('Error al restablecer contraseña');
      }
    } catch (error) {
      console.error('Error al restablecer contraseña:', error);
      alert('Error al restablecer contraseña');
    }
  };

  const abrirModalEditar = (usuario: UsuarioConRol) => {
    setUsuarioSeleccionado(usuario);
    setFormulario({
      nombre: usuario.nombre,
      apellido: usuario.apellido || '',
      email: usuario.email,
      password: '',
      rol: usuario.rol
    });
    setMostrarModalEditar(true);
  };

  const usuariosFiltrados = filtroRol === 'todos'
    ? usuarios
    : usuarios.filter(u => u.rol === filtroRol);

  const contadorPorRol = {
    total: usuarios.length,
    administrador: usuarios.filter(u => u.rol === 'administrador').length,
    jefe_enfermeria: usuarios.filter(u => u.rol === 'jefe_enfermeria').length,
    enfermera: usuarios.filter(u => u.rol === 'enfermera').length
  };

  if (cargando) {
    return (
      <div className="cargando-bloque">
        <div className="spinner"></div>
        <p>Cargando usuarios...</p>
      </div>
    );
  }

  return (
    <div className="usuarios-vista">
      <div className="pagina-cabecera">
        <h2>Gestión de Usuarios</h2>
        <p>Administra el personal del hogar geriátrico</p>
      </div>

      <div className="resumen">
        <div className="tarjeta-resumen">
          <span className="tarjeta-resumen__icono">
            <IconoPacientes size={26} />
          </span>
          <div>
            <span className="tarjeta-resumen__valor">{contadorPorRol.total}</span>
            <span className="tarjeta-resumen__etiqueta">Total Usuarios</span>
          </div>
        </div>
        <div className="tarjeta-resumen tarjeta-resumen--estable">
          <span className="tarjeta-resumen__icono">
            <IconoPacientes size={26} />
          </span>
          <div>
            <span className="tarjeta-resumen__valor">{contadorPorRol.administrador}</span>
            <span className="tarjeta-resumen__etiqueta">Administradores</span>
          </div>
        </div>
        <div className="tarjeta-resumen tarjeta-resumen--observacion">
          <span className="tarjeta-resumen__icono">
            <IconoPacientes size={26} />
          </span>
          <div>
            <span className="tarjeta-resumen__valor">{contadorPorRol.jefe_enfermeria}</span>
            <span className="tarjeta-resumen__etiqueta">Jefes Enfermería</span>
          </div>
        </div>
        <div className="tarjeta-resumen tarjeta-resumen--critico">
          <span className="tarjeta-resumen__icono">
            <IconoPacientes size={26} />
          </span>
          <div>
            <span className="tarjeta-resumen__valor">{contadorPorRol.enfermera}</span>
            <span className="tarjeta-resumen__etiqueta">Enfermeras</span>
          </div>
        </div>
      </div>

      <div className="barra-herramientas">
        <div className="chips">
          <button
            className={`chip ${filtroRol === 'todos' ? 'chip--activo' : ''}`}
            onClick={() => setFiltroRol('todos')}
          >
            Todos
            <span className="chip__cuenta">{contadorPorRol.total}</span>
          </button>
          <button
            className={`chip ${filtroRol === 'administrador' ? 'chip--activo' : ''}`}
            onClick={() => setFiltroRol('administrador')}
          >
            Administradores
            <span className="chip__cuenta">{contadorPorRol.administrador}</span>
          </button>
          <button
            className={`chip ${filtroRol === 'jefe_enfermeria' ? 'chip--activo' : ''}`}
            onClick={() => setFiltroRol('jefe_enfermeria')}
          >
            Jefes Enfermería
            <span className="chip__cuenta">{contadorPorRol.jefe_enfermeria}</span>
          </button>
          <button
            className={`chip ${filtroRol === 'enfermera' ? 'chip--activo' : ''}`}
            onClick={() => setFiltroRol('enfermera')}
          >
            Enfermeras
            <span className="chip__cuenta">{contadorPorRol.enfermera}</span>
          </button>
        </div>
        {usuarioActual?.rol === 'administrador' && (
          <button className="boton boton--primario" onClick={() => setMostrarModalCrear(true)}>
            Crear Usuario
          </button>
        )}
      </div>

      <div className="tabla-contenedor">
        <table className="tabla">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Email</th>
              <th>Rol</th>
              <th>Estado</th>
              <th>Fecha de Creación</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {usuariosFiltrados.map((usuario) => (
              <tr key={usuario.id}>
                <td>
                  <div className="tabla__paciente">
                    <strong>{usuario.nombre} {usuario.apellido || ''}</strong>
                  </div>
                </td>
                <td>{usuario.email}</td>
                <td>
                  <span className={`badge badge--${usuario.rol === 'administrador' ? 'rojo' : usuario.rol === 'jefe_enfermeria' ? 'ambar' : 'verde'}`}>
                    {usuario.rol.replace('_', ' ')}
                  </span>
                </td>
                <td>
                  <span className={`badge badge--${usuario.activo ? 'verde' : 'rojo'}`}>
                    {usuario.activo ? 'Activo' : 'Inactivo'}
                  </span>
                </td>
                <td>{new Date(usuario.fecha_creacion).toLocaleDateString('es-ES')}</td>
                <td>
                  <div className="tabla__acciones">
                    {usuarioActual?.rol === 'administrador' && (
                      <>
                        <button
                          className="boton boton--pequeno boton--fantasma"
                          onClick={() => abrirModalEditar(usuario)}
                          title="Editar"
                        >
                          Editar
                        </button>
                        {usuario.activo ? (
                          <button
                            className="boton boton--pequeno boton--fantasma"
                            onClick={() => desactivarUsuario(usuario.id)}
                            title="Desactivar"
                          >
                            Desactivar
                          </button>
                        ) : (
                          <button
                            className="boton boton--pequeno boton--fantasma"
                            onClick={() => reactivarUsuario(usuario.id)}
                            title="Reactivar"
                          >
                            Reactivar
                          </button>
                        )}
                        <button
                          className="boton boton--pequeno boton--fantasma"
                          onClick={() => restablecerPassword(usuario.id)}
                          title="Restablecer contraseña"
                        >
                          Reset Password
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal Crear Usuario */}
      {mostrarModalCrear && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal__cabecera">
              <h3>Crear Nuevo Usuario</h3>
              <button onClick={() => setMostrarModalCrear(false)} className="boton boton--fantasma">
                <IconoCerrar size={20} />
              </button>
            </div>
            <div className="modal__cuerpo">
              <label className="campo">
                <span>Nombre</span>
                <input
                  type="text"
                  value={formulario.nombre}
                  onChange={(e) => setFormulario({ ...formulario, nombre: e.target.value })}
                  required
                />
              </label>
              <label className="campo">
                <span>Apellido</span>
                <input
                  type="text"
                  value={formulario.apellido}
                  onChange={(e) => setFormulario({ ...formulario, apellido: e.target.value })}
                />
              </label>
              <label className="campo">
                <span>Email</span>
                <input
                  type="email"
                  value={formulario.email}
                  onChange={(e) => setFormulario({ ...formulario, email: e.target.value })}
                  required
                />
              </label>
              <label className="campo">
                <span>Contraseña</span>
                <input
                  type="password"
                  value={formulario.password}
                  onChange={(e) => setFormulario({ ...formulario, password: e.target.value })}
                  required
                  minLength={6}
                />
              </label>
              <label className="campo">
                <span>Rol</span>
                <select
                  value={formulario.rol}
                  onChange={(e) => setFormulario({ ...formulario, rol: e.target.value })}
                >
                  <option value="enfermera">Enfermera</option>
                  <option value="jefe_enfermeria">Jefe de Enfermería</option>
                  <option value="administrador">Administrador</option>
                </select>
              </label>
            </div>
            <div className="modal__pie">
              <button onClick={() => setMostrarModalCrear(false)} className="boton boton--fantasma">
                Cancelar
              </button>
              <button onClick={crearUsuario} className="boton boton--primario">
                Crear Usuario
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Editar Usuario */}
      {mostrarModalEditar && usuarioSeleccionado && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal__cabecera">
              <h3>Editar Usuario</h3>
              <button onClick={() => setMostrarModalEditar(false)} className="boton boton--fantasma">
                <IconoCerrar size={20} />
              </button>
            </div>
            <div className="modal__cuerpo">
              <label className="campo">
                <span>Nombre</span>
                <input
                  type="text"
                  value={formulario.nombre}
                  onChange={(e) => setFormulario({ ...formulario, nombre: e.target.value })}
                  required
                />
              </label>
              <label className="campo">
                <span>Apellido</span>
                <input
                  type="text"
                  value={formulario.apellido}
                  onChange={(e) => setFormulario({ ...formulario, apellido: e.target.value })}
                />
              </label>
              <label className="campo">
                <span>Email</span>
                <input
                  type="email"
                  value={formulario.email}
                  onChange={(e) => setFormulario({ ...formulario, email: e.target.value })}
                  required
                />
              </label>
              <label className="campo">
                <span>Rol</span>
                <select
                  value={formulario.rol}
                  onChange={(e) => setFormulario({ ...formulario, rol: e.target.value })}
                >
                  <option value="enfermera">Enfermera</option>
                  <option value="jefe_enfermeria">Jefe de Enfermería</option>
                  <option value="administrador">Administrador</option>
                </select>
              </label>
            </div>
            <div className="modal__pie">
              <button onClick={() => setMostrarModalEditar(false)} className="boton boton--fantasma">
                Cancelar
              </button>
              <button onClick={actualizarUsuario} className="boton boton--primario">
                Guardar Cambios
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
