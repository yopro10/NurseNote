import { useApp } from '../context/AppContext';
import PatientPicker from '../components/PatientPicker';
import ResidenteFormModal from '../components/ResidenteFormModal';
import { useState } from 'react';

export default function PatientListView() {
  const { vista, irAFichaResidente, usuarioActual } = useApp();
  const [modalAbierto, setModalAbierto] = useState(false);
  const [pacienteEditar, setPacienteEditar] = useState<any>(null);

  const handleCrearResidente = async (datos: any) => {
    try {
      const response = await fetch('http://localhost:3000/api/pacientes', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(datos)
      });

      if (!response.ok) {
        throw new Error('Error al crear residente');
      }

      alert('Residente creado exitosamente');
      // Recargar la lista
      window.location.reload();
    } catch (error) {
      console.error('Error:', error);
      alert('Error al crear residente');
    }
  };

  const handleEditarResidente = async (datos: any) => {
    try {
      const response = await fetch(`http://localhost:3000/api/pacientes/${pacienteEditar.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(datos)
      });

      if (!response.ok) {
        throw new Error('Error al actualizar residente');
      }

      alert('Residente actualizado exitosamente');
      window.location.reload();
    } catch (error) {
      console.error('Error:', error);
      alert('Error al actualizar residente');
    }
  };

  const handleEgresarResidente = async (paciente: any) => {
    if (!confirm(`¿Estás seguro de egresar a ${paciente.nombre} ${paciente.apellido}?`)) {
      return;
    }

    try {
      const response = await fetch(`http://localhost:3000/api/pacientes/${paciente.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Error al egresar residente');
      }

      alert('Residente egresado exitosamente');
      window.location.reload();
    } catch (error) {
      console.error('Error:', error);
      alert('Error al egresar residente');
    }
  };

  if (vista === 'gestion_pacientes') {
    return (
      <>
        {(usuarioActual?.rol === 'administrador' || usuarioActual?.rol === 'jefe_enfermeria') && (
          <div style={{ marginBottom: '20px' }}>
            <button
              className="boton boton--primario"
              onClick={() => {
                setPacienteEditar(null);
                setModalAbierto(true);
              }}
            >
              + Nuevo Residente
            </button>
          </div>
        )}
        <PatientPicker
          titulo="Residentes"
          descripcion="Consulta la lista completa de residentes y abre su ficha completa."
          textoAccion="Ver ficha"
          onSeleccionar={(paciente) => irAFichaResidente(paciente)}
          onEditar={(paciente) => {
            setPacienteEditar(paciente);
            setModalAbierto(true);
          }}
          onEgresar={handleEgresarResidente}
          mostrarAcciones={usuarioActual?.rol === 'administrador' || usuarioActual?.rol === 'jefe_enfermeria'}
        />
        <ResidenteFormModal
          isOpen={modalAbierto}
          onClose={() => setModalAbierto(false)}
          onSave={pacienteEditar ? handleEditarResidente : handleCrearResidente}
          paciente={pacienteEditar}
        />
      </>
    );
  }

  return (
    <PatientPicker
      titulo="Notas de enfermería"
      descripcion="Elige un residente para registrar una nueva nota de evolución."
      onSeleccionar={(paciente) => irAFichaResidente(paciente)}
    />
  );
}
