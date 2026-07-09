import { db } from '../db/database';

export type TaskStatus = 'pendiente' | 'en_progreso' | 'completada';

export interface Task {
  id: number;
  title: string;
  description: string | null;
  status: TaskStatus;
  assigned_to: number | null;
  created_by: number;
  created_at: string;
  updated_at: string;
}

export const TaskModel = {
  create(title: string, description: string | undefined, createdBy: number, assignedTo?: number): Task {
    const stmt = db.prepare(
      'INSERT INTO tasks (title, description, created_by, assigned_to) VALUES (?, ?, ?, ?)'
    );
    const info = stmt.run(title, description ?? null, createdBy, assignedTo ?? null);
    return this.findById(Number(info.lastInsertRowid))!;
  },

  findById(id: number): Task | undefined {
    return db.prepare('SELECT * FROM tasks WHERE id = ?').get(id) as unknown as Task | undefined;
  },

  findAll(): Task[] {
    return db.prepare('SELECT * FROM tasks ORDER BY created_at DESC').all() as unknown as Task[];
  },

  updateStatus(id: number, status: TaskStatus): Task | undefined {
    db.prepare("UPDATE tasks SET status = ?, updated_at = datetime('now') WHERE id = ?").run(status, id);
    return this.findById(id);
  },

  update(id: number, fields: Partial<Pick<Task, 'title' | 'description' | 'assigned_to'>>): Task | undefined {
    const current = this.findById(id);
    if (!current) return undefined;
    const title = fields.title ?? current.title;
    const description = fields.description ?? current.description;
    const assignedTo = fields.assigned_to ?? current.assigned_to;
    db.prepare(
      "UPDATE tasks SET title = ?, description = ?, assigned_to = ?, updated_at = datetime('now') WHERE id = ?"
    ).run(title, description, assignedTo, id);
    return this.findById(id);
  },

  delete(id: number): void {
    db.prepare('DELETE FROM tasks WHERE id = ?').run(id);
  },
};
