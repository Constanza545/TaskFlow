import fs from 'fs';
import path from 'path';
import request from 'supertest';

process.env.DB_PATH = path.join(__dirname, 'test-roles.sqlite');

import { createApp } from '../app';
import { initDb, db } from '../db/database';
import { UserModel } from '../models/User';
import { authService } from '../services/authService';

// getIo() lanza si socket.io no fue inicializado; en tests de rutas HTTP puras
// mockeamos el módulo para que broadcastActivity no rompa el request.
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

describe('Permisos de tareas por rol', () => {
  it('el primer usuario (admin) puede crear tareas', async () => {
    const { token } = await registerAndLogin('admin@example.com');
    const res = await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Tarea de admin' });
    expect(res.status).toBe(201);
  });

  it('un miembro puede crear tareas pero no eliminarlas', async () => {
    await registerAndLogin('admin2@example.com'); // consume el rol admin
    const { token } = await registerAndLogin('miembro@example.com');

    const create = await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Tarea de miembro' });
    expect(create.status).toBe(201);

    const del = await request(app)
      .delete(`/api/tasks/${create.body.id}`)
      .set('Authorization', `Bearer ${token}`);
    expect(del.status).toBe(403);
  });

  it('un invitado no puede crear tareas, solo leer', async () => {
    // El endpoint de registro solo asigna 'admin' o 'miembro'; para probar el rol
    // 'invitado' (que en la práctica asigna un admin desde un panel de gestión)
    // creamos el usuario directamente en el modelo con ese rol.
    const passwordHash = await authService.hashPassword('secreta123');
    const invitado = UserModel.create('Invitado', 'invitado@example.com', passwordHash, 'invitado');
    const token = authService.signToken({ sub: invitado.id, email: invitado.email, role: invitado.role });

    const create = await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Intento de invitado' });
    expect(create.status).toBe(403);

    const list = await request(app).get('/api/tasks').set('Authorization', `Bearer ${token}`);
    expect(list.status).toBe(200);
  });

  it('rechaza acceso sin token', async () => {
    const res = await request(app).get('/api/tasks');
    expect(res.status).toBe(401);
  });
});
