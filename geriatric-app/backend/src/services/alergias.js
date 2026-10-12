const norm = (s = '') => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();

// Una alergia a un fármaco suele implicar a su familia. Se listan los principios activos relacionados.
const FAMILIAS = {
  penicilina: ['penicilina', 'amoxicilina', 'ampicilina', 'piperacilina', 'dicloxacilina', 'cloxacilina'],
  amoxicilina: ['penicilina', 'amoxicilina', 'ampicilina'],
  aspirina: ['aspirina', 'acido acetilsalicilico', 'acetilsalicilico', 'aas'],
  sulfa: ['sulfa', 'sulfametoxazol', 'trimetoprim', 'sulfadiazina', 'cotrimoxazol'],
  sulfamida: ['sulfa', 'sulfametoxazol', 'trimetoprim', 'sulfadiazina', 'cotrimoxazol'],
  ibuprofeno: ['ibuprofeno', 'naproxeno', 'ketorolaco', 'diclofenaco'],
  aine: ['ibuprofeno', 'naproxeno', 'ketorolaco', 'diclofenaco', 'aspirina'],
  codeina: ['codeina', 'morfina', 'tramadol'],
  yodo: ['yodo', 'povidona'],
};

const SIN_ALERGIA = /^(ninguna?|no|sin|n\/a|na|ninguna conocida|sin alergias( conocidas)?|no refiere|niega)$/;

export function listarAlergenos(alergias) {
  if (!alergias) return [];
  return alergias
    .split(/[,;/\n]| y /i)
    .map((a) => norm(a))
    .filter((a) => a.length >= 3 && !SIN_ALERGIA.test(a));
}

/** Devuelve las alergias del residente que coinciden con el medicamento (por nombre, descripción o familia). */
export function detectarAlergias(alergias, medicamento) {
  const alergenos = listarAlergenos(alergias);
  if (!alergenos.length) return [];
  const haystack = norm(`${medicamento.nombre || ''} ${medicamento.descripcion || ''}`);
  const coincidencias = [];
  for (const alergeno of alergenos) {
    const clave = Object.keys(FAMILIAS).find((k) => alergeno.includes(k));
    const terminos = clave ? FAMILIAS[clave] : [alergeno];
    const hit = terminos.find((t) => haystack.includes(t));
    if (hit) coincidencias.push({ alergia: alergeno, coincide_con: hit });
  }
  return coincidencias;
}
