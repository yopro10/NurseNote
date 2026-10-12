/**
 * Reglas clínicas de signos vitales (adulto mayor). nivel: 0 normal · 1 alerta · 2 crítico.
 * Mantener sincronizado con src/utils/rangos.ts del frontend.
 */
const REGLAS = [
  { campo: 'saturacion_oxigeno', etiqueta: 'SpO₂', unidad: '%', crit: (v) => v < 90, alerta: (v) => v < 95, texto: (v) => (v < 90 ? 'Hipoxemia severa' : 'SpO₂ baja') },
  { campo: 'presion_sistolica', etiqueta: 'PA sistólica', unidad: 'mmHg', crit: (v) => v >= 180 || v < 80, alerta: (v) => v > 140 || v < 90, texto: (v) => (v < 90 ? 'Hipotensión' : 'Hipertensión') },
  { campo: 'presion_diastolica', etiqueta: 'PA diastólica', unidad: 'mmHg', crit: (v) => v >= 110 || v < 40, alerta: (v) => v > 90 || v < 60, texto: (v) => (v < 60 ? 'Presión diastólica baja' : 'Presión diastólica alta') },
  { campo: 'temperatura', etiqueta: 'Temperatura', unidad: '°C', crit: (v) => v >= 39 || v < 35, alerta: (v) => v >= 38 || v < 36, texto: (v) => (v < 36 ? 'Hipotermia' : 'Fiebre') },
  { campo: 'frecuencia_cardiaca', etiqueta: 'FC', unidad: 'lpm', crit: (v) => v >= 130 || v < 40, alerta: (v) => v > 100 || v < 60, texto: (v) => (v < 60 ? 'Bradicardia' : 'Taquicardia') },
  { campo: 'frecuencia_respiratoria', etiqueta: 'FR', unidad: 'rpm', crit: (v) => v >= 30 || v < 8, alerta: (v) => v > 20 || v < 12, texto: (v) => (v < 12 ? 'Bradipnea' : 'Taquipnea') },
  { campo: 'glucosa', etiqueta: 'Glucosa', unidad: 'mg/dL', crit: (v) => v >= 300 || v < 54, alerta: (v) => v > 180 || v < 70, texto: (v) => (v < 70 ? 'Hipoglucemia' : 'Hiperglucemia') },
];

export function evaluarSignos(sv) {
  const hallazgos = [];
  let nivel = 0;
  for (const r of REGLAS) {
    const valor = sv?.[r.campo];
    if (valor === null || valor === undefined || valor === '') continue;
    const v = Number(valor);
    if (Number.isNaN(v)) continue;
    const n = r.crit(v) ? 2 : r.alerta(v) ? 1 : 0;
    if (n > 0) {
      hallazgos.push({ campo: r.campo, etiqueta: r.etiqueta, valor: v, unidad: r.unidad, nivel: n, texto: `${r.texto(v)} (${r.etiqueta} ${v} ${r.unidad})` });
      nivel = Math.max(nivel, n);
    }
  }
  return { nivel, hallazgos };
}

/** Límites de plausibilidad fisiológica: evitan errores de digitación (p. ej. 1200 en vez de 120). */
export const LIMITES = {
  presion_sistolica: [40, 300],
  presion_diastolica: [20, 200],
  frecuencia_cardiaca: [20, 250],
  temperatura: [30, 43],
  saturacion_oxigeno: [50, 100],
  frecuencia_respiratoria: [4, 70],
  glucosa: [10, 900],
  peso: [20, 250],
  altura: [100, 230],
};

export const NIVEL_ESTADO = ['Estable', 'En Observación', 'Crítico'];
export const ESTADOS = NIVEL_ESTADO;
