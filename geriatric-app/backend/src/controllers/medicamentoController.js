import { MedicamentoModel } from '../models/medicamentoModel.js';
import { MedicamentoPacienteModel } from '../models/medicamentoPacienteModel.js';

export class MedicamentoController {
  static async create(req, res) {
    try {
      const datos = req.body;
      const nuevoMedicamento = await MedicamentoModel.create(datos);

      res.status(201).json({
        message: 'Medicamento registrado exitosamente',
        medicamento: nuevoMedicamento
      });
    } catch (error) {
      console.error('Error al crear medicamento:', error);
      res.status(500).json({ error: 'Error al crear medicamento' });
    }
  }

  static async getAll(req, res) {
    try {
      const filtros = req.query;
      const medicamentos = await MedicamentoModel.getAll(filtros);

      res.json(medicamentos);
    } catch (error) {
      console.error('Error al obtener medicamentos:', error);
      res.status(500).json({ error: 'Error al obtener medicamentos' });
    }
  }

  static async getById(req, res) {
    try {
      const { id } = req.params;
      const medicamento = await MedicamentoModel.findById(id);

      if (!medicamento) {
        return res.status(404).json({ error: 'Medicamento no encontrado' });
      }

      res.json(medicamento);
    } catch (error) {
      console.error('Error al obtener medicamento:', error);
      res.status(500).json({ error: 'Error al obtener medicamento' });
    }
  }

  static async update(req, res) {
    try {
      const { id } = req.params;
      const datos = req.body;

      const medicamentoActualizado = await MedicamentoModel.update(id, datos);

      if (!medicamentoActualizado) {
        return res.status(404).json({ error: 'Medicamento no encontrado' });
      }

      res.json({
        message: 'Medicamento actualizado exitosamente',
        medicamento: medicamentoActualizado
      });
    } catch (error) {
      console.error('Error al actualizar medicamento:', error);
      res.status(500).json({ error: 'Error al actualizar medicamento' });
    }
  }

  static async delete(req, res) {
    try {
      const { id } = req.params;

      const medicamentoEliminado = await MedicamentoModel.delete(id);

      if (!medicamentoEliminado) {
        return res.status(404).json({ error: 'Medicamento no encontrado' });
      }

      res.json({
        message: 'Medicamento eliminado exitosamente',
        medicamento: medicamentoEliminado
      });
    } catch (error) {
      console.error('Error al eliminar medicamento:', error);
      res.status(500).json({ error: 'Error al eliminar medicamento' });
    }
  }

  static async actualizarCantidad(req, res) {
    try {
      const { id } = req.params;
      const { cantidad } = req.body;

      if (cantidad === undefined || cantidad === null) {
        return res.status(400).json({ error: 'Cantidad es requerida' });
      }

      const medicamentoActualizado = await MedicamentoModel.actualizarCantidad(id, cantidad);

      if (!medicamentoActualizado) {
        return res.status(404).json({ error: 'Medicamento no encontrado' });
      }

      res.json({
        message: 'Cantidad actualizada exitosamente',
        medicamento: medicamentoActualizado
      });
    } catch (error) {
      console.error('Error al actualizar cantidad:', error);
      res.status(500).json({ error: 'Error al actualizar cantidad' });
    }
  }

  static async ajustarStock(req, res) {
    try {
      const { id } = req.params;
      const { cantidad, motivo } = req.body;

      if (cantidad === undefined || cantidad === null) {
        return res.status(400).json({ error: 'Cantidad es requerida' });
      }

      if (!motivo) {
        return res.status(400).json({ error: 'Motivo del ajuste es requerido' });
      }

      const medicamentoActualizado = await MedicamentoModel.ajustarStock(id, cantidad, motivo);

      if (!medicamentoActualizado) {
        return res.status(404).json({ error: 'Medicamento no encontrado' });
      }

      res.json({
        message: 'Stock ajustado exitosamente',
        medicamento: medicamentoActualizado
      });
    } catch (error) {
      console.error('Error al ajustar stock:', error);
      res.status(500).json({ error: 'Error al ajustar stock' });
    }
  }

  static async getAlertas(req, res) {
    try {
      const alertas = await MedicamentoModel.getAlertas();

      res.json({
        message: 'Alertas de medicamentos',
        alertas,
        total: alertas.length
      });
    } catch (error) {
      console.error('Error al obtener alertas:', error);
      res.status(500).json({ error: 'Error al obtener alertas' });
    }
  }

