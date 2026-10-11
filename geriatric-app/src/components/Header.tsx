import { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { useAccesibilidad } from '../context/AccesibilidadContext';
import type { VistaApp } from '../types';
import BusquedaGlobal from './BusquedaGlobal';
import { IconoBuscar } from './Icons';

const TITULOS_VISTA: Record<VistaApp, string> = {
  login: 'Iniciar sesión',
  dashboard: 'Panel principal',
  notas_enfermeria: 'Notas de enfermería',
  signos_vitales: 'Signos vitales',
  medicamentos: 'Medicamentos',
  gestion_pacientes: 'Residentes',
  estadisticas: 'Estadísticas',
  inventario_medicamentos: 'Inventario',
  registro: 'Registro clínico',
  usuarios: 'Gestión de Usuarios',
  ficha_residente: 'Ficha del Residente',
};

const ROLES: Record<string, string> = {
  administrador: 'Administrador',
  enfermera: 'Enfermera',
  jefe_enfermeria: 'Jefe de enfermería',
};

const getIniciales = (nombre: string, apellido?: string) =>
  `${nombre[0]}${apellido?.[0] || ''}`.toUpperCase();

const formatearRol = (rol: string) => ROLES[rol] || rol;

export default function Header() {
  const { usuarioActual, metricas, vista, cerrarSesion, moduloSeleccionado } = useApp();
  const { tamanoLetra, cambiarTamanoLetra } = useAccesibilidad();
  const [perfilAbierto, setPerfilAbierto] = useState(false);
  const [busquedaAbierta, setBusquedaAbierta] = useState(false);

  // Atajo de teclado para búsqueda global
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setBusquedaAbierta(true);
      }
      if (e.key === 'Escape' && busquedaAbierta) {
        setBusquedaAbierta(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [busquedaAbierta]);

  if (!usuarioActual) return null;

  const iniciales = getIniciales(usuarioActual.nombre, usuarioActual.apellido);
  const nombreCompleto = `${usuarioActual.nombre} ${usuarioActual.apellido || ''}`.trim();

  return (
    <header className="header">
      <div className="header__titulo">
        <h1>{vista === 'registro' && moduloSeleccionado ? TITULOS_VISTA[moduloSeleccionado === 'evolucion' ? 'notas_enfermeria' : moduloSeleccionado === 'medicacion' ? 'medicamentos' : 'signos_vitales'] : TITULOS_VISTA[vista] || 'SIG Geriátrico'}</h1>
        <p>
          {new Date().toLocaleDateString('es-CO', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          })}
        </p>
      </div>

      <div className="header__derecha">
        {/* Botón de búsqueda global */}
        <button
          className="boton boton--fantasma"
          onClick={() => setBusquedaAbierta(true)}
          aria-label="Búsqueda global"
          title="Búsqueda global (Ctrl+K)"
        >
          <IconoBuscar size={20} />
        </button>

        {/* Selector de tamaño de letra */}
        <div className="header__accesibilidad">
          <select
            value={tamanoLetra}
            onChange={(e) => cambiarTamanoLetra(e.target.value as 'normal' | 'grande' | 'muy-grande')}
            className="boton boton--pequeno"
            aria-label="Tamaño de letra"
          >
            <option value="normal">A</option>
            <option value="grande">A+</option>
            <option value="muy-grande">A++</option>
          </select>
        </div>

        {metricas && vista !== 'dashboard' && (
          <div className="header__metricas" aria-label="Resumen del día">
            <div className="metrica">
              <span className="metrica__punto" />
              <span className="metrica__valor">{metricas.totalPacientes}</span>
              <span className="metrica__etiqueta">residentes</span>
            </div>
            <div className="metrica metrica--alerta">
              <span className="metrica__punto" />
              <span className="metrica__valor">{metricas.pacientesCriticos}</span>
              <span className="metrica__etiqueta">críticos</span>
            </div>
            <div className="metrica">
              <span className="metrica__punto" />
              <span className="metrica__valor">{metricas.registrosHoy}</span>
              <span className="metrica__etiqueta">registros hoy</span>
            </div>
          </div>
        )}

        <div className="header__perfil">
          <button
            type="button"
            className="header__perfil-boton"
            onClick={() => setPerfilAbierto((v) => !v)}
            aria-expanded={perfilAbierto}
            aria-haspopup="menu"
          >
            <span className="avatar avatar--marca">{iniciales}</span>
            <span className="header__perfil-info">
              <strong>{nombreCompleto}</strong>
              <small>{formatearRol(usuarioActual.rol)}</small>
            </span>
          </button>

          {perfilAbierto && (
            <>
              <div className="overlay-click" onClick={() => setPerfilAbierto(false)} />
              <div className="header__perfil-menu" role="menu">
                <div className="header__perfil-menu-cabecera">
                  <span className="avatar avatar--grande avatar--marca">{iniciales}</span>
                  <div>
                    <strong>{nombreCompleto}</strong>
                    <small>{usuarioActual.email}</small>
                  </div>
                </div>

                <dl className="header__perfil-datos">
                  <div>
                    <dt>Rol</dt>
                    <dd>{formatearRol(usuarioActual.rol)}</dd>
                  </div>
                  <div>
                    <dt>Fecha de registro</dt>
                    <dd>{new Date(usuarioActual.fecha_creacion).toLocaleDateString('es-CO')}</dd>
                  </div>
                </dl>

                <button type="button" className="boton boton--oscuro boton--bloque" onClick={cerrarSesion}>
                  Cerrar sesión
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {busquedaAbierta && <BusquedaGlobal onClose={() => setBusquedaAbierta(false)} />}
    </header>
  );
}
