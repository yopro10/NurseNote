import type { Paciente, NotaEnfermeria, MedicamentoPaciente } from '../types';
import { transformarPacientes } from '../utils/patientHelpers';
import type { PacienteConCalculos } from '../utils/patientHelpers';

const API_BASE_URL = 'http://localhost:3000/api';

/**
 * ============================================================================
 * SERVICIO DE PACIENTES - API REST REAL
 * ============================================================================
 */

async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> | undefined),
  };

  const token = localStorage.getItem('auth_token');
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Error en la solicitud' }));
    throw new Error(error.error || error.message || 'Error en la solicitud');
  }

  return response.json();
}

/** GET /api/pacientes */
export async function getPacientes(filtros?: any): Promise<PacienteConCalculos[]> {
  const params = new URLSearchParams(filtros).toString();
  const endpoint = params ? `/pacientes?${params}` : '/pacientes';
  const pacientes = await apiRequest<Paciente[]>(endpoint);
  return transformarPacientes(pacientes);
}

/** GET /api/pacientes/:id */
export async function getPacientePorId(id: number): Promise<Paciente> {
  return apiRequest<Paciente>(`/pacientes/${id}`);
}

/** POST /api/pacientes */
export async function crearPaciente(paciente: Omit<Paciente, 'id' | 'fecha_ingreso' | 'activo'>): Promise<Paciente> {
  return apiRequest<Paciente>('/pacientes', {
    method: 'POST',
    body: JSON.stringify(paciente),
  });
}

/** PUT /api/pacientes/:id */
export async function actualizarPaciente(id: number, paciente: Partial<Paciente>): Promise<Paciente> {
  return apiRequest<Paciente>(`/pacientes/${id}`, {
    method: 'PUT',
    body: JSON.stringify(paciente),
  });
}

/** DELETE /api/pacientes/:id */
export async function eliminarPaciente(id: number): Promise<void> {
  return apiRequest<void>(`/pacientes/${id}`, {
    method: 'DELETE',
  });
}

/** GET /api/pacientes/habitacion/:habitacion */
export async function getPacientesPorHabitacion(habitacion: string): Promise<Paciente[]> {
  return apiRequest<Paciente[]>(`/pacientes/habitacion/${habitacion}`);
}

/**
 * Búsqueda de pacientes por nombre o habitación
 */
export async function buscarPacientes(query: string): Promise<PacienteConCalculos[]> {
  if (!query) return getPacientes();

  const normalizar = (texto: string) =>
    texto
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim();

  const q = normalizar(query);
  const pacientes = await getPacientes();

  return pacientes.filter((p) => {
    const nombreCompleto = p.nombreCompleto;
    return normalizar(nombreCompleto).includes(q) ||
           (p.cedula && normalizar(p.cedula).includes(q)) ||
           (p.habitacion && normalizar(p.habitacion).includes(q));
  });
}

/**
 * ============================================================================
 * SERVICIO DE NOTAS DE ENFERMERÍA
 * ============================================================================
 */

/** GET /api/notas */
export async function getNotas(filtros?: any): Promise<NotaEnfermeria[]> {
  const params = new URLSearchParams(filtros).toString();
  const endpoint = params ? `/notas?${params}` : '/notas';
  return apiRequest<NotaEnfermeria[]>(endpoint);
}

/** GET /api/notas/:id */
export async function getNotaPorId(id: number): Promise<NotaEnfermeria> {
  return apiRequest<NotaEnfermeria>(`/notas/${id}`);
}

/** GET /api/notas/paciente/:pacienteId */
export async function getNotasPorPaciente(pacienteId: number, filtros?: any): Promise<NotaEnfermeria[]> {
  const params = new URLSearchParams(filtros).toString();
  const endpoint = params ? `/notas/paciente/${pacienteId}?${params}` : `/notas/paciente/${pacienteId}`;
  return apiRequest<NotaEnfermeria[]>(endpoint);
}

/** GET /api/notas/paciente/:pacienteId/ultimas */
export async function getUltimasNotas(pacienteId: number, limite: number = 10): Promise<NotaEnfermeria[]> {
  return apiRequest<NotaEnfermeria[]>(`/notas/paciente/${pacienteId}/ultimas?limite=${limite}`);
}

/** POST /api/notas */
export async function crearNota(nota: Omit<NotaEnfermeria, 'id' | 'fecha_registro' | 'usuario_id'>): Promise<NotaEnfermeria> {
  return apiRequest<NotaEnfermeria>('/notas', {
    method: 'POST',
    body: JSON.stringify(nota),
  });
}

/** PUT /api/notas/:id */
export async function actualizarNota(id: number, nota: Partial<NotaEnfermeria>): Promise<NotaEnfermeria> {
  return apiRequest<NotaEnfermeria>(`/notas/${id}`, {
    method: 'PUT',
    body: JSON.stringify(nota),
  });
}

/** DELETE /api/notas/:id */
export async function eliminarNota(id: number): Promise<void> {
  return apiRequest<void>(`/notas/${id}`, {
    method: 'DELETE',
  });
}

/**
 * ============================================================================
 * SERVICIO DE MEDICAMENTOS ASIGNADOS A PACIENTES
 * ============================================================================
 */

/** POST /api/medicamentos-pacientes */
export async function asignarMedicamentoAPaciente(asignacion: Omit<MedicamentoPaciente, 'id' | 'fecha_asignacion' | 'activo'>): Promise<MedicamentoPaciente> {
  return apiRequest<MedicamentoPaciente>('/medicamentos-pacientes', {
    method: 'POST',
    body: JSON.stringify(asignacion),
  });
}

/** GET /api/medicamentos-pacientes/paciente/:pacienteId */
export async function getMedicamentosPaciente(pacienteId: number): Promise<MedicamentoPaciente[]> {
  return apiRequest<MedicamentoPaciente[]>(`/medicamentos-pacientes/paciente/${pacienteId}`);
}
