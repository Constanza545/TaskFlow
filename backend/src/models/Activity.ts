import { db } from '../db/database';

export interface ActivityEntry {
  id: number;
  user_id: number;
  action: string;
  details: string | null;
  created_at: string;
}

export const ActivityModel = {
  log(userId: number, action: string, details?: string): ActivityEntry {
    const stmt = db.prepare('INSERT INTO activity_log (user_id, action, details) VALUES (?, ?, ?)');
    const info = stmt.run(userId, action, details ?? null);
    return db
      .prepare('SELECT * FROM activity_log WHERE id = ?')
      .get(info.lastInsertRowid) as unknown as ActivityEntry;
  },

  recent(limit = 20): ActivityEntry[] {
    return db
      .prepare('SELECT * FROM activity_log ORDER BY created_at DESC LIMIT ?')
      .all(limit) as unknown as ActivityEntry[];
  },
};
