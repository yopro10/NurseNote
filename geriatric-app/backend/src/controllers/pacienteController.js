import { PacienteModel } from '../models/pacienteModel.js';

export class PacienteController {
  static async create(req, res) {
    try {
      const datos = req.body;
      const nuevoPaciente = await PacienteModel.create(datos);

      res.status(201).json({
        message: 'Paciente registrado exitosamente',
        paciente: nuevoPaciente
      });
    } catch (error) {
      console.error('Error al crear paciente:', error);
      res.status(500).json({ error: 'Error al crear paciente' });
    }
  }

  static async getAll(req, res) {
    try {
      const filtros = req.query;
      const pacientes = await PacienteModel.getAll(filtros);

      res.json(pacientes);
    } catch (error) {
      console.error('Error al obtener pacientes:', error);
      res.status(500).json({ error: 'Error al obtener pacientes' });
    }
  }

  static async getById(req, res) {
    try {
      const { id } = req.params;
      const paciente = await PacienteModel.findById(id);

      if (!paciente) {
        return res.status(404).json({ error: 'Paciente no encontrado' });
      }

      res.json(paciente);
    } catch (error) {
      console.error('Error al obtener paciente:', error);
      res.status(500).json({ error: 'Error al obtener paciente' });
    }
  }

  static async update(req, res) {
    try {
      const { id } = req.params;
      const datos = req.body;

      const pacienteActualizado = await PacienteModel.update(id, datos);

      if (!pacienteActualizado) {
        return res.status(404).json({ error: 'Paciente no encontrado' });
      }

      res.json({
        message: 'Paciente actualizado exitosamente',
        paciente: pacienteActualizado
      });
    } catch (error) {
      console.error('Error al actualizar paciente:', error);
      res.status(500).json({ error: 'Error al actualizar paciente' });
    }
  }

  static async delete(req, res) {
    try {
      const { id } = req.params;

      const pacienteEliminado = await PacienteModel.delete(id);

      if (!pacienteEliminado) {
        return res.status(404).json({ error: 'Paciente no encontrado' });
      }

      res.json({
        message: 'Paciente eliminado exitosamente',
        paciente: pacienteEliminado
      });
    } catch (error) {
      console.error('Error al eliminar paciente:', error);
      res.status(500).json({ error: 'Error al eliminar paciente' });
    }
  }

  static async getByHabitacion(req, res) {
    try {
      const { habitacion } = req.params;
      const pacientes = await PacienteModel.getByHabitacion(habitacion);

      res.json(pacientes);
    } catch (error) {
      console.error('Error al obtener pacientes por habitación:', error);
      res.status(500).json({ error: 'Error al obtener pacientes por habitación' });
    }
  }

  static async getHistorial(req, res) {
    try {
      const { id } = req.params;
      const historial = await PacienteModel.getHistorial(id);

      if (!historial) {
        return res.status(404).json({ error: 'Paciente no encontrado' });
      }

      res.json(historial);
    } catch (error) {
      console.error('Error al obtener historial del paciente:', error);
      res.status(500).json({ error: 'Error al obtener historial del paciente' });
    }
  }
}