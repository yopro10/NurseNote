import { UserModel } from '../models/userModel.js';
import bcrypt from 'bcryptjs';

export class UserController {
  static async create(req, res) {
    try {
      const { nombre, apellido, email, password, rol } = req.body;

      // Validaciones básicas
      if (!nombre || !email || !password || !rol) {
        return res.status(400).json({ error: 'Todos los campos son requeridos' });
      }

      // Verificar si el email ya existe
      const existingUser = await UserModel.findByEmail(email);
      if (existingUser) {
        return res.status(400).json({ error: 'El email ya está registrado' });
      }

      // Hashear la contraseña
      const hashedPassword = await bcrypt.hash(password, 10);

      const newUser = await UserModel.create({
        nombre,
        apellido,
        email,
        password: hashedPassword,
        rol
      });

      res.status(201).json({
        message: 'Usuario creado exitosamente',
        user: {
          id: newUser.id,
          nombre: newUser.nombre,
          apellido: newUser.apellido,
          email: newUser.email,
          rol: newUser.rol
        }
      });
    } catch (error) {
      console.error('Error al crear usuario:', error);
      res.status(500).json({ error: 'Error al crear usuario' });
    }
  }

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
      const { nombre, apellido, email, rol } = req.body;

      const updatedUser = await UserModel.update(id, { nombre, apellido, email, rol });

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

      res.json({ message: 'Usuario desactivado exitosamente' });
    } catch (error) {
      console.error('Error al desactivar usuario:', error);
      res.status(500).json({ error: 'Error al desactivar usuario' });
    }
  }

  static async reactivate(req, res) {
    try {
      const { id } = req.params;

      const reactivatedUser = await UserModel.reactivate(id);

      if (!reactivatedUser) {
        return res.status(404).json({ error: 'Usuario no encontrado' });
      }

      res.json({
        message: 'Usuario reactivado exitosamente',
        user: reactivatedUser
      });
    } catch (error) {
      console.error('Error al reactivar usuario:', error);
      res.status(500).json({ error: 'Error al reactivar usuario' });
    }
  }

  static async resetPassword(req, res) {
    try {
      const { id } = req.params;
      const { newPassword } = req.body;

      if (!newPassword || newPassword.length < 6) {
        return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres' });
      }

      // Hashear la nueva contraseña
      const hashedPassword = await bcrypt.hash(newPassword, 10);

      const updatedUser = await UserModel.resetPassword(id, hashedPassword);

      if (!updatedUser) {
        return res.status(404).json({ error: 'Usuario no encontrado' });
      }

      res.json({
        message: 'Contraseña restablecida exitosamente',
        user: {
          id: updatedUser.id,
          nombre: updatedUser.nombre,
          email: updatedUser.email
        }
      });
    } catch (error) {
      console.error('Error al restablecer contraseña:', error);
      res.status(500).json({ error: 'Error al restablecer contraseña' });
    }
  }
}