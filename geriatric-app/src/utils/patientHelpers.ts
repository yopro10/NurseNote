import type { Paciente, EstadoPaciente } from '../types';

export interface PacienteConCalculos extends Paciente {
  cedula: string;
  avatarIniciales: string;
  nombreCompleto: string;
  diagnosticoPrincipal: string;
  edad: number;
  estado: EstadoPaciente;
}

export function transformarPaciente(paciente: Paciente): PacienteConCalculos {
  const nombreCompleto = `${paciente.nombre} ${paciente.apellido || ''}`.trim();
  const iniciales = `${paciente.nombre[0]}${paciente.apellido?.[0] || ''}`.toUpperCase();
  
  // Calcular edad
  let edad = 0;
  if (paciente.fecha_nacimiento) {
    const nacimiento = new Date(paciente.fecha_nacimiento);
    const hoy = new Date();
    edad = hoy.getFullYear() - nacimiento.getFullYear();
    const mesDiferencia = hoy.getMonth() - nacimiento.getMonth();
    if (mesDiferencia < 0 || (mesDiferencia === 0 && hoy.getDate() < nacimiento.getDate())) {
      edad--;
    }
  }

  // Determinar estado basado en enfermedades crónicas
  let estado: EstadoPaciente = 'Estable';
  if (paciente.enfermedades_cronicas?.toLowerCase().includes('crítico') ||
      paciente.enfermedades_cronicas?.toLowerCase().includes('grave') ||
      paciente.enfermedades_cronicas?.toLowerCase().includes('cardíaca')) {
    estado = 'Crítico';
  } else if (paciente.enfermedades_cronicas?.toLowerCase().includes('demencia') ||
             paciente.enfermedades_cronicas?.toLowerCase().includes('diabetes')) {
    estado = 'En Observación';
  }

  // Diagnóstico principal (primer enfermedad crónica o alergia)
  const diagnosticoPrincipal = paciente.enfermedades_cronicas?.split(',')[0]?.trim() ||
                               paciente.alergias?.split(',')[0]?.trim() ||
                               'Sin diagnóstico registrado';

  // Generar cédula simulada (en producción esto vendría de la base de datos)
  const cedula = paciente.id.toString().padStart(10, '0');

  return {
    ...paciente,
    cedula,
    avatarIniciales: iniciales,
    nombreCompleto,
    diagnosticoPrincipal,
    edad,
    estado,
  };
}

export function transformarPacientes(pacientes: Paciente[]): PacienteConCalculos[] {
  return pacientes.map(transformarPaciente);
}
