import { Router } from 'express';
import { z } from 'zod';
import { db } from '../db/database';
import { requireAuth } from '../middleware/auth';
import { requireRole } from '../middleware/roles';
import { SafeUser, UserModel } from '../models/User';

export const usersRouter = Router();
usersRouter.use(requireAuth);

// Lista básica de usuarios (sin datos sensibles) para asignar tareas
usersRouter.get('/', (_req, res) => {
  const users = db
    .prepare('SELECT id, name, email, role, created_at FROM users ORDER BY name')
    .all() as SafeUser[];
  res.json(users);
});

const roleSchema = z.object({
  role: z.enum(['admin', 'miembro', 'invitado']),
});

// Solo un admin puede cambiar el rol de otro usuario
usersRouter.patch('/:id/role', requireRole('admin'), (req, res) => {
  const parsed = roleSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0].message });
    return;
  }
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    res.status(400).json({ error: 'Id de usuario inválido' });
    return;
  }

  const target = UserModel.findById(id);
  if (!target) {
    res.status(404).json({ error: 'Usuario no encontrado' });
    return;
  }

  // Nunca dejar la instancia sin administradores: si el objetivo es el único
  // admin (incluido uno mismo), no se lo puede degradar.
  if (target.role === 'admin' && parsed.data.role !== 'admin') {
    const { count } = db
      .prepare("SELECT COUNT(*) as count FROM users WHERE role = 'admin'")
      .get() as { count: number };
    if (count <= 1) {
      res.status(409).json({ error: 'No se puede degradar al único admin de la instancia' });
      return;
    }
  }

  db.prepare('UPDATE users SET role = ? WHERE id = ?').run(parsed.data.role, id);
  res.json(UserModel.toSafeUser(UserModel.findById(id)!));
});
