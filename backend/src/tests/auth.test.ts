import fs from 'fs';
import path from 'path';
import request from 'supertest';

// Base de datos de tests aislada para no pisar datos de desarrollo
process.env.DB_PATH = path.join(__dirname, 'test.sqlite');

import { createApp } from '../app';
import { initDb, db } from '../db/database';

const app = createApp();

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

describe('POST /api/auth/register', () => {
  it('registra un usuario nuevo y devuelve un token', async () => {
    const res = await request(app).post('/api/auth/register').send({
      name: 'Cony',
      email: 'cony@example.com',
      password: 'secreta123',
    });

    expect(res.status).toBe(201);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.email).toBe('cony@example.com');
    expect(res.body.user.password_hash).toBeUndefined();
  });

  it('el primer usuario registrado recibe el rol admin', async () => {
    const res = await request(app).post('/api/auth/register').send({
      name: 'Primer usuario',
      email: 'admin@example.com',
      password: 'secreta123',
    });
    expect(res.body.user.role).toBe('admin');
  });

  it('el segundo usuario recibe el rol miembro', async () => {
    await request(app).post('/api/auth/register').send({
      name: 'Uno',
      email: 'uno@example.com',
      password: 'secreta123',
    });
    const res = await request(app).post('/api/auth/register').send({
      name: 'Dos',
      email: 'dos@example.com',
      password: 'secreta123',
    });
    expect(res.body.user.role).toBe('miembro');
  });

  it('rechaza emails duplicados', async () => {
    await request(app).post('/api/auth/register').send({
      name: 'Cony',
      email: 'dup@example.com',
      password: 'secreta123',
    });
    const res = await request(app).post('/api/auth/register').send({
      name: 'Otra',
      email: 'dup@example.com',
      password: 'otra12345',
    });
    expect(res.status).toBe(409);
  });

  it('rechaza contraseñas muy cortas', async () => {
    const res = await request(app).post('/api/auth/register').send({
      name: 'Cony',
      email: 'corta@example.com',
      password: '123',
    });
    expect(res.status).toBe(400);
  });
});

describe('POST /api/auth/login', () => {
  it('permite iniciar sesión con credenciales correctas', async () => {
    await request(app).post('/api/auth/register').send({
      name: 'Cony',
      email: 'login@example.com',
      password: 'secreta123',
    });
    const res = await request(app).post('/api/auth/login').send({
      email: 'login@example.com',
      password: 'secreta123',
    });
    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
  });

  it('rechaza credenciales incorrectas', async () => {
    await request(app).post('/api/auth/register').send({
      name: 'Cony',
      email: 'wrong@example.com',
      password: 'secreta123',
    });
    const res = await request(app).post('/api/auth/login').send({
      email: 'wrong@example.com',
      password: 'incorrecta',
    });
    expect(res.status).toBe(401);
  });
});
