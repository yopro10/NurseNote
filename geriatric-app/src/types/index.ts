export type RolUsuario = 'administrador' | 'enfermera' | 'jefe_enfermeria';
export type EstadoPaciente = 'Estable' | 'En Observación' | 'Crítico';

export interface Usuario {
  id: number; nombre: string; apellido?: string | null; email: string; rol: RolUsuario; fecha_creacion?: string; activo?: boolean;
}

export interface Paciente {
  id: number; nombre: string; apellido: string; documento?: string | null; fecha_nacimiento?: string | null; genero?: string | null;
  direccion?: string | null; telefono?: string | null; contacto_emergencia?: string | null; telefono_emergencia?: string | null;
  alergias?: string | null; enfermedades_cronicas?: string | null; habitacion?: string | null; fecha_ingreso: string; fecha_egreso?: string | null;
  motivo_egreso?: string | null; activo: boolean; estado_calculado: EstadoPaciente; estado_motivo?: string | null; fecha_ultimo_estado?: string | null;
  ultimo_signo?: string | null; medicamentos_activos?: number;
}

export type TipoNota = 'ingreso' | 'evolucion' | 'egreso' | 'medicacion' | 'signos_vitales' | 'observacion' | 'correccion';

export interface Nota {
  id: number; paciente_id: number; usuario_id: number; tipo_nota: TipoNota; contenido: string; observaciones?: string | null;
  estado_paciente?: string | null; fecha_registro: string; fecha_actualizacion?: string | null; anulada: boolean; motivo_anulacion?: string | null;
  paciente_nombre?: string; paciente_apellido?: string; paciente_habitacion?: string; usuario_nombre?: string; usuario_apellido?: string; editable?: boolean;
  anulada_por_nombre?: string | null; fecha_anulacion?: string | null;
}

export interface Hallazgo { campo: string; etiqueta: string; valor: number; unidad: string; nivel: 1 | 2; texto: string }
export interface Evaluacion { nivel: 0 | 1 | 2; hallazgos: Hallazgo[] }

export interface SignosVitales {
  id: number; paciente_id: number; usuario_id: number; fecha_registro: string; presion_sistolica?: number | null; presion_diastolica?: number | null;
  frecuencia_cardiaca?: number | null; temperatura?: number | null; saturacion_oxigeno?: number | null; frecuencia_respiratoria?: number | null;
  glucosa?: number | null; peso?: number | null; altura?: number | null; observaciones?: string | null;
  usuario_nombre?: string; usuario_apellido?: string; paciente_nombre?: string; paciente_apellido?: string; evaluacion?: Evaluacion;
}

export interface ResumenSignos extends Partial<SignosVitales> {
  paciente_id: number; paciente_nombre: string; paciente_apellido: string; habitacion?: string | null; estado_calculado: EstadoPaciente; registro_id?: number | null;
}

export type EstadoInventario = 'ok' | 'stock_bajo' | 'por_vencer' | 'vencido' | 'agotado';

export interface Medicamento {
  id: number; nombre: string; descripcion?: string | null; presentacion?: string | null; dosis?: string | null; via_administracion?: string | null;
  cantidad_disponible: number; fecha_caducidad: string; lote?: string | null; proveedor?: string | null; stock_minimo?: number | null;
  activo: boolean; dias_para_vencer: number; estado_inventario: EstadoInventario; residentes_asignados: number;
  residentes?: Array<{ prescripcion_id: number; paciente_id: number; nombre: string; apellido: string; habitacion?: string; dosis_prescrita?: string; frecuencia?: string; horarios?: string }>;
  movimientos?: Array<{ id: number; tipo: string; cantidad: number; stock_resultante: number; motivo?: string; fecha: string; usuario_nombre?: string; usuario_apellido?: string }>;
}

export interface Prescripcion {
  id: number; paciente_id: number; medicamento_id: number; dosis_prescrita: string; frecuencia: string; via_administracion?: string | null; horarios?: string | null;
  unidades_por_dosis: number; fecha_inicio: string; fecha_fin?: string | null; observaciones?: string | null; activo: boolean; motivo_suspension?: string | null;
  medicamento_nombre: string; presentacion?: string; stock: number; paciente_nombre: string; paciente_apellido: string; habitacion?: string; paciente_alergias?: string;
  prescriptor_nombre?: string; prescriptor_apellido?: string;
}

export type EstadoAdmin = 'programada' | 'administrada' | 'omitida' | 'rechazada' | 'cancelada';

export interface Administracion {
  id: number; paciente_id: number; medicamento_id: number; estado: EstadoAdmin; horario_programado: string; horario_administracion?: string | null;
  dosis_administrada?: string | null; observaciones?: string | null; motivo_omision?: string | null; medicamento_nombre: string; paciente_nombre: string;
  paciente_apellido: string; habitacion?: string; frecuencia?: string; unidades_por_dosis?: number; stock: number; usuario_nombre?: string; usuario_apellido?: string;
  atrasada: boolean; indicaciones?: string | null; presentacion?: string; paciente_alergias?: string | null;
}

export interface Paginado<T> { data: T[]; total: number; page: number; limit?: number; paginas: number }

export interface Notificacion {
  clave: string; tipo: 'inventario' | 'residente' | 'medicacion' | 'signos' | 'turno'; severidad: 'critica' | 'alta' | 'media' | 'info';
  titulo: string; detalle: string; ruta: { vista: string; pacienteId?: number; tab?: string; id?: number }; fecha: string | null; leida: boolean;
}

export interface HistorialEstado { id: number; estado_anterior?: string | null; estado_nuevo: string; origen: string; motivo?: string; fecha: string; usuario_nombre?: string; usuario_apellido?: string }

export interface Turno {
  id: number; fecha_entrega: string; turno?: string; notas_relevo?: string; confirmada: boolean; fecha_confirmacion?: string | null;
  saliente_nombre?: string; saliente_apellido?: string; entrante_nombre?: string; entrante_apellido?: string; usuario_entrante_id: number; usuario_saliente_id: number; resumen?: ResumenTurno;
}

export interface ResumenTurno {
  desde: string; hasta: string; turnoSugerido: string; ultimaEntrega: string | null;
  residentes: { total: number; estables: number; observacion: number; criticos: number };
  criticos: Array<{ id: number; nombre: string; habitacion?: string; motivo?: string }>;
  observacion: Array<{ id: number; nombre: string; habitacion?: string; motivo?: string }>;
  alergias: number;
  medicacion: {
    administradas: number;
    omitidas: Array<{ id: number; residente: string; medicamento: string; hora: string; motivo?: string; estado: string }>;
    atrasadas: Array<{ id: number; residente: string; medicamento: string; hora: string }>;
    proximas: Array<{ id: number; residente: string; medicamento: string; hora: string }>;
  };
  signosAlterados: Array<{ residente: string; habitacion?: string; nivel: number; hallazgos: string[]; hora: string }>;
  notas: { total: number; recientes: Array<{ id: number; residente: string; tipo: string; resumen: string; autor: string; hora: string }> };
  inventario: { vencidos: number; porVencer: number; bajoStock: number };
  movimientos: { ingresos: number; egresos: number };
}

export type VistaApp = 'dashboard' | 'notas' | 'signos' | 'medicamentos' | 'residentes' | 'ficha' | 'inventario' | 'estadisticas' | 'turnos' | 'usuarios';
