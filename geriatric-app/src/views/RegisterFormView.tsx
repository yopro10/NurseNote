import { FormEvent, useState } from 'react';
import { useApp } from '../context/AppContext';
import ConfirmationModal from '../components/ConfirmationModal';
import { IconoCheck, IconoVolver } from '../components/Icons';
import type { NotaEnfermeria, TipoNota } from '../types';
import type { PacienteConCalculos } from '../utils/patientHelpers';

export default function RegisterFormView() {
  const {
    pacienteSeleccionado,
    moduloSeleccionado,
    notasPacienteActual,
    guardarNota,
    cargando,
    irADashboard,
    usuarioActual,
  } = useApp();

  const tipo: TipoNota = moduloSeleccionado ?? 'evolucion';

  const [contenido, setContenido] = useState('');
  const [signosVitales, setSignosVitales] = useState({
    presion_arterial: '',
    frecuencia_cardiaca: '',
    temperatura: '',
    saturacion_oxigeno: '',
    frecuencia_respiratoria: '',
  });
  const [observaciones, setObservaciones] = useState('');
  const [modalAbierto, setModalAbierto] = useState(false);
  const [guardadoExitoso, setGuardadoExitoso] = useState(false);

  if (!pacienteSeleccionado) return null;

  const paciente = pacienteSeleccionado as PacienteConCalculos;

  const actualizarSignoVital = (campo: string, valor: string) => {
    setSignosVitales((prev) => ({
      ...prev,
      [campo]: valor,
    }));
  };

  const manejarEnvio = (e: FormEvent) => {
    e.preventDefault();
    setModalAbierto(true);
  };

  const confirmarGuardado = async () => {
    try {
      const notaData: Omit<NotaEnfermeria, 'id' | 'fecha_registro' | 'usuario_id'> = {
        paciente_id: paciente.id,
        tipo_nota: tipo,
        contenido: contenido || undefined,
        signos_vitales: tipo === 'signos_vitales' ? signosVitales : undefined,
        observaciones: observaciones || undefined,
        estado_paciente: paciente.estado,
      };

      await guardarNota(notaData);
      setModalAbierto(false);
      setContenido('');
      setSignosVitales({
        presion_arterial: '',
        frecuencia_cardiaca: '',
        temperatura: '',
        saturacion_oxigeno: '',
        frecuencia_respiratoria: '',
      });
      setObservaciones('');
      setGuardadoExitoso(true);
      setTimeout(() => setGuardadoExitoso(false), 3500);
    } catch (error) {
      console.error('Error al guardar nota:', error);
    }
  };

  const getTitulo = () => {
    switch (tipo) {
      case 'evolucion':
        return 'Nota de Evolución';
      case 'signos_vitales':
        return 'Signos Vitales';
      case 'medicacion':
        return 'Administración de Medicamentos';
      case 'ingreso':
        return 'Nota de Ingreso';
      case 'egreso':
        return 'Nota de Egreso';
      case 'observacion':
        return 'Observación';
      default:
        return 'Registro';
    }
  };

  return (
    <div className="registro-vista">
      <div>
        <button type="button" className="enlace-volver" onClick={irADashboard}>
          <IconoVolver size={16} />
          Panel principal
        </button>

        <div className="ficha-paciente">
          <span className={`avatar avatar--grande avatar--tono-${paciente.id % 6}`}>{paciente.avatarIniciales}</span>
          <div>
            <h2>{paciente.nombreCompleto}</h2>
            <div className="ficha-paciente__datos">
              <span className="dato">CC {paciente.cedula}</span>
              <span className="dato">{paciente.edad} años</span>
              <span className="dato">Habitación {paciente.habitacion}</span>
              {paciente.alergias && <span className="dato dato--alergia">Alergias: {paciente.alergias}</span>}
            </div>
          </div>
        </div>
      </div>

      {guardadoExitoso && (
        <div className="alerta alerta--exito" role="status">
          <IconoCheck size={20} />
          Registro guardado correctamente.
        </div>
      )}

      <div className="registro-vista__cuerpo">
        <form className="tarjeta-formulario" onSubmit={manejarEnvio}>
          <h3>{getTitulo()}</h3>

          {tipo === 'signos_vitales' && (
            <div className="grid-campos">
              <label className="campo">
                <span>Presión arterial (mmHg)</span>
                <input
                  type="text"
                  placeholder="120/80"
                  value={signosVitales.presion_arterial}
                  onChange={(e) => actualizarSignoVital('presion_arterial', e.target.value)}
                  required
                />
              </label>
              <label className="campo">
                <span>Frecuencia cardíaca (lpm)</span>
                <input
                  type="number"
                  value={signosVitales.frecuencia_cardiaca}
                  onChange={(e) => actualizarSignoVital('frecuencia_cardiaca', e.target.value)}
                  required
                />
              </label>
              <label className="campo">
                <span>Temperatura (°C)</span>
                <input
                  type="number"
                  step="0.1"
                  value={signosVitales.temperatura}
                  onChange={(e) => actualizarSignoVital('temperatura', e.target.value)}
                  required
                />
              </label>
              <label className="campo">
                <span>Saturación de O₂ (%)</span>
                <input
                  type="number"
                  value={signosVitales.saturacion_oxigeno}
                  onChange={(e) => actualizarSignoVital('saturacion_oxigeno', e.target.value)}
                  required
                />
              </label>
              <label className="campo">
                <span>Frecuencia respiratoria (rpm)</span>
                <input
                  type="number"
                  value={signosVitales.frecuencia_respiratoria}
                  onChange={(e) => actualizarSignoVital('frecuencia_respiratoria', e.target.value)}
                />
              </label>
            </div>
          )}

          {(tipo === 'evolucion' || tipo === 'ingreso' || tipo === 'egreso' || tipo === 'observacion') && (
            <label className="campo">
              <span>Contenido de la nota</span>
              <textarea
                rows={4}
                placeholder="Describe el estado general, comportamiento o novedades del residente…"
                value={contenido}
                onChange={(e) => setContenido(e.target.value)}
                required
              />
            </label>
          )}

          {tipo === 'medicacion' && (
            <label className="campo">
              <span>Medicamento administrado</span>
              <textarea
                rows={3}
                placeholder="Nombre del medicamento, dosis, vía de administración…"
                value={contenido}
                onChange={(e) => setContenido(e.target.value)}
                required
              />
            </label>
          )}

          <label className="campo">
            <span>Observaciones adicionales</span>
            <textarea
              rows={3}
              placeholder="Opcional"
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
            />
          </label>

          <div className="tarjeta-formulario__pie">
            <span>
              Registrado por <strong>{usuarioActual?.nombre} {usuarioActual?.apellido || ''}</strong> · {new Date().toLocaleString('es-CO')}
            </span>
            <button type="submit" className="boton boton--exito boton--grande">
              Guardar
            </button>
          </div>
        </form>

        <div className="tarjeta-historial">
          <h3>Historial de {getTitulo().toLowerCase()}</h3>
          <div className="tabla-contenedor tabla-contenedor--historial">
            <table className="tabla tabla--compacta">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Autor</th>
                  <th>Detalle</th>
                </tr>
              </thead>
              <tbody>
                {notasPacienteActual
                  .filter((n) => n.tipo_nota === tipo)
                  .map((nota) => (
                    <tr key={nota.id}>
                      <td>{new Date(nota.fecha_registro).toLocaleString('es-CO')}</td>
                      <td>{nota.usuario_nombre} {nota.usuario_apellido || ''}</td>
                      <td>{nota.contenido || nota.signos_vitales ? 'Ver detalles' : '—'}</td>
                    </tr>
                  ))}

                {notasPacienteActual.filter((n) => n.tipo_nota === tipo).length === 0 && (
                  <tr>
                    <td colSpan={3} className="tabla__vacio">
                      Aún no hay registros de este tipo para este residente.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <ConfirmationModal
        abierto={modalAbierto}
        titulo="¿Estás seguro de guardar?"
        mensaje="Este registro quedará asociado permanentemente al historial clínico del residente."
        textoAceptar="Guardar registro"
        cargando={cargando}
        onAceptar={confirmarGuardado}
        onCancelar={() => setModalAbierto(false)}
      />
    </div>
  );
}
