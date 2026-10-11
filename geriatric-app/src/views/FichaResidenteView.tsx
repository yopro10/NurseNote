import { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import Tabs from '../components/Tabs';
import { IconoPacientes, IconoVitales, IconoMedicamentos, IconoNotas } from '../components/Icons';
import SignosVitalesForm from '../components/SignosVitalesForm';
import SignosVitalesGraficas from '../components/SignosVitalesGraficas';

interface PacienteDetalle {
  id: number;
  nombre: string;
  apellido: string;
  fecha_nacimiento: string;
  genero: string;
  habitacion: string;
  alergias: string;
  enfermedades_cronicas: string;
  contacto_emergencia: string;
  telefono_emergencia: string;
  fecha_ingreso: string;
  estado_calculado: string;
}

export default function FichaResidenteView() {
  const { pacienteSeleccionado, usuarioActual } = useApp();
  const [paciente, setPaciente] = useState<PacienteDetalle | null>(null);
  const [cargando, setCargando] = useState(true);
  const [signosRecientes, setSignosRecientes] = useState<any[]>([]);
  const [alertasSignos, setAlertasSignos] = useState<any[]>([]);

  useEffect(() => {
    if (pacienteSeleccionado) {
      cargarPacienteDetalle(pacienteSeleccionado.id);
      cargarSignosVitales(pacienteSeleccionado.id);
      cargarAlertas(pacienteSeleccionado.id);
    }
  }, [pacienteSeleccionado]);

  const cargarPacienteDetalle = async (id: number) => {
    try {
      const response = await fetch(`http://localhost:3000/api/pacientes/${id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      });
      const data = await response.json();
      setPaciente(data);
    } catch (error) {
      console.error('Error al cargar paciente:', error);
    } finally {
      setCargando(false);
    }
  };

  const cargarSignosVitales = async (id: number) => {
    try {
      const response = await fetch(`http://localhost:3000/api/signos-vitales/paciente/${id}/ultimos?limite=5`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      });
      const data = await response.json();
      setSignosRecientes(data);
    } catch (error) {
      console.error('Error al cargar signos vitales:', error);
    }
  };

  const cargarAlertas = async (id: number) => {
    try {
      const response = await fetch(`http://localhost:3000/api/signos-vitales/paciente/${id}/alertas`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      });
      const data = await response.json();
      setAlertasSignos(data);
    } catch (error) {
      console.error('Error al cargar alertas:', error);
    }
  };

  const handleGuardarSignos = async ({ datos, alertas }: { datos: any; alertas: string[] }) => {
    try {
      const response = await fetch('http://localhost:3000/api/signos-vitales', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(datos)
      });

      const result = await response.json();
      alert('Signos vitales registrados exitosamente');
      cargarSignosVitales(pacienteSeleccionado.id);
      cargarAlertas(pacienteSeleccionado.id);
    } catch (error) {
      console.error('Error al guardar signos vitales:', error);
      alert('Error al registrar signos vitales');
    }
  };

  if (cargando) {
    return (
      <div className="cargando-bloque">
        <div className="spinner"></div>
        <p>Cargando ficha del residente...</p>
      </div>
    );
  }

  if (!paciente) {
    return (
      <div className="cargando-bloque">
        <p>No hay residente seleccionado</p>
      </div>
    );
  }

  const calcularEdad = (fechaNacimiento: string) => {
    const hoy = new Date();
    const nacimiento = new Date(fechaNacimiento);
    const edad = hoy.getFullYear() - nacimiento.getFullYear();
    const mes = hoy.getMonth() - nacimiento.getMonth();
    return mes < 0 || (mes === 0 && hoy.getDate() < nacimiento.getDate()) ? edad - 1 : edad;
  };

  const tabs = [
    {
      id: 'resumen',
      label: 'Resumen',
      content: (
        <div className="ficha-resumen">
          <div className="ficha-resumen__encabezado">
            <div className="ficha-resumen__info">
              <h2>{paciente.nombre} {paciente.apellido}</h2>
              <p>Habitación {paciente.habitacion} · {calcularEdad(paciente.fecha_nacimiento)} años</p>
              <span className={`badge badge--${paciente.estado_calculado === 'Crítico' ? 'rojo' : paciente.estado_calculado === 'En Observación' ? 'ambar' : 'verde'}`}>
                {paciente.estado_calculado}
              </span>
            </div>
          </div>

          <div className="ficha-resumen__secciones">
            <div className="ficha-seccion">
              <h3>Información Personal</h3>
              <div className="ficha-seccion__contenido">
                <div className="dato-item">
                  <span className="dato-item__label">Fecha de nacimiento:</span>
                  <span className="dato-item__valor">{new Date(paciente.fecha_nacimiento).toLocaleDateString('es-ES')}</span>
                </div>
                <div className="dato-item">
                  <span className="dato-item__label">Género:</span>
                  <span className="dato-item__valor">{paciente.genero}</span>
                </div>
                <div className="dato-item">
                  <span className="dato-item__label">Fecha de ingreso:</span>
                  <span className="dato-item__valor">{new Date(paciente.fecha_ingreso).toLocaleDateString('es-ES')}</span>
                </div>
              </div>
            </div>

            <div className="ficha-seccion">
              <h3>Salud</h3>
              <div className="ficha-seccion__contenido">
                <div className="dato-item">
                  <span className="dato-item__label">Alergias:</span>
                  <span className="dato-item__valor dato-item__valor--alergia">
                    {paciente.alergias || 'Ninguna conocida'}
                  </span>
                </div>
                <div className="dato-item">
                  <span className="dato-item__label">Enfermedades crónicas:</span>
                  <span className="dato-item__valor">{paciente.enfermedades_cronicas || 'Ninguna'}</span>
                </div>
              </div>
            </div>

            <div className="ficha-seccion">
              <h3>Contacto de Emergencia</h3>
              <div className="ficha-seccion__contenido">
                <div className="dato-item">
                  <span className="dato-item__label">Nombre:</span>
                  <span className="dato-item__valor">{paciente.contacto_emergencia}</span>
                </div>
                <div className="dato-item">
                  <span className="dato-item__label">Teléfono:</span>
                  <span className="dato-item__valor">{paciente.telefono_emergencia}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'notas',
      label: 'Notas',
      content: (
        <div className="ficha-contenido">
          <div className="ficha-contenido__header">
            <h3>Notas de Enfermería</h3>
            <p>Historial de notas y evoluciones</p>
          </div>
          <div className="alerta alerta--info">
            <p>Las notas más recientes se cargarán aquí.</p>
          </div>
        </div>
      )
    },
    {
      id: 'signos',
      label: 'Signos Vitales',
      content: (
        <div className="ficha-contenido">
          <div className="ficha-contenido__header">
            <h3>Signos Vitales</h3>
            <p>Registro de signos vitales con alertas automáticas</p>
          </div>

          {alertasSignos.length > 0 && (
            <div className="alerta alerta--error">
              <h4>⚠️ Alertas Activas:</h4>
              <ul>
                {alertasSignos.map((alerta: any, index: number) => (
                  <li key={index}>{alerta.estado_alerta}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="signos-vitales-section">
            <h4>Registrar Signos Vitales</h4>
            <SignosVitalesForm
              pacienteId={paciente.id}
              onGuardar={handleGuardarSignos}
            />
          </div>

          {signosRecientes.length > 0 && (
            <div className="signos-vitales-section">
              <h4>Registros Recientes</h4>
              <div className="signos-historial">
                {signosRecientes.map((signo: any) => (
                  <div key={signo.id} className="signo-item">
                    <div className="signo-item__fecha">
                      {new Date(signo.fecha_registro).toLocaleString('es-ES')}
                    </div>
                    <div className="signo-item__datos">
                      <span>PA: {signo.presion_sistolica}/{signo.presion_diastolica} mmHg</span>
                      <span>FC: {signo.frecuencia_cardiaca} lpm</span>
                      <span>Temp: {signo.temperatura}°C</span>
                      <span>SpO₂: {signo.saturacion_oxigeno}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <SignosVitalesGraficas pacienteId={paciente.id} />
        </div>
      )
    },
    {
      id: 'medicamentos',
      label: 'Medicamentos',
      content: (
        <div className="ficha-contenido">
          <div className="ficha-contenido__header">
            <h3>Medicamentos Asignados</h3>
            <p>Prescripciones y administraciones</p>
          </div>
          <div className="alerta alerta--info">
            <p>El sistema de medicación se implementará aquí.</p>
          </div>
        </div>
      )
    },
    {
      id: 'contactos',
      label: 'Contactos',
      content: (
        <div className="ficha-contenido">
          <div className="ficha-contenido__header">
            <h3>Información de Contacto</h3>
            <p>Información completa del residente y familiares</p>
          </div>
          <div className="ficha-seccion">
            <h3>Contacto de Emergencia</h3>
            <div className="ficha-seccion__contenido">
              <div className="dato-item">
                <span className="dato-item__label">Nombre:</span>
                <span className="dato-item__valor">{paciente.contacto_emergencia}</span>
              </div>
              <div className="dato-item">
                <span className="dato-item__label">Teléfono:</span>
                <span className="dato-item__valor">{paciente.telefono_emergencia}</span>
              </div>
            </div>
          </div>
        </div>
      )
    }
  ];

  return (
    <div className="ficha-residente">
      <div className="pagina-cabecera">
        <h2>Ficha del Residente</h2>
        <p>Información completa y seguimiento del residente</p>
      </div>

      <Tabs tabs={tabs} defaultTab="resumen" />
    </div>
  );
}
