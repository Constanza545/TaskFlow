import { Router } from 'express';
import { z } from 'zod';
import { requireAuth } from '../middleware/auth';
import { requireRole } from '../middleware/roles';
import { TaskModel } from '../models/Task';
import { ActivityModel } from '../models/Activity';
import { UserModel } from '../models/User';
import { getIo } from '../ws/io';

export const tasksRouter = Router();
tasksRouter.use(requireAuth);

const createSchema = z.object({
  title: z.string().min(3, 'El título debe tener al menos 3 caracteres'),
  description: z.string().optional(),
  assigned_to: z.number().int().optional(),
});

const statusSchema = z.object({
  status: z.enum(['pendiente', 'en_progreso', 'completada']),
});

function broadcastActivity(userId: number, action: string, details?: string) {
  const entry = ActivityModel.log(userId, action, details);
  const user = UserModel.findById(userId);
  getIo().emit('activity:new', {
    ...entry,
    user_name: user?.name ?? 'desconocido',
  });
}

// Todos los roles autenticados pueden ver las tareas
tasksRouter.get('/', (_req, res) => {
  res.json(TaskModel.findAll());
});

// Admin y miembro pueden crear tareas; invitado es solo lectura
tasksRouter.post('/', requireRole('admin', 'miembro'), (req, res) => {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0].message });
    return;
  }
  const { title, description, assigned_to } = parsed.data;
  const task = TaskModel.create(title, description, req.user!.sub, assigned_to);
  broadcastActivity(req.user!.sub, 'creó la tarea', title);
  res.status(201).json(task);
});

tasksRouter.patch('/:id/status', requireRole('admin', 'miembro'), (req, res) => {
  const parsed = statusSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0].message });
    return;
  }
  const id = Number(req.params.id);
  const task = TaskModel.updateStatus(id, parsed.data.status);
  if (!task) {
    res.status(404).json({ error: 'Tarea no encontrada' });
    return;
  }
  broadcastActivity(req.user!.sub, `actualizó el estado a "${parsed.data.status}" de`, task.title);
  res.json(task);
});

// Solo admin puede eliminar tareas
tasksRouter.delete('/:id', requireRole('admin'), (req, res) => {
  const id = Number(req.params.id);
  const task = TaskModel.findById(id);
  if (!task) {
    res.status(404).json({ error: 'Tarea no encontrada' });
    return;
  }
  TaskModel.delete(id);
  broadcastActivity(req.user!.sub, 'eliminó la tarea', task.title);
  res.status(204).send();
});
