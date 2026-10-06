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
}

export default function UsuariosView() {
  const [usuarios, setUsuarios] = useState<UsuarioConRol[]>([]);
  const [cargando, setCargando] = useState(true);
  const [filtroRol, setFiltroRol] = useState<string>('todos');

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
      </div>

      <div className="tabla-contenedor">
        <table className="tabla">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Email</th>
              <th>Rol</th>
              <th>Fecha de Creación</th>
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
                <td>{new Date(usuario.fecha_creacion).toLocaleDateString('es-ES')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
