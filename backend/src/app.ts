import cors from 'cors';
import express, { Express } from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import { env } from './config/env';
import { authRouter } from './routes/auth';
import { cryptoRouter } from './routes/crypto';
import { tasksRouter } from './routes/tasks';
import { usersRouter } from './routes/users';
import { weatherRouter } from './routes/weather';

// Frena fuerza bruta sobre login/registro; desactivado en tests para no
// interferir con las suites que hacen muchos registros seguidos.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Demasiados intentos. Probá de nuevo en unos minutos.' },
  skip: () => process.env.NODE_ENV === 'test',
});

export function createApp(): Express {
  const app = express();

  app.use(helmet());
  app.use(cors({ origin: env.corsOrigin }));
  app.use(express.json());

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  app.use('/api/auth', authLimiter, authRouter);
  app.use('/api/crypto', cryptoRouter);
  app.use('/api/tasks', tasksRouter);
  app.use('/api/users', usersRouter);
  app.use('/api/weather', weatherRouter);

  return app;
}
