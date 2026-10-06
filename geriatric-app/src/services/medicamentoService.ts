import type { Medicamento, MedicamentoPaciente } from '../types';

const API_BASE_URL = 'http://localhost:3000/api';

/**
 * ============================================================================
 * SERVICIO DE MEDICAMENTOS - API REST REAL
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

/** GET /api/medicamentos */
export async function getMedicamentos(filtros?: any): Promise<Medicamento[]> {
  const params = new URLSearchParams(filtros).toString();
  const endpoint = params ? `/medicamentos?${params}` : '/medicamentos';
  return apiRequest<Medicamento[]>(endpoint);
}

/** GET /api/medicamentos/:id */
export async function getMedicamentoPorId(id: number): Promise<Medicamento> {
  return apiRequest<Medicamento>(`/medicamentos/${id}`);
}

/** POST /api/medicamentos */
export async function crearMedicamento(medicamento: Omit<Medicamento, 'id' | 'fecha_registro' | 'activo'>): Promise<Medicamento> {
  return apiRequest<Medicamento>('/medicamentos', {
    method: 'POST',
    body: JSON.stringify(medicamento),
  });
}

/** PUT /api/medicamentos/:id */
export async function actualizarMedicamento(id: number, medicamento: Partial<Medicamento>): Promise<Medicamento> {
  return apiRequest<Medicamento>(`/medicamentos/${id}`, {
    method: 'PUT',
    body: JSON.stringify(medicamento),
  });
}

/** DELETE /api/medicamentos/:id */
export async function eliminarMedicamento(id: number): Promise<void> {
  return apiRequest<void>(`/medicamentos/${id}`, {
    method: 'DELETE',
  });
}

/** PATCH /api/medicamentos/:id/cantidad */
export async function actualizarCantidadMedicamento(id: number, cantidad: number): Promise<Medicamento> {
  return apiRequest<Medicamento>(`/medicamentos/${id}/cantidad`, {
    method: 'PATCH',
    body: JSON.stringify({ cantidad }),
  });
}

/** GET /api/medicamentos/alertas */
export async function getAlertasMedicamentos(): Promise<{ alertas: Medicamento[]; total: number }> {
  return apiRequest<{ alertas: Medicamento[]; total: number }>('/medicamentos/alertas');
}

/** GET /api/medicamentos/proximos-vencer */
export async function getMedicamentosProximosVencer(dias: number = 30): Promise<{ medicamentos: Medicamento[]; total: number }> {
  return apiRequest<{ medicamentos: Medicamento[]; total: number }>(`/medicamentos/proximos-vencer?dias=${dias}`);
}

/** GET /api/medicamentos/vencidos */
export async function getMedicamentosVencidos(): Promise<{ medicamentos: Medicamento[]; total: number }> {
  return apiRequest<{ medicamentos: Medicamento[]; total: number }>('/medicamentos/vencidos');
}

/** GET /api/medicamentos/bajo-stock */
export async function getMedicamentosBajoStock(minimo: number = 10): Promise<{ medicamentos: Medicamento[]; total: number }> {
  return apiRequest<{ medicamentos: Medicamento[]; total: number }>(`/medicamentos/bajo-stock?minimo=${minimo}`);
}

/**
 * ============================================================================
 * SERVICIO DE ASIGNACIÓN DE MEDICAMENTOS A PACIENTES
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

/** GET /api/medicamentos-pacientes/paciente/:pacienteId/activos */
export async function getMedicamentosActivosPaciente(pacienteId: number): Promise<MedicamentoPaciente[]> {
  return apiRequest<MedicamentoPaciente[]>(`/medicamentos-pacientes/paciente/${pacienteId}/activos`);
}

/** GET /api/medicamentos-pacientes/paciente/:pacienteId/historial */
export async function getHistorialMedicamentosPaciente(pacienteId: number): Promise<MedicamentoPaciente[]> {
  return apiRequest<MedicamentoPaciente[]>(`/medicamentos-pacientes/paciente/${pacienteId}/historial`);
}

/** GET /api/medicamentos-pacientes/medicamento/:medicamentoId */
export async function getPacientesMedicamento(medicamentoId: number): Promise<MedicamentoPaciente[]> {
  return apiRequest<MedicamentoPaciente[]>(`/medicamentos-pacientes/medicamento/${medicamentoId}`);
}

/** PUT /api/medicamentos-pacientes/:id */
export async function actualizarAsignacionMedicamento(id: number, asignacion: Partial<MedicamentoPaciente>): Promise<MedicamentoPaciente> {
  return apiRequest<MedicamentoPaciente>(`/medicamentos-pacientes/${id}`, {
    method: 'PUT',
    body: JSON.stringify(asignacion),
  });
}

/** DELETE /api/medicamentos-pacientes/:id */
export async function eliminarAsignacionMedicamento(id: number): Promise<void> {
  return apiRequest<void>(`/medicamentos-pacientes/${id}`, {
    method: 'DELETE',
  });
}