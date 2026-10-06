import { UserModel } from '../models/userModel.js';

export class UserController {
  static async getAll(req, res) {
    try {
      const users = await UserModel.getAll();
      res.json(users);
    } catch (error) {
      console.error('Error al obtener usuarios:', error);
      res.status(500).json({ error: 'Error al obtener usuarios' });
    }
  }

  static async getById(req, res) {
    try {
      const { id } = req.params;
      const user = await UserModel.findById(id);

      if (!user) {
        return res.status(404).json({ error: 'Usuario no encontrado' });
      }

      res.json(user);
    } catch (error) {
      console.error('Error al obtener usuario:', error);
      res.status(500).json({ error: 'Error al obtener usuario' });
    }
  }

  static async update(req, res) {
    try {
      const { id } = req.params;
      const { nombre, email, rol } = req.body;

      const updatedUser = await UserModel.update(id, { nombre, email, rol });

      if (!updatedUser) {
        return res.status(404).json({ error: 'Usuario no encontrado' });
      }

      res.json({
        message: 'Usuario actualizado exitosamente',
        user: updatedUser
      });
    } catch (error) {
      console.error('Error al actualizar usuario:', error);
      res.status(500).json({ error: 'Error al actualizar usuario' });
    }
  }

  static async delete(req, res) {
    try {
      const { id } = req.params;

      // Verificar que no sea el usuario actual
      if (parseInt(id) === req.user.id) {
        return res.status(400).json({ error: 'No puedes eliminar tu propio usuario' });
      }

      const deletedUser = await UserModel.delete(id);

      if (!deletedUser) {
        return res.status(404).json({ error: 'Usuario no encontrado' });
      }

      res.json({ message: 'Usuario eliminado exitosamente' });
    } catch (error) {
      console.error('Error al eliminar usuario:', error);
      res.status(500).json({ error: 'Error al eliminar usuario' });
    }
  }
}