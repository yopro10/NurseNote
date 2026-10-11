import { useState } from 'react';
import { useApp } from '../context/AppContext';

interface SignosVitalesFormProps {
  pacienteId: number;
  onGuardar: (datos: any) => void;
}

interface SignosVitales {
  presion_sistolica: string;
  presion_diastolica: string;
  frecuencia_cardiaca: string;
  temperatura: string;
  saturacion_oxigeno: string;
  frecuencia_respiratoria: string;
  glucosa: string;
  peso: string;
  altura: string;
  observaciones: string;
}

export default function SignosVitalesForm({ pacienteId, onGuardar }: SignosVitalesFormProps) {
  const { usuarioActual } = useApp();
  const [signos, setSignos] = useState<SignosVitales>({
    presion_sistolica: '',
    presion_diastolica: '',
    frecuencia_cardiaca: '',
    temperatura: '',
    saturacion_oxigeno: '',
    frecuencia_respiratoria: '',
    glucosa: '',
    peso: '',
    altura: '',
    observaciones: ''
  });
  const [alertas, setAlertas] = useState<string[]>([]);

  const validarYCalcularAlertas = () => {
    const nuevasAlertas: string[] = [];

    // Validar y calcular alertas
    if (signos.saturacion_oxigeno) {
      const spo2 = parseInt(signos.saturacion_oxigeno);
      if (spo2 < 90) nuevasAlertas.push('SpO₂ crítico - Requiere atención inmediata');
      else if (spo2 < 95) nuevasAlertas.push('SpO₂ bajo - Monitorear');
    }

    if (signos.presion_sistolica && signos.presion_diastolica) {
      const sistolica = parseInt(signos.presion_sistolica);
      const diastolica = parseInt(signos.presion_diastolica);
      if (sistolica > 140 || diastolica > 90) nuevasAlertas.push('Presión arterial alta');
      else if (sistolica < 90 || diastolica < 60) nuevasAlertas.push('Presión arterial baja');
    }

    if (signos.temperatura) {
      const temp = parseFloat(signos.temperatura);
      if (temp > 38) nuevasAlertas.push('Fiebre');
      else if (temp < 36) nuevasAlertas.push('Hipotermia');
    }

    if (signos.frecuencia_cardiaca) {
      const fc = parseInt(signos.frecuencia_cardiaca);
      if (fc > 100) nuevasAlertas.push('Taquicardia');
      else if (fc < 60) nuevasAlertas.push('Bradicardia');
    }

    setAlertas(nuevasAlertas);
    return nuevasAlertas;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const alertas = validarYCalcularAlertas();

    const datos = {
      paciente_id: pacienteId,
      usuario_id: usuarioActual?.id,
      ...signos,
      presion_sistolica: signos.presion_sistolica ? parseInt(signos.presion_sistolica) : null,
      presion_diastolica: signos.presion_diastolica ? parseInt(signos.presion_diastolica) : null,
      frecuencia_cardiaca: signos.frecuencia_cardiaca ? parseInt(signos.frecuencia_cardiaca) : null,
      temperatura: signos.temperatura ? parseFloat(signos.temperatura) : null,
      saturacion_oxigeno: signos.saturacion_oxigeno ? parseInt(signos.saturacion_oxigeno) : null,
      frecuencia_respiratoria: signos.frecuencia_respiratoria ? parseInt(signos.frecuencia_respiratoria) : null,
      glucosa: signos.glucosa ? parseInt(signos.glucosa) : null,
      peso: signos.peso ? parseFloat(signos.peso) : null,
      altura: signos.altura ? parseInt(signos.altura) : null
    };

    onGuardar({ datos, alertas });
  };

  const getEstadoCampo = (valor: string, rango: { min: number; max: number }) => {
    if (!valor) return '';
    const num = parseFloat(valor);
    if (num < rango.min) return 'bajo';
    if (num > rango.max) return 'alto';
    return 'normal';
  };

  return (
    <form className="signos-vitales-form" onSubmit={handleSubmit}>
      <div className="grid-campos">
        <label className="campo">
          <span>Presión Arterial (mmHg)</span>
          <div className="campo__grupo">
            <input
              type="number"
              placeholder="Sistólica"
              value={signos.presion_sistolica}
              onChange={(e) => setSignos({ ...signos, presion_sistolica: e.target.value })}
              className={`campo__input ${getEstadoCampo(signos.presion_sistolica, { min: 90, max: 140 })}`}
            />
            <span>/</span>
            <input
              type="number"
              placeholder="Diastólica"
              value={signos.presion_diastolica}
              onChange={(e) => setSignos({ ...signos, presion_diastolica: e.target.value })}
              className={`campo__input ${getEstadoCampo(signos.presion_diastolica, { min: 60, max: 90 })}`}
            />
          </div>
          <small>Rango normal: 90-140 / 60-90 mmHg</small>
        </label>

        <label className="campo">
          <span>Frecuencia Cardíaca (lpm)</span>
          <input
            type="number"
            value={signos.frecuencia_cardiaca}
            onChange={(e) => setSignos({ ...signos, frecuencia_cardiaca: e.target.value })}
            placeholder="60-100"
            className={`campo__input ${getEstadoCampo(signos.frecuencia_cardiaca, { min: 60, max: 100 })}`}
          />
          <small>Rango normal: 60-100 lpm</small>
        </label>

        <label className="campo">
          <span>Temperatura (°C)</span>
          <input
            type="number"
            step="0.1"
            value={signos.temperatura}
            onChange={(e) => setSignos({ ...signos, temperatura: e.target.value })}
            placeholder="36-37.5"
            className={`campo__input ${getEstadoCampo(signos.temperatura, { min: 36, max: 37.5 })}`}
          />
          <small>Rango normal: 36-37.5°C</small>
        </label>

        <label className="campo">
          <span>Saturación de Oxígeno (%)</span>
          <input
            type="number"
            value={signos.saturacion_oxigeno}
            onChange={(e) => setSignos({ ...signos, saturacion_oxigeno: e.target.value })}
            placeholder="95-100"
            className={`campo__input ${getEstadoCampo(signos.saturacion_oxigeno, { min: 95, max: 100 })}`}
          />
          <small>Rango normal: 95-100%</small>
        </label>

        <label className="campo">
          <span>Frecuencia Respiratoria (rpm)</span>
          <input
            type="number"
            value={signos.frecuencia_respiratoria}
            onChange={(e) => setSignos({ ...signos, frecuencia_respiratoria: e.target.value })}
            placeholder="12-20"
          />
          <small>Rango normal: 12-20 rpm</small>
        </label>

        <label className="campo">
          <span>Glucosa (mg/dL)</span>
          <input
            type="number"
            value={signos.glucosa}
            onChange={(e) => setSignos({ ...signos, glucosa: e.target.value })}
            placeholder="70-140"
          />
          <small>Rango normal: 70-140 mg/dL</small>
        </label>

        <label className="campo">
          <span>Peso (kg)</span>
          <input
            type="number"
            step="0.1"
            value={signos.peso}
            onChange={(e) => setSignos({ ...signos, peso: e.target.value })}
            placeholder="Peso en kg"
          />
        </label>

        <label className="campo">
          <span>Altura (cm)</span>
          <input
            type="number"
            value={signos.altura}
            onChange={(e) => setSignos({ ...signos, altura: e.target.value })}
            placeholder="Altura en cm"
          />
        </label>

        <label className="campo">
          <span>Observaciones</span>
          <textarea
            value={signos.observaciones}
            onChange={(e) => setSignos({ ...signos, observaciones: e.target.value })}
            placeholder="Observaciones adicionales..."
            rows={3}
          />
        </label>
      </div>

      {alertas.length > 0 && (
        <div className="alertas-signos">
          <h4>⚠️ Alertas Detectadas:</h4>
          <ul>
            {alertas.map((alerta, index) => (
              <li key={index} className="alerta-signos__item">
                {alerta}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="signos-vitales-form__acciones">
        <button type="button" className="boton boton--fantasma" onClick={() => setSignos({
          presion_sistolica: '',
          presion_diastolica: '',
          frecuencia_cardiaca: '',
          temperatura: '',
          saturacion_oxigeno: '',
          frecuencia_respiratoria: '',
          glucosa: '',
          peso: '',
          altura: '',
          observaciones: ''
        })}>
          Limpiar
        </button>
        <button type="submit" className="boton boton--primario">
          Registrar Signos Vitales
        </button>
      </div>
    </form>
  );
}
