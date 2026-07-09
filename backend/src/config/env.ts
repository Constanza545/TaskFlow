import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

export const env = {
  port: Number(process.env.PORT ?? 4000),
  jwtSecret: process.env.JWT_SECRET ?? 'dev-secret-change-me',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? '8h',
  dbPath: process.env.DB_PATH ?? path.join(__dirname, '..', '..', 'data', 'taskflow.sqlite'),
  corsOrigin: process.env.CORS_ORIGIN ?? 'http://localhost:5173',
  cryptoPollIntervalMs: Number(process.env.CRYPTO_POLL_INTERVAL_MS ?? 15000),
};
