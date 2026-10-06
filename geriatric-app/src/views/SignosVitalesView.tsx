import PatientPicker from '../components/PatientPicker';

export default function SignosVitalesView() {
  return (
    <PatientPicker
      titulo="Signos vitales"
      descripcion="Elige un residente para registrar presión arterial, frecuencia cardíaca, temperatura y saturación de oxígeno."
    />
  );
}
