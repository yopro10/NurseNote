import { FormEvent, useState } from 'react';
import { useApp } from '../context/AppContext';
import { IconoCerrar, IconoFlecha, IconoMedicamentos, IconoNotas, IconoVitales, MarcaSIG, TrazoECG } from '../components/Icons';

const CUENTAS_DEMO = [
  { rol: 'Enfermera', email: 'maria.garcia@geriatric.com', password: 'enfermera123' },
  { rol: 'Jefe de enfermería', email: 'carlos.rodriguez@geriatric.com', password: 'jefe123' },
  { rol: 'Administrador', email: 'admin@geriatric.com', password: 'admin123' },
];

export default function LoginView() {
  const { iniciarSesion, cargando, error, limpiarError } = useApp();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const manejarEnvio = (e: FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) return;
    iniciarSesion(email, password);
  };

  return (
    <div className="login-pantalla">
      <section className="login-arte" aria-hidden="true">
        <TrazoECG className="login-arte__ecg" />
        <div className="login-arte__contenido">
          <div className="login-arte__marca">
            <MarcaSIG size={44} />
            SIG Geriátrico
          </div>
          <h2>Cada turno, cada residente, bien registrado.</h2>
          <p>
            El equipo asistencial deja sus notas, signos vitales y medicamentos en un solo lugar para que nada
            importante se pierda entre un turno y el siguiente.
          </p>
          <ul className="login-arte__lista">
            <li>
              <span className="login-arte__lista-icono">
                <IconoNotas size={20} />
              </span>
              Notas de enfermería por residente
            </li>
            <li>
              <span className="login-arte__lista-icono">
                <IconoVitales size={20} />
              </span>
              Signos vitales con alertas de estado
            </li>
            <li>
              <span className="login-arte__lista-icono">
                <IconoMedicamentos size={20} />
              </span>
              Control de medicamentos e inventario
            </li>
          </ul>
        </div>
      </section>

      <section className="login-panel">
        <form className="login-formulario" onSubmit={manejarEnvio}>
          <div className="login-formulario__encabezado">
            <h1>Inicia sesión</h1>
            <p>Ingresa con tu correo institucional para continuar.</p>
          </div>

          {error && (
            <div className="alerta alerta--error" role="alert">
              <span>{error}</span>
              <button type="button" onClick={limpiarError} aria-label="Cerrar alerta">
                <IconoCerrar size={18} />
              </button>
            </div>
          )}

          <label className="campo">
            <span>Correo institucional</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="maria.garcia@geriatric.com"
              autoComplete="username"
              required
            />
          </label>

          <label className="campo">
            <span>Contraseña</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
              required
            />
          </label>

          <button type="submit" className="boton boton--primario boton--bloque boton--grande" disabled={cargando}>
            {cargando ? 'Ingresando…' : 'Iniciar sesión'}
          </button>

          <div className="login-demo">
            <p>Cuentas de demostración</p>
            <small>Toca una para llenar el formulario.</small>
            <div className="login-demo__lista">
              {CUENTAS_DEMO.map((cuenta) => (
                <button
                  key={cuenta.email}
                  type="button"
                  className="login-demo__boton"
                  onClick={() => {
                    setEmail(cuenta.email);
                    setPassword(cuenta.password);
                    limpiarError();
                  }}
                >
                  <span>
                    <strong>{cuenta.rol}</strong>
                    <small>{cuenta.email}</small>
                  </span>
                  <IconoFlecha size={18} />
                </button>
              ))}
            </div>
            <small style={{ display: 'block', marginTop: '12px', color: 'var(--texto-3)' }}>
              ⚠️ El registro de nuevos usuarios solo está disponible para administradores.
            </small>
          </div>
        </form>
      </section>
    </div>
  );
}
