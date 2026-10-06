import { NotaModel } from '../models/notaModel.js';

export class NotaController {
  static async create(req, res) {
    try {
      const datos = {
        ...req.body,
        usuario_id: req.user.id // Agregar el ID del usuario autenticado
      };

      const nuevaNota = await NotaModel.create(datos);

      res.status(201).json({
        message: 'Nota de enfermería creada exitosamente',
        nota: nuevaNota
      });
    } catch (error) {
      console.error('Error al crear nota:', error);
      res.status(500).json({ error: 'Error al crear nota de enfermería' });
    }
  }

  static async getAll(req, res) {
    try {
      const filtros = req.query;
      
      // Si no es administrador, solo puede ver sus propias notas
      if (req.user.rol !== 'administrador' && req.user.rol !== 'jefe_enfermeria') {
        filtros.usuario_id = req.user.id;
      }

      const notas = await NotaModel.getAll(filtros);

      res.json(notas);
    } catch (error) {
      console.error('Error al obtener notas:', error);
      res.status(500).json({ error: 'Error al obtener notas de enfermería' });
    }
  }

  static async getById(req, res) {
    try {
      const { id } = req.params;
      const nota = await NotaModel.findById(id);

      if (!nota) {
        return res.status(404).json({ error: 'Nota no encontrada' });
      }

      // Verificar permisos
      if (req.user.rol !== 'administrador' && 
          req.user.rol !== 'jefe_enfermeria' && 
          nota.usuario_id !== req.user.id) {
        return res.status(403).json({ error: 'No tienes permiso para ver esta nota' });
      }

      res.json(nota);
    } catch (error) {
      console.error('Error al obtener nota:', error);
      res.status(500).json({ error: 'Error al obtener nota de enfermería' });
    }
  }

  static async getByPaciente(req, res) {
    try {
      const { pacienteId } = req.params;
      const filtros = req.query;

      const notas = await NotaModel.getByPaciente(pacienteId, filtros);

      res.json(notas);
    } catch (error) {
      console.error('Error al obtener notas del paciente:', error);
      res.status(500).json({ error: 'Error al obtener notas del paciente' });
    }
  }

  static async getUltimasNotas(req, res) {
    try {
      const { pacienteId } = req.params;
      const limite = parseInt(req.query.limite) || 10;

      const notas = await NotaModel.getUltimasNotas(pacienteId, limite);

      res.json(notas);
    } catch (error) {
      console.error('Error al obtener últimas notas:', error);
      res.status(500).json({ error: 'Error al obtener últimas notas' });
    }
  }

  static async update(req, res) {
    try {
      const { id } = req.params;
      const datos = req.body;

      // Verificar que la nota existe y pertenece al usuario
      const notaExistente = await NotaModel.findById(id);
      if (!notaExistente) {
        return res.status(404).json({ error: 'Nota no encontrada' });
      }

      // Verificar permisos
      if (req.user.rol !== 'administrador' && 
          req.user.rol !== 'jefe_enfermeria' && 
          notaExistente.usuario_id !== req.user.id) {
        return res.status(403).json({ error: 'No tienes permiso para editar esta nota' });
      }

      const notaActualizada = await NotaModel.update(id, datos);

      res.json({
        message: 'Nota actualizada exitosamente',
        nota: notaActualizada
      });
    } catch (error) {
      console.error('Error al actualizar nota:', error);
      res.status(500).json({ error: 'Error al actualizar nota de enfermería' });
    }
  }

  static async delete(req, res) {
    try {
      const { id } = req.params;

      // Verificar que la nota existe y pertenece al usuario
      const notaExistente = await NotaModel.findById(id);
      if (!notaExistente) {
        return res.status(404).json({ error: 'Nota no encontrada' });
      }

      // Verificar permisos
      if (req.user.rol !== 'administrador' && 
          req.user.rol !== 'jefe_enfermeria' && 
          notaExistente.usuario_id !== req.user.id) {
        return res.status(403).json({ error: 'No tienes permiso para eliminar esta nota' });
      }

      const notaEliminada = await NotaModel.delete(id);

      res.json({
        message: 'Nota eliminada exitosamente',
        nota: notaEliminada
      });
    } catch (error) {
      console.error('Error al eliminar nota:', error);
      res.status(500).json({ error: 'Error al eliminar nota de enfermería' });
    }
  }
}