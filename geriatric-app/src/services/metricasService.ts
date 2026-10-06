import type { Metricas } from '../types';

const API_BASE_URL = 'http://localhost:3000/api';

/**
 * ============================================================================
 * SERVICIO DE MÉTRICAS - API REST REAL
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

/** GET /api/metricas/dashboard */
export async function getMetricasDashboard(): Promise<Metricas> {
  try {
    return await apiRequest<Metricas>('/metricas/dashboard');
  } catch (error) {
    console.error('Error al obtener métricas del dashboard:', error);
    // Fallback a valores predeterminados en caso de error
    return {
      totalPacientes: 0,
      pacientesCriticos: 0,
      pacientesEnObservacion: 0,
      registrosHoy: 0,
      medicamentosVencidos: 0,
      medicamentosBajoStock: 0,
    };
  }
}

/** GET /api/metricas/estadisticas */
export async function getEstadisticasGenerales() {
  try {
    return await apiRequest('/metricas/estadisticas');
  } catch (error) {
    console.error('Error al obtener estadísticas generales:', error);
    return null;
  }
}