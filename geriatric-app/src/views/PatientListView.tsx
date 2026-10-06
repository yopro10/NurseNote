import { useApp } from '../context/AppContext';
import PatientPicker from '../components/PatientPicker';

export default function PatientListView() {
  const { vista } = useApp();

  if (vista === 'gestion_pacientes') {
    return (
      <PatientPicker
        titulo="Residentes"
        descripcion="Consulta la lista completa de residentes y abre el registro clínico de cualquiera de ellos."
        textoAccion="Abrir registro"
      />
    );
  }

  return (
    <PatientPicker
      titulo="Notas de enfermería"
      descripcion="Elige un residente para registrar una nueva nota de evolución."
    />
  );
}
