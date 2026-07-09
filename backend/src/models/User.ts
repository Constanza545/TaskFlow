import { db } from '../db/database';

export type Role = 'admin' | 'miembro' | 'invitado';

export interface User {
  id: number;
  name: string;
  email: string;
  password_hash: string;
  role: Role;
  created_at: string;
}

export type SafeUser = Omit<User, 'password_hash'>;

export const UserModel = {
  create(name: string, email: string, passwordHash: string, role: Role = 'miembro'): User {
    const stmt = db.prepare(
      'INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)'
    );
    const info = stmt.run(name, email, passwordHash, role);
    return this.findById(Number(info.lastInsertRowid))!;
  },

  findByEmail(email: string): User | undefined {
    return db.prepare('SELECT * FROM users WHERE email = ?').get(email) as unknown as
      | User
      | undefined;
  },

  findById(id: number): User | undefined {
    return db.prepare('SELECT * FROM users WHERE id = ?').get(id) as unknown as User | undefined;
  },

  toSafeUser(user: User): SafeUser {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars -- separa el hash del resto
    const { password_hash, ...safe } = user;
    return safe;
  },

  count(): number {
    const row = db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number };
    return row.count;
  },
};
