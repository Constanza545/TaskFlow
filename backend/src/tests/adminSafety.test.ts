import fs from 'fs';
import path from 'path';
import request from 'supertest';

process.env.DB_PATH = path.join(__dirname, 'test-admin-safety.sqlite');

import { createApp } from '../app';
import { initDb, db } from '../db/database';

jest.mock('../ws/io', () => ({
  getIo: () => ({ emit: jest.fn() }),
  setIo: jest.fn(),
}));

const app = createApp();

async function registerAndLogin(email: string, name = 'Usuario') {
  const res = await request(app).post('/api/auth/register').send({
    name,
    email,
    password: 'secreta123',
  });
  return { token: res.body.token as string, user: res.body.user };
}

beforeAll(() => {
  initDb();
});

afterEach(() => {
  db.exec('DELETE FROM tasks; DELETE FROM users; DELETE FROM activity_log;');
});

afterAll(() => {
  db.close();
  const dbFile = process.env.DB_PATH as string;
  for (const suffix of ['', '-wal', '-shm']) {
    const f = dbFile + suffix;
    if (fs.existsSync(f)) fs.unlinkSync(f);
  }
});

describe('El rol vigente sale de la base, no del JWT', () => {
  it('un admin degradado pierde sus permisos de inmediato, aunque su token siga vigente', async () => {
    const admin1 = await registerAndLogin('admin@example.com');
    const admin2 = await registerAndLogin('otro@example.com');

    // Promover al segundo usuario a admin para poder degradar al primero
    await request(app)
      .patch(`/api/users/${admin2.user.id}/role`)
      .set('Authorization', `Bearer ${admin1.token}`)
      .send({ role: 'admin' });

    // admin2 degrada a admin1 a invitado
    const demote = await request(app)
      .patch(`/api/users/${admin1.user.id}/role`)
      .set('Authorization', `Bearer ${admin2.token}`)
      .send({ role: 'invitado' });
    expect(demote.status).toBe(200);

    // El token viejo de admin1 (que todavía dice role: 'admin') ya no sirve
    // para acciones privilegiadas
    const create = await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${admin1.token}`)
      .send({ title: 'Ya no debería poder' });
    expect(create.status).toBe(403);
  });
});

describe('Protección del último admin', () => {
  it('no permite degradar al único admin de la instancia', async () => {
    const admin = await registerAndLogin('admin@example.com');

    const res = await request(app)
      .patch(`/api/users/${admin.user.id}/role`)
      .set('Authorization', `Bearer ${admin.token}`)
      .send({ role: 'miembro' });

    expect(res.status).toBe(409);
    expect(res.body.error).toMatch(/único admin/);
  });

  it('sí permite degradar a un admin cuando queda otro', async () => {
    const admin1 = await registerAndLogin('admin@example.com');
    const admin2 = await registerAndLogin('otro@example.com');

    await request(app)
      .patch(`/api/users/${admin2.user.id}/role`)
      .set('Authorization', `Bearer ${admin1.token}`)
      .send({ role: 'admin' });

    const res = await request(app)
      .patch(`/api/users/${admin1.user.id}/role`)
      .set('Authorization', `Bearer ${admin2.token}`)
      .send({ role: 'miembro' });

    expect(res.status).toBe(200);
    expect(res.body.role).toBe('miembro');
  });

  it('rechaza un id de usuario inválido', async () => {
    const admin = await registerAndLogin('admin@example.com');
    const res = await request(app)
      .patch('/api/users/abc/role')
      .set('Authorization', `Bearer ${admin.token}`)
      .send({ role: 'miembro' });
    expect(res.status).toBe(400);
  });
});
