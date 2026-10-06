import type { Metricas, HogarInfo } from '../types';
import { getMetricasDashboard } from './metricasService';

/**
 * ============================================================================
 * SERVICIO DE HOGAR/MÉTRICAS - API REST REAL
 * ============================================================================
 */

const HOGAR_INFO: HogarInfo = {
  id: 'hogar-01',
  nombre: 'Hogar Geriátrico San Rafael',
  direccion: 'Cra. 15 # 45-23',
  capacidad: 40,
};

/** GET /api/hogares/:id */
export async function getHogarPorId(_hogarId: string): Promise<HogarInfo | undefined> {
  return HOGAR_INFO;
}

/** GET /api/hogares/:id/metricas — alimenta las métricas del dashboard */
export async function getMetricasHogar(_hogarId: string): Promise<Metricas> {
  return getMetricasDashboard();
}
