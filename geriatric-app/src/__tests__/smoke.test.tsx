/**
 * Prueba de humo de la interfaz: recorre cada sección y botón principal contra el backend real.
 * Requiere el backend en http://localhost:3000 con la base de demostración. Ejecutar: npm run test:ui
 */
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import App from '../App';
import { AccesibilidadProvider } from '../context/AccesibilidadContext';
import { AppProvider } from '../context/AppContext';
import { ToastProvider } from '../context/ToastContext';

beforeAll(() => {
  // jsdom no trae estas APIs que usan las gráficas y las descargas
  (globalThis as any).ResizeObserver = class { observe() {} unobserve() {} disconnect() {} };
  URL.createObjectURL = vi.fn(() => 'blob:test');
  URL.revokeObjectURL = vi.fn();
  HTMLAnchorElement.prototype.click = vi.fn();
  Element.prototype.scrollTo = vi.fn() as any;
});
afterEach(() => cleanup());

const montar = () => render(<AccesibilidadProvider><ToastProvider><AppProvider><App /></AppProvider></ToastProvider></AccesibilidadProvider>);
const esperar = (fn: () => void) => waitFor(fn, { timeout: 15000 });
const nav = async (nombre: RegExp) => { await userEvent.click(screen.getByRole('button', { name: nombre })); };

async function entrar(email: string, pass: string) {
  localStorage.clear();
  montar();
  await userEvent.type(await screen.findByLabelText(/Correo institucional/i), email);
  await userEvent.type(screen.getByLabelText(/Contraseña/i), pass);
  await userEvent.click(screen.getByRole('button', { name: /^Iniciar sesión$/i }));
  await esperar(() => expect(screen.getByRole('navigation', { name: /principal/i })).toBeTruthy());
}