  static async getProximosVencer(req, res) {
    try {
      const dias = parseInt(req.query.dias) || 30;
      const medicamentos = await MedicamentoModel.getMedicamentosProximosVencer(dias);

      res.json({
        message: `Medicamentos próximos a vencer en los próximos ${dias} días`,
        medicamentos,
        total: medicamentos.length
      });
    } catch (error) {
      console.error('Error al obtener medicamentos próximos a vencer:', error);
      res.status(500).json({ error: 'Error al obtener medicamentos próximos a vencer' });
    }
  }

  static async getVencidos(req, res) {
    try {
      const medicamentos = await MedicamentoModel.getMedicamentosVencidos();

      res.json({
        message: 'Medicamentos vencidos',
        medicamentos,
        total: medicamentos.length
      });
    } catch (error) {
      console.error('Error al obtener medicamentos vencidos:', error);
      res.status(500).json({ error: 'Error al obtener medicamentos vencidos' });
    }
  }

  static async getBajoStock(req, res) {
    try {
      const minimo = parseInt(req.query.minimo) || 10;
      const medicamentos = await MedicamentoModel.getMedicamentosBajoStock(minimo);

      res.json({
        message: `Medicamentos con stock bajo (menos de ${minimo} unidades)`,
        medicamentos,
        total: medicamentos.length
      });
    } catch (error) {
      console.error('Error al obtener medicamentos bajo stock:', error);
      res.status(500).json({ error: 'Error al obtener medicamentos bajo stock' });
    }
  }

  // Métodos para medicamentos asignados a pacientes
  static async asignarAPaciente(req, res) {
    try {
      const datos = req.body;
      const nuevaAsignacion = await MedicamentoPacienteModel.create(datos);

      res.status(201).json({
        message: 'Medicamento asignado al paciente exitosamente',
        asignacion: nuevaAsignacion
      });
    } catch (error) {
      console.error('Error al asignar medicamento:', error);
      res.status(500).json({ error: 'Error al asignar medicamento al paciente' });
    }
  }

  static async getMedicamentosPaciente(req, res) {
    try {
      const { pacienteId } = req.params;
      const medicamentos = await MedicamentoPacienteModel.getMedicamentosActivosPorPaciente(pacienteId);

      res.json({
        message: 'Medicamentos activos del paciente',
        medicamentos,
        total: medicamentos.length
      });
    } catch (error) {
      console.error('Error al obtener medicamentos del paciente:', error);
      res.status(500).json({ error: 'Error al obtener medicamentos del paciente' });
    }
  }

  static async getPacientesMedicamento(req, res) {
    try {
      const { medicamentoId } = req.params;
      const pacientes = await MedicamentoPacienteModel.getByMedicamento(medicamentoId);

      res.json({
        message: 'Pacientes que tienen asignado este medicamento',
        pacientes,
        total: pacientes.length
      });
    } catch (error) {
      console.error('Error al obtener pacientes del medicamento:', error);
      res.status(500).json({ error: 'Error al obtener pacientes del medicamento' });
    }
  }

  static async actualizarAsignacion(req, res) {
    try {
      const { id } = req.params;
      const datos = req.body;

      const asignacionActualizada = await MedicamentoPacienteModel.update(id, datos);

      if (!asignacionActualizada) {
        return res.status(404).json({ error: 'Asignación no encontrada' });
      }

      res.json({
        message: 'Asignación actualizada exitosamente',
        asignacion: asignacionActualizada
      });
    } catch (error) {
      console.error('Error al actualizar asignación:', error);
      res.status(500).json({ error: 'Error al actualizar asignación' });
    }
  }

  static async eliminarAsignacion(req, res) {
    try {
      const { id } = req.params;

      const asignacionEliminada = await MedicamentoPacienteModel.delete(id);

      if (!asignacionEliminada) {
        return res.status(404).json({ error: 'Asignación no encontrada' });
      }

      res.json({
        message: 'Asignación eliminada exitosamente',
        asignacion: asignacionEliminada
      });
    } catch (error) {
      console.error('Error al eliminar asignación:', error);
      res.status(500).json({ error: 'Error al eliminar asignación' });
    }
  }
}