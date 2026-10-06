import PatientPicker from '../components/PatientPicker';

export default function MedicamentosView() {
  return (
    <PatientPicker
      titulo="Medicamentos"
      descripcion="Elige un residente para registrar la administración de sus medicamentos."
    />
  );
}
