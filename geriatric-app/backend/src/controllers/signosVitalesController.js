import { SignosVitalesModel } from '../models/signosVitalesModel.js';

export class SignosVitalesController {
  static async create(req, res) {
    try {
      const {
        paciente_id,
        usuario_id,
        presion_sistolica,
        presion_diastolica,
        frecuencia_cardiaca,
        temperatura,
        saturacion_oxigeno,
        frecuencia_respiratoria,
        glucosa,
        peso,
        altura,
        observaciones
      } = req.body;

      // Validaciones básicas
      if (!paciente_id || !usuario_id) {
        return res.status(400).json({ error: 'paciente_id y usuario_id son requeridos' });
      }

      const signos = await SignosVitalesModel.create({
        paciente_id,
        usuario_id,
        presion_sistolica,
        presion_diastolica,
        frecuencia_cardiaca,
        temperatura,
        saturacion_oxigeno,
        frecuencia_respiratoria,
        glucosa,
        peso,
        altura,
        observaciones
      });

      // Calcular alertas
      const alertas = [];
      if (saturacion_oxigeno < 90) alertas.push('SpO₂ crítico');
      if (saturacion_oxigeno < 95 && saturacion_oxigeno >= 90) alertas.push('SpO₂ bajo');
      if (presion_sistolica > 140 || presion_diastolica > 90) alertas.push('Presión alta');
      if (presion_sistolica < 90 || presion_diastolica < 60) alertas.push('Presión baja');
      if (temperatura > 38) alertas.push('Fiebre');
      if (temperatura < 36) alertas.push('Hipotermia');
      if (frecuencia_cardiaca > 100) alertas.push('Taquicardia');
      if (frecuencia_cardiaca < 60) alertas.push('Bradicardia');

      res.status(201).json({
        message: 'Signos vitales registrados exitosamente',
        data: signos,
        alertas: alertas.length > 0 ? alertas : null
      });
    } catch (error) {
      console.error('Error al registrar signos vitales:', error);
      res.status(500).json({ error: 'Error al registrar signos vitales' });
    }
  }

  static async getById(req, res) {
    try {
      const { id } = req.params;
      const signos = await SignosVitalesModel.findById(id);

      if (!signos) {
        return res.status(404).json({ error: 'Signos vitales no encontrados' });
      }

      res.json(signos);
    } catch (error) {
      console.error('Error al obtener signos vitales:', error);
      res.status(500).json({ error: 'Error al obtener signos vitales' });
    }
  }

  static async getByPaciente(req, res) {
    try {
      const { pacienteId } = req.params;
      const { fecha_inicio, fecha_fin } = req.query;

      const filtros = {};
      if (fecha_inicio) filtros.fecha_inicio = fecha_inicio;
      if (fecha_fin) filtros.fecha_fin = fecha_fin;

      const signos = await SignosVitalesModel.getByPaciente(pacienteId, filtros);

      res.json(signos);
    } catch (error) {
      console.error('Error al obtener signos vitales del paciente:', error);
      res.status(500).json({ error: 'Error al obtener signos vitales del paciente' });
    }
  }

  static async getUltimos(req, res) {
    try {
      const { pacienteId } = req.params;
      const { limite } = req.query;

      const signos = await SignosVitalesModel.getUltimosPorPaciente(
        pacienteId,
        parseInt(limite) || 10
      );

      res.json(signos);
    } catch (error) {
      console.error('Error al obtener últimos signos vitales:', error);
      res.status(500).json({ error: 'Error al obtener últimos signos vitales' });
    }
  }

  static async getAlertas(req, res) {
    try {
      const { pacienteId } = req.params;
      const alertas = await SignosVitalesModel.getAlertas(pacienteId);

      res.json(alertas);
    } catch (error) {
      console.error('Error al obtener alertas:', error);
      res.status(500).json({ error: 'Error al obtener alertas' });
    }
  }

  static async getTendencias(req, res) {
    try {
      const { pacienteId } = req.params;
      const { dias } = req.query;

      const tendencias = await SignosVitalesModel.getTendencias(
        pacienteId,
        parseInt(dias) || 30
      );

      res.json(tendencias);
    } catch (error) {
      console.error('Error al obtener tendencias:', error);
      res.status(500).json({ error: 'Error al obtener tendencias' });
    }
  }

  static async update(req, res) {
    try {
      const { id } = req.params;
      const datos = req.body;

      const signos = await SignosVitalesModel.update(id, datos);

      if (!signos) {
        return res.status(404).json({ error: 'Signos vitales no encontrados' });
      }

      res.json({
        message: 'Signos vitales actualizados exitosamente',
        data: signos
      });
    } catch (error) {
      console.error('Error al actualizar signos vitales:', error);
      res.status(500).json({ error: 'Error al actualizar signos vitales' });
    }
  }

  static async delete(req, res) {
    try {
      const { id } = req.params;
      const signos = await SignosVitalesModel.delete(id);

      if (!signos) {
        return res.status(404).json({ error: 'Signos vitales no encontrados' });
      }

      res.json({
        message: 'Signos vitales eliminados exitosamente',
        data: signos
      });
    } catch (error) {
      console.error('Error al eliminar signos vitales:', error);
      res.status(500).json({ error: 'Error al eliminar signos vitales' });
    }
  }
}
