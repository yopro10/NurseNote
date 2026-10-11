/**
 * ============================================================================
 * MODELOS DE DATOS (Capa de Dominio)
 * Estas interfaces representan las tablas/entidades de PostgreSQL
 * y se exponen vía la API REST de Node.js.
 * ============================================================================
 */

export type RolUsuario = 'administrador' | 'enfermera' | 'jefe_enfermeria';

export interface Usuario {
  id: number;
  nombre: string;
  apellido?: string;
  email: string;
  rol: RolUsuario;
  fecha_creacion: string;
}

export interface Paciente {
  id: number;
  nombre: string;
  apellido: string;
  fecha_nacimiento?: string;
  genero?: string;
  direccion?: string;
  telefono?: string;
  contacto_emergencia?: string;
  telefono_emergencia?: string;
  alergias?: string;
  enfermedades_cronicas?: string;
  habitacion?: string;
  fecha_ingreso: string;
  fecha_egreso?: string;
  activo: boolean;
}

export interface Medicamento {
  id: number;
  nombre: string;
  descripcion?: string;
  presentacion?: string;
  dosis?: string;
  via_administracion?: string;
  cantidad_disponible: number;
  fecha_caducidad: string;
  lote?: string;
  proveedor?: string;
  fecha_registro: string;
  activo: boolean;
}

export interface NotaEnfermeria {
  id: number;
  paciente_id: number;
  usuario_id: number;
  tipo_nota: string;
  contenido?: string;
  signos_vitales?: any;
  administracion_medicamentos?: any;
  observaciones?: string;
  estado_paciente?: string;
  fecha_registro: string;
  fecha_actualizacion?: string;
  paciente_nombre?: string;
  paciente_apellido?: string;
  usuario_nombre?: string;
  usuario_apellido?: string;
}

export interface MedicamentoPaciente {
  id: number;
  paciente_id: number;
  medicamento_id: number;
  dosis_prescrita?: string;
  frecuencia?: string;
  via_administracion?: string;
  fecha_inicio: string;
  fecha_fin?: string;
  observaciones?: string;
  activo: boolean;
  fecha_asignacion: string;
  medicamento_nombre?: string;
  presentacion?: string;
  paciente_nombre?: string;
  paciente_apellido?: string;
}

export type TipoNota = 'ingreso' | 'evolucion' | 'egreso' | 'medicacion' | 'signos_vitales' | 'observacion';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  nombre: string;
  apellido?: string;
  email: string;
  password: string;
  rol?: RolUsuario;
}

export interface AuthResponse {
  message: string;
  user: Usuario;
  token: string;
}

export interface Metricas {
  totalPacientes: number;
  pacientesCriticos: number;
  pacientesEnObservacion: number;
  registrosHoy: number;
  medicamentosVencidos: number;
  medicamentosBajoStock: number;
}

export interface ModuloAcceso {
  id: string;
  titulo: string;
  descripcion: string;
  icono: 'notas' | 'vitales' | 'medicamentos' | 'pacientes';
}

/** Vistas disponibles dentro del enrutador principal (SPA). */
export type VistaApp = 'login' | 'dashboard' | 'notas_enfermeria' | 'signos_vitales' | 'medicamentos' | 'gestion_pacientes' | 'estadisticas' | 'inventario_medicamentos' | 'registro' | 'usuarios' | 'ficha_residente';

/** Estado clínico derivado de cada residente. */
export type EstadoPaciente = 'Estable' | 'En Observación' | 'Crítico';

/** Información del hogar geriátrico. */
export interface HogarInfo {
  id: string;
  nombre: string;
  direccion: string;
  capacidad: number;
}
