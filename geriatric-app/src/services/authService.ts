import type { Usuario, LoginRequest, RegisterRequest, AuthResponse } from '../types';

const API_BASE_URL = 'http://localhost:3000/api';

/**
 * ============================================================================
 * SERVICIO DE AUTENTICACIÓN - API REST REAL
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

  // Agregar token si está disponible
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

/** POST /api/auth/login */
export async function login(credentials: LoginRequest): Promise<AuthResponse> {
  return apiRequest<AuthResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify(credentials),
  });
}

/** POST /api/auth/register */
export async function register(userData: RegisterRequest): Promise<AuthResponse> {
  return apiRequest<AuthResponse>('/auth/register', {
    method: 'POST',
    body: JSON.stringify(userData),
  });
}

/** POST /api/auth/logout */
export async function logout(): Promise<void> {
  localStorage.removeItem('auth_token');
  localStorage.removeItem('user_data');
}

/** GET /api/auth/profile */
export async function getProfile(): Promise<Usuario> {
  return apiRequest<Usuario>('/auth/profile');
}

/** GET /api/auth/session — recupera la sesión activa (persistencia entre recargas). */
export async function getSesionActiva(): Promise<Usuario | null> {
  const token = localStorage.getItem('auth_token');
  if (!token) return null;

  try {
    const user = await getProfile();
    return user;
  } catch (error) {
    // Si el token es inválido, limpiar localStorage
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_data');
    return null;
  }
}

/** Guardar token y datos de usuario */
export function saveAuthData(token: string, user: Usuario): void {
  localStorage.setItem('auth_token', token);
  localStorage.setItem('user_data', JSON.stringify(user));
}

/** Obtener datos de usuario del localStorage */
export function getStoredUser(): Usuario | null {
  const userData = localStorage.getItem('user_data');
  return userData ? JSON.parse(userData) : null;
}
