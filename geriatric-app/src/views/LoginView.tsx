import { FormEvent, useState } from 'react';
import { useApp } from '../context/AppContext';
import { mensajeError } from '../utils/format';
import { IconoFlecha, IconoMedicamentos, IconoNotas, IconoVitales, MarcaSIG } from '../components/Icons';

const DEMO = [
  { rol: 'Enfermera', email: 'maria.garcia@geriatric.com', password: 'enfermera123' },
  { rol: 'Jefe de enfermería', email: 'carlos.rodriguez@geriatric.com', password: 'jefe123' },
  { rol: 'Administrador', email: 'admin@geriatric.com', password: 'admin123' },
];

export default function LoginView() {
  const { iniciarSesion } = useApp();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);

  const enviar = async (e: FormEvent) => {
    e.preventDefault();
    setError(''); setCargando(true);
    try { await iniciarSesion(email.trim(), password); } catch (err) { setError(mensajeError(err)); } finally { setCargando(false); }
  };

  return (
    <div className="login">
      <section className="login__arte" aria-hidden="true">
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', fontFamily: 'var(--fuente-display)', fontSize: '1.3rem' }}><MarcaSIG size={38} /> NurseNote</div>
        <h2>Cada turno, cada residente, bien registrado.</h2>
        <p>El equipo asistencial deja sus notas, signos vitales y medicación en un solo lugar para que nada importante se pierda entre un turno y el siguiente.</p>
        <ul>
          <li><IconoNotas size={18} /> Notas de enfermería por residente</li>
          <li><IconoVitales size={18} /> Signos vitales con alertas y estado calculado</li>
          <li><IconoMedicamentos size={18} /> Medicación, inventario y entrega de turno</li>
        </ul>
      </section>
      <section className="login__panel">
        <form className="login__form" onSubmit={enviar}>
          <div><h1>Inicia sesión</h1><p style={{ color: 'var(--texto3)' }}>Ingresa con tu correo institucional.</p></div>
          {error && <div className="alerta alerta--error" role="alert">{error}</div>}
          <label className="campo"><span>Correo institucional</span>
            <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="username" required autoFocus /></label>
          <label className="campo"><span>Contraseña</span>
            <input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" required /></label>
          <button className="btn btn--p btn--bloque" disabled={cargando}>{cargando ? 'Ingresando…' : 'Iniciar sesión'}</button>
          <div className="login__demo">
            <small>Cuentas de demostración (toca una para llenar el formulario):</small>
            {DEMO.map((c) => (
              <button key={c.email} type="button" onClick={() => { setEmail(c.email); setPassword(c.password); setError(''); }}>
                <span><strong>{c.rol}</strong><br /><small>{c.email}</small></span><IconoFlecha size={16} />
              </button>
            ))}
          </div>
          <small>El registro de cuentas nuevas lo realiza un administrador desde la sección Usuarios.</small>
        </form>
      </section>
    </div>
  );
}
