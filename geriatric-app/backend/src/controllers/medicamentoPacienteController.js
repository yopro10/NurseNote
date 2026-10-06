import { MedicamentoPacienteModel } from '../models/medicamentoPacienteModel.js';

export class MedicamentoPacienteController {
  static async create(req, res) {
    try {
      const {
        paciente_id,
        medicamento_id,
        dosis_prescrita,
        frecuencia,
        via_administracion,
        fecha_inicio,
        fecha_fin,
        observaciones
      } = req.body;

      // Validaciones básicas
      if (!paciente_id || !medicamento_id || !dosis_prescrita || !frecuencia || !fecha_inicio) {
        return res.status(400).json({
          error: 'Campos requeridos: paciente_id, medicamento_id, dosis_prescrita, frecuencia, fecha_inicio'
        });
      }

      const asignacion = await MedicamentoPacienteModel.create({
        paciente_id,
        medicamento_id,
        dosis_prescrita,
        frecuencia,
        via_administracion,
        fecha_inicio,
        fecha_fin,
        observaciones
      });

      res.status(201).json({
        message: 'Medicamento asignado al paciente exitosamente',
        data: asignacion
      });
    } catch (error) {
      console.error('Error al asignar medicamento:', error);
      res.status(500).json({ error: 'Error al asignar medicamento al paciente' });
    }
  }

  static async getById(req, res) {
    try {
      const { id } = req.params;
      const asignacion = await MedicamentoPacienteModel.findById(id);

      if (!asignacion) {
        return res.status(404).json({ error: 'Asignación no encontrada' });
      }

      res.json(asignacion);
    } catch (error) {
      console.error('Error al obtener asignación:', error);
      res.status(500).json({ error: 'Error al obtener asignación' });
    }
  }

  static async getByPaciente(req, res) {
    try {
      const { pacienteId } = req.params;
      const { activo } = req.query;

      const soloActivos = activo === undefined ? true : activo === 'true';
      const asignaciones = await MedicamentoPacienteModel.getByPaciente(pacienteId, soloActivos);

      res.json(asignaciones);
    } catch (error) {
      console.error('Error al obtener medicamentos del paciente:', error);
      res.status(500).json({ error: 'Error al obtener medicamentos del paciente' });
    }
  }

  static async getByMedicamento(req, res) {
    try {
      const { medicamentoId } = req.params;
      const { activo } = req.query;

      const soloActivos = activo === undefined ? true : activo === 'true';
      const asignaciones = await MedicamentoPacienteModel.getByMedicamento(medicamentoId, soloActivos);

      res.json(asignaciones);
    } catch (error) {
      console.error('Error al obtener pacientes con medicamento:', error);
      res.status(500).json({ error: 'Error al obtener pacientes con medicamento' });
    }
  }

  static async getAll(req, res) {
    try {
      const { paciente_id, medicamento_id, activo } = req.query;

      const filtros = {};
      if (paciente_id) filtros.paciente_id = parseInt(paciente_id);
      if (medicamento_id) filtros.medicamento_id = parseInt(medicamento_id);
      if (activo !== undefined) filtros.activo = activo === 'true';

      const asignaciones = await MedicamentoPacienteModel.getAll(filtros);

      res.json(asignaciones);
    } catch (error) {
      console.error('Error al obtener asignaciones:', error);
      res.status(500).json({ error: 'Error al obtener asignaciones' });
    }
  }

  static async update(req, res) {
    try {
      const { id } = req.params;
      const datos = req.body;

      const asignacion = await MedicamentoPacienteModel.update(id, datos);

      if (!asignacion) {
        return res.status(404).json({ error: 'Asignación no encontrada' });
      }

      res.json({
        message: 'Asignación actualizada exitosamente',
        data: asignacion
      });
    } catch (error) {
      console.error('Error al actualizar asignación:', error);
      res.status(500).json({ error: 'Error al actualizar asignación' });
    }
  }

  static async delete(req, res) {
    try {
      const { id } = req.params;
      const asignacion = await MedicamentoPacienteModel.delete(id);

      if (!asignacion) {
        return res.status(404).json({ error: 'Asignación no encontrada' });
      }

      res.json({
        message: 'Asignación desactivada exitosamente',
        data: asignacion
      });
    } catch (error) {
      console.error('Error al desactivar asignación:', error);
      res.status(500).json({ error: 'Error al desactivar asignación' });
    }
  }

  static async getMedicamentosActivosPorPaciente(req, res) {
    try {
      const { pacienteId } = req.params;
      const medicamentos = await MedicamentoPacienteModel.getMedicamentosActivosPorPaciente(pacienteId);

      res.json(medicamentos);
    } catch (error) {
      console.error('Error al obtener medicamentos activos:', error);
      res.status(500).json({ error: 'Error al obtener medicamentos activos' });
    }
  }

  static async getHistorialPorPaciente(req, res) {
    try {
      const { pacienteId } = req.params;
      const historial = await MedicamentoPacienteModel.getHistorialPorPaciente(pacienteId);

      res.json(historial);
    } catch (error) {
      console.error('Error al obtener historial:', error);
      res.status(500).json({ error: 'Error al obtener historial' });
    }
  }

  static async getEstadisticas(req, res) {
    try {
      const estadisticas = await MedicamentoPacienteModel.getEstadisticas();

      res.json(estadisticas);
    } catch (error) {
      console.error('Error al obtener estadísticas:', error);
      res.status(500).json({ error: 'Error al obtener estadísticas' });
    }
  }
}
