import { authService } from '../services/authService';
import { UserModel } from '../models/User';

// TEMPORAL: credencial de desarrollo pedida para probar en local sin registrarse.
// Quitar antes de desplegar a producción.
const DEV_EMAIL = 'admin@demo.com';
const DEV_PASSWORD = '321';

export async function seedDevAdmin(): Promise<void> {
  if (process.env.NODE_ENV === 'production') return;
  if (UserModel.findByEmail(DEV_EMAIL)) return;

  const passwordHash = await authService.hashPassword(DEV_PASSWORD);
  UserModel.create('Admin Demo', DEV_EMAIL, passwordHash, 'admin');
  console.log(`Usuario demo creado: ${DEV_EMAIL} / ${DEV_PASSWORD}`);
}
