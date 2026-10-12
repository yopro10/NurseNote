/**
 * Cliente HTTP único de la aplicación. Centraliza la URL base, el token JWT,
 * el manejo de errores y la expiración de sesión (401).
 */
const BASE = `${(import.meta.env.VITE_API_URL as string | undefined) ?? 'http://localhost:3000'}/api`;

export class ApiError extends Error {
  status: number;
  data: any;
  constructor(status: number, message: string, data: any = {}) {
    super(message);
    this.status = status;
    this.data = data;
  }
}

export const getToken = () => localStorage.getItem('auth_token');

type Query = Record<string, string | number | boolean | null | undefined>;

export function qs(params?: Query): string {
  if (!params) return '';
  const p = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') p.set(k, String(v));
  });
  const s = p.toString();
  return s ? `?${s}` : '';
}

async function pedir(path: string, init: RequestInit = {}): Promise<Response> {
  const headers: Record<string, string> = { ...(init.headers as Record<string, string>) };
  if (init.body) headers['Content-Type'] = 'application/json';
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  let resp: Response;
  try {
    resp = await fetch(`${BASE}${path}`, { ...init, headers });
  } catch {
    throw new ApiError(0, 'No se pudo conectar con el servidor. Verifica que el backend esté en ejecución.');
  }
  if (!resp.ok) {
    const data = await resp.json().catch(() => ({}));
    if (resp.status === 401 && token) window.dispatchEvent(new CustomEvent('auth:expirada'));
    throw new ApiError(resp.status, data.error || data.message || 'Error en la solicitud', data);
  }
  return resp;
}

export const api = {
  get: async <T = any>(path: string, params?: Query): Promise<T> => (await pedir(path + qs(params))).json(),
  post: async <T = any>(path: string, body?: unknown): Promise<T> => (await pedir(path, { method: 'POST', body: JSON.stringify(body ?? {}) })).json(),
  put: async <T = any>(path: string, body?: unknown): Promise<T> => (await pedir(path, { method: 'PUT', body: JSON.stringify(body ?? {}) })).json(),
  del: async <T = any>(path: string, body?: unknown): Promise<T> => (await pedir(path, { method: 'DELETE', body: body ? JSON.stringify(body) : undefined })).json(),
};

/** Descarga un archivo generado por el backend (PDF / Excel) usando el token de la sesión. */
export async function descargar(path: string, params: Query, nombreBase: string): Promise<void> {
  const resp = await pedir(path + qs(params));
  const blob = await resp.blob();
  const cd = resp.headers.get('Content-Disposition') ?? '';
  const nombre = /filename="?([^";]+)"?/.exec(cd)?.[1] ?? `${nombreBase}.${params.formato === 'pdf' ? 'pdf' : 'xlsx'}`;
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = nombre;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}
