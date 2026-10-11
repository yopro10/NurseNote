import { useState, useEffect } from 'react';
import { IconoCerrar } from './Icons';

interface PacienteFormData {
  nombre: string;
  apellido: string;
  fecha_nacimiento: string;
  genero: 'masculino' | 'femenino' | 'otro';
  direccion: string;
  telefono: string;
  contacto_emergencia: string;
  telefono_emergencia: string;
  alergias: string;
  enfermedades_cronicas: string;
  habitacion: string;
}

interface ResidenteFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (datos: PacienteFormData) => Promise<void>;
  paciente?: any; // Si se proporciona, es modo edición
}

export default function ResidenteFormModal({ isOpen, onClose, onSave, paciente }: ResidenteFormModalProps) {
  const [formData, setFormData] = useState<PacienteFormData>({
    nombre: '',
    apellido: '',
    fecha_nacimiento: '',
    genero: 'otro',
    direccion: '',
    telefono: '',
    contacto_emergencia: '',
    telefono_emergencia: '',
    alergias: '',
    enfermedades_cronicas: '',
    habitacion: '',
  });

  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (paciente) {
      setFormData({
        nombre: paciente.nombre || '',
        apellido: paciente.apellido || '',
        fecha_nacimiento: paciente.fecha_nacimiento || '',
        genero: paciente.genero || 'otro',
        direccion: paciente.direccion || '',
        telefono: paciente.telefono || '',
        contacto_emergencia: paciente.contacto_emergencia || '',
        telefono_emergencia: paciente.telefono_emergencia || '',
        alergias: paciente.alergias || '',
        enfermedades_cronicas: paciente.enfermedades_cronicas || '',
        habitacion: paciente.habitacion || '',
      });
    } else {
      setFormData({
        nombre: '',
        apellido: '',
        fecha_nacimiento: '',
        genero: 'otro',
        direccion: '',
        telefono: '',
        contacto_emergencia: '',
        telefono_emergencia: '',
        alergias: '',
        enfermedades_cronicas: '',
        habitacion: '',
      });
    }
  }, [paciente, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGuardando(true);
    setError('');

    try {
      await onSave(formData);
      onClose();
    } catch (err) {
      setError('Error al guardar el residente');
    } finally {
      setGuardando(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal--largo" onClick={(e) => e.stopPropagation()}>
        <div className="modal__cabecera">
          <h2>{paciente ? 'Editar Residente' : 'Nuevo Residente'}</h2>
          <button type="button" className="boton boton--fantasma" onClick={onClose} aria-label="Cerrar">
            <IconoCerrar size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal__cuerpo">
          {error && <div className="alerta alerta--error">{error}</div>}

          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="nombre">Nombre *</label>
              <input
                type="text"
                id="nombre"
                required
                value={formData.nombre}
                onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label htmlFor="apellido">Apellido *</label>
              <input
                type="text"
                id="apellido"
                required
                value={formData.apellido}
                onChange={(e) => setFormData({ ...formData, apellido: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label htmlFor="fecha_nacimiento">Fecha de nacimiento *</label>
              <input
                type="date"
                id="fecha_nacimiento"
                required
                value={formData.fecha_nacimiento}
                onChange={(e) => setFormData({ ...formData, fecha_nacimiento: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label htmlFor="genero">Género *</label>
              <select
                id="genero"
                required
                value={formData.genero}
                onChange={(e) => setFormData({ ...formData, genero: e.target.value as any })}
              >
                <option value="masculino">Masculino</option>
                <option value="femenino">Femenino</option>
                <option value="otro">Otro</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="habitacion">Habitación *</label>
              <input
                type="text"
                id="habitacion"
                required
                value={formData.habitacion}
                onChange={(e) => setFormData({ ...formData, habitacion: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label htmlFor="telefono">Teléfono</label>
              <input
                type="tel"
                id="telefono"
                value={formData.telefono}
                onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
              />
            </div>

            <div className="form-group form-group--completo">
              <label htmlFor="direccion">Dirección</label>
              <input
                type="text"
                id="direccion"
                value={formData.direccion}
                onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label htmlFor="contacto_emergencia">Contacto de emergencia</label>
              <input
                type="text"
                id="contacto_emergencia"
                value={formData.contacto_emergencia}
                onChange={(e) => setFormData({ ...formData, contacto_emergencia: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label htmlFor="telefono_emergencia">Teléfono de emergencia</label>
              <input
                type="tel"
                id="telefono_emergencia"
                value={formData.telefono_emergencia}
                onChange={(e) => setFormData({ ...formData, telefono_emergencia: e.target.value })}
              />
            </div>

            <div className="form-group form-group--completo">
              <label htmlFor="alergias">Alergias</label>
              <textarea
                id="alergias"
                rows={2}
                value={formData.alergias}
                onChange={(e) => setFormData({ ...formData, alergias: e.target.value })}
              />
            </div>

            <div className="form-group form-group--completo">
              <label htmlFor="enfermedades_cronicas">Enfermedades crónicas</label>
              <textarea
                id="enfermedades_cronicas"
                rows={2}
                value={formData.enfermedades_cronicas}
                onChange={(e) => setFormData({ ...formData, enfermedades_cronicas: e.target.value })}
              />
            </div>
          </div>

          <div className="modal__pie">
            <button type="button" className="boton boton--secundario" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="boton boton--primario" disabled={guardando}>
              {guardando ? 'Guardando...' : paciente ? 'Actualizar' : 'Crear'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
