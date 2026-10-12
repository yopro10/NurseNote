import type { Evaluacion, Hallazgo, SignosVitales } from '../types';

/** Reglas clínicas: espejo de backend/src/services/rangos.js. nivel 1 = alerta, 2 = crítico. */
const REGLAS = [
  { campo: 'saturacion_oxigeno', etiqueta: 'SpO₂', unidad: '%', crit: (v: number) => v < 90, alerta: (v: number) => v < 95, texto: (v: number) => (v < 90 ? 'Hipoxemia severa' : 'SpO₂ baja') },
  { campo: 'presion_sistolica', etiqueta: 'PA sistólica', unidad: 'mmHg', crit: (v: number) => v >= 180 || v < 80, alerta: (v: number) => v > 140 || v < 90, texto: (v: number) => (v < 90 ? 'Hipotensión' : 'Hipertensión') },
  { campo: 'presion_diastolica', etiqueta: 'PA diastólica', unidad: 'mmHg', crit: (v: number) => v >= 110 || v < 40, alerta: (v: number) => v > 90 || v < 60, texto: (v: number) => (v < 60 ? 'Presión diastólica baja' : 'Presión diastólica alta') },
  { campo: 'temperatura', etiqueta: 'Temperatura', unidad: '°C', crit: (v: number) => v >= 39 || v < 35, alerta: (v: number) => v >= 38 || v < 36, texto: (v: number) => (v < 36 ? 'Hipotermia' : 'Fiebre') },
  { campo: 'frecuencia_cardiaca', etiqueta: 'FC', unidad: 'lpm', crit: (v: number) => v >= 130 || v < 40, alerta: (v: number) => v > 100 || v < 60, texto: (v: number) => (v < 60 ? 'Bradicardia' : 'Taquicardia') },
  { campo: 'frecuencia_respiratoria', etiqueta: 'FR', unidad: 'rpm', crit: (v: number) => v >= 30 || v < 8, alerta: (v: number) => v > 20 || v < 12, texto: (v: number) => (v < 12 ? 'Bradipnea' : 'Taquipnea') },
  { campo: 'glucosa', etiqueta: 'Glucosa', unidad: 'mg/dL', crit: (v: number) => v >= 300 || v < 54, alerta: (v: number) => v > 180 || v < 70, texto: (v: number) => (v < 70 ? 'Hipoglucemia' : 'Hiperglucemia') },
];

export function evaluarSignos(sv: Partial<Record<keyof SignosVitales, unknown>>): Evaluacion {
  const hallazgos: Hallazgo[] = [];
  let nivel: 0 | 1 | 2 = 0;
  for (const r of REGLAS) {
    const raw = (sv as Record<string, unknown>)[r.campo];
    if (raw === null || raw === undefined || raw === '') continue;
    const v = Number(raw);
    if (Number.isNaN(v)) continue;
    const n = r.crit(v) ? 2 : r.alerta(v) ? 1 : 0;
    if (n > 0) { hallazgos.push({ campo: r.campo, etiqueta: r.etiqueta, valor: v, unidad: r.unidad, nivel: n as 1 | 2, texto: `${r.texto(v)} (${r.etiqueta} ${v} ${r.unidad})` }); nivel = Math.max(nivel, n) as 1 | 2; }
  }
  return { nivel, hallazgos };
}

export const nivelDe = (sv: Partial<SignosVitales>, campo: string): 0 | 1 | 2 =>
  evaluarSignos(sv).hallazgos.reduce<0 | 1 | 2>((m, h) => (h.campo === campo && h.nivel > m ? h.nivel : m), 0);