describe('Interfaz NurseNote', () => {
  it('login: rechaza credenciales malas y no ofrece registro público', async () => {
    localStorage.clear();
    montar();
    expect(screen.queryByText(/crear cuenta|regístrate/i)).toBeNull();
    await userEvent.type(await screen.findByLabelText(/Correo institucional/i), 'admin@geriatric.com');
    await userEvent.type(screen.getByLabelText(/Contraseña/i), 'incorrecta');
    await userEvent.click(screen.getByRole('button', { name: /^Iniciar sesión$/i }));
    await esperar(() => expect(screen.getByRole('alert').textContent).toMatch(/inválidas/i));
  });

  it('enfermera: recorre todas las secciones sin errores', async () => {
    await entrar('maria.garcia@geriatric.com', 'enfermera123');
    // Dashboard con datos reales
    await esperar(() => expect(screen.getByText(/Residentes activos/i)).toBeTruthy());
    expect(screen.getByText(/Próximas dosis de hoy/i)).toBeTruthy();
    expect(screen.queryByRole('button', { name: /^Usuarios$/ })).toBeNull(); // la enfermera no ve Usuarios

    // Residentes: tarjetas + filtros + ficha
    await nav(/^Residentes$/);
    await esperar(() => expect(screen.getAllByRole('button', { name: /Ver ficha/i }).length).toBeGreaterThan(15));
    await userEvent.click(screen.getByRole('button', { name: /^Críticos/ }));
    await userEvent.click(screen.getByRole('button', { name: /^Todos/ }));
    await userEvent.type(screen.getByPlaceholderText(/Buscar por nombre/i), 'zzzz');
    await esperar(() => expect(screen.getByText(/No hay residentes que coincidan/i)).toBeTruthy());
    await userEvent.clear(screen.getByPlaceholderText(/Buscar por nombre/i));
    await userEvent.click(screen.getAllByRole('button', { name: /Ver ficha/i })[0]);
    await esperar(() => expect(screen.getByRole('tab', { name: 'Resumen' })).toBeTruthy());
    for (const t of ['Notas', 'Signos vitales', 'Medicación', 'Historial de estado']) {
      await userEvent.click(screen.getByRole('tab', { name: new RegExp(t) }));
      await esperar(() => expect(screen.queryByRole('status')).toBeNull());
    }
    expect(screen.queryByText(/Error|inesperado/i)).toBeNull();

    // Notas: tabla, detalle en panel, nueva nota
    await nav(/^Notas de enfermería$/);
    await esperar(() => expect(screen.getAllByRole('button', { name: /^Ver$/ }).length).toBeGreaterThan(5));
    await userEvent.click(screen.getAllByRole('button', { name: /^Ver$/ })[0]);
    const panel = await screen.findByRole('dialog');
    expect(within(panel).getByText(/Contenido/i)).toBeTruthy();
    await userEvent.click(within(panel).getByRole('button', { name: /Cerrar panel/i }));
    await userEvent.click(screen.getByRole('button', { name: /Nueva nota/i }));
    const modal = await screen.findByRole('dialog');
    await userEvent.click(within(modal).getByRole('button', { name: /Guardar nota/i }));
    await esperar(() => expect(within(modal).getByRole('alert').textContent).toMatch(/residente/i));
    const sel = within(modal).getByLabelText('Residente') as HTMLSelectElement;
    await userEvent.selectOptions(sel, sel.options[1].value);
    await userEvent.type(within(modal).getByPlaceholderText(/Describe el estado/i), 'Nota de prueba automática de interfaz');
    await userEvent.click(within(modal).getByRole('button', { name: /Guardar nota/i }));
    await esperar(() => expect(screen.queryByRole('dialog')).toBeNull());

    // Signos vitales: resumen, panel y registro con alertas en vivo
    await nav(/^Signos vitales$/);
    await esperar(() => expect(screen.getAllByRole('button', { name: /\+ Registrar/ }).length).toBeGreaterThan(15));
    await userEvent.click(screen.getByRole('button', { name: /^Alterados/ }));
    await userEvent.click(screen.getByRole('button', { name: /^Todos/ }));
    await userEvent.click(screen.getAllByRole('button', { name: /^Ver$/ })[0]);
    const dr = await screen.findByRole('dialog');
    await userEvent.click(within(dr).getByRole('button', { name: /Cerrar panel/i }));
    await userEvent.click(screen.getAllByRole('button', { name: /\+ Registrar/ })[0]);
    const fm = await screen.findByRole('dialog');
    fireEvent.change(within(fm).getByLabelText(/SpO₂/), { target: { value: '85' } });
    expect(within(fm).getByText(/Hipoxemia severa/i)).toBeTruthy();
    await userEvent.click(within(fm).getByRole('button', { name: /^Cancelar$/ }));

    // Medicación: pendientes, administrar, prescripciones, historial
    await nav(/^Medicación$/);
    await esperar(() => expect(screen.getByText(/pendientes/i)).toBeTruthy());
    const botones = screen.queryAllByRole('button', { name: /^Administrar$/ });
    if (botones.length) {
      await userEvent.click(botones[0]);
      const m = await screen.findByRole('dialog');
      await userEvent.click(within(m).getByRole('button', { name: /Confirmar administración/i }));
      await esperar(() => expect(screen.queryByText(/Confirmar administración/i)).toBeNull());
    }
    await userEvent.click(screen.getByRole('tab', { name: /Prescripciones/ }));
    await esperar(() => expect(screen.getAllByText(/Activa/).length).toBeGreaterThan(3));
    expect(screen.queryByRole('button', { name: /Prescribir/ })).toBeNull(); // solo jefe/admin
    await userEvent.click(screen.getByRole('tab', { name: /Historial/ }));
    await esperar(() => expect(screen.getAllByText(/Administrada/).length).toBeGreaterThan(3));

    // Inventario: detalle en panel (sin editar para enfermera)
    await nav(/^Inventario$/);
    await esperar(() => expect(screen.getAllByRole('button', { name: /^Ver$/ }).length).toBeGreaterThan(10));
    await userEvent.click(screen.getByRole('button', { name: /^Vencidos$/ }));
    await userEvent.click(screen.getAllByRole('button', { name: /^Ver$/ })[0]);
    const inv = await screen.findByRole('dialog');
    await esperar(() => expect(within(inv).getByText(/Últimos movimientos/i)).toBeTruthy());
    expect(within(inv).queryByRole('button', { name: /Ajustar stock/i })).toBeNull();
    await userEvent.click(within(inv).getByRole('button', { name: /Cerrar panel/i }));

    // Estadísticas: gráficas y rango
    await nav(/^Estadísticas$/);
    await esperar(() => expect(screen.getByText(/Actividad por día/i)).toBeTruthy());
    expect(screen.getByText(/Residentes por estado/i)).toBeTruthy();
    await userEvent.click(screen.getByRole('button', { name: /Últimos 7 días/ }));
    await esperar(() => expect(screen.getByText(/7 días analizados/i)).toBeTruthy());
    await userEvent.click(screen.getByRole('button', { name: /^PDF$/ }));
    await esperar(() => expect(URL.createObjectURL).toHaveBeenCalled());

    // Entrega de turno: resumen automático + historial
    await nav(/^Entrega de turno$/);
    await esperar(() => expect(screen.getAllByText(/Dosis atrasadas/i).length).toBeGreaterThan(0));
    await userEvent.click(screen.getByRole('button', { name: /^Entregar turno$/ }));
    await esperar(() => expect(screen.getByRole('alert').textContent).toMatch(/quién recibe/i));
    await userEvent.click(screen.getByRole('tab', { name: /Historial/ }));
    await esperar(() => expect(screen.getByText(/Aún no hay entregas|Pendiente|Confirmado/i)).toBeTruthy());
  });

  it('campana de notificaciones y búsqueda global', async () => {
    await entrar('maria.garcia@geriatric.com', 'enfermera123');
    await userEvent.click(await screen.findByRole('button', { name: /^Notificaciones/ }));
    const pop = await screen.findByRole('dialog', { name: /Notificaciones/ });
    await esperar(() => expect(within(pop).getAllByRole('button').length).toBeGreaterThan(3));
    await userEvent.click(within(pop).getByRole('button', { name: /Marcar todas/i }));
    await esperar(() => expect(screen.getByRole('button', { name: /^Notificaciones$/ })).toBeTruthy());
    await userEvent.click(screen.getByRole('button', { name: /Búsqueda global/i }));
    await userEvent.type(await screen.findByLabelText('Buscar'), 'paracetamol');
    await esperar(() => expect(screen.getAllByText(/Paracetamol/i).length).toBeGreaterThan(0));
  });

  it('jefe de enfermería: puede prescribir, editar inventario y ver usuarios (sin editar)', async () => {
    await entrar('carlos.rodriguez@geriatric.com', 'jefe123');
    await nav(/^Medicación$/);
    await userEvent.click(await screen.findByRole('tab', { name: /Prescripciones/ }));
    await userEvent.click(await screen.findByRole('button', { name: /Prescribir/ }));
    const m = await screen.findByRole('dialog');
    await userEvent.click(within(m).getByRole('button', { name: /Guardar prescripción/i }));
    await esperar(() => expect(within(m).getByRole('alert').textContent).toMatch(/Selecciona residente y medicamento/i));
    await userEvent.click(within(m).getByRole('button', { name: /^Cancelar$/ }));
    await nav(/^Inventario$/);
    await esperar(() => expect(screen.getByRole('button', { name: /Nuevo medicamento/i })).toBeTruthy());
    await userEvent.click(screen.getByRole('button', { name: /Nuevo medicamento/i }));
    await userEvent.click(within(await screen.findByRole('dialog')).getByRole('button', { name: /^Guardar$/ }));
    await esperar(() => expect(screen.getByText(/El nombre es obligatorio/i)).toBeTruthy());
    await userEvent.click(screen.getByRole('button', { name: /^Cancelar$/ }));
    await nav(/^Usuarios$/);
    await esperar(() => expect(screen.getAllByRole('button', { name: /^Ver$/ }).length).toBeGreaterThan(10));
    expect(screen.queryByRole('button', { name: /Nuevo usuario/i })).toBeNull();
    await nav(/^Residentes$/);
    expect(await screen.findByRole('button', { name: /Nuevo residente/i })).toBeTruthy();
  });

  it('administrador: gestiona usuarios', async () => {
    await entrar('admin@geriatric.com', 'admin123');
    await nav(/^Usuarios$/);
    await userEvent.click(await screen.findByRole('button', { name: /Nuevo usuario/i }));
    const m = await screen.findByRole('dialog');
    await userEvent.type(within(m).getByLabelText(/^Nombre/), 'Prueba UI');
    await userEvent.type(within(m).getByLabelText(/^Correo/), `ui${Date.now()}@geriatric.com`);
    await userEvent.type(within(m).getByLabelText(/Contraseña inicial/), 'abc123');
    await userEvent.click(within(m).getByRole('button', { name: /^Guardar$/ }));
    await esperar(() => expect(screen.queryByRole('dialog')).toBeNull());
    await esperar(() => expect(screen.getAllByText('Prueba UI').length).toBeGreaterThan(0));
  });
});
