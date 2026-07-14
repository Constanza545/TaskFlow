import { authService } from '../services/authService';
import { UserModel } from '../models/User';

/**
 * Cuenta demo opcional, pensada para la instancia de demostración pública.
 * Solo se crea si DEMO_USER_EMAIL y DEMO_USER_PASSWORD están definidas;
 * sin esas variables el seed no hace nada y el primer registro real
 * sigue siendo quien recibe el rol admin.
 */
export async function seedDemoUser(): Promise<void> {
  const email = process.env.DEMO_USER_EMAIL;
  const password = process.env.DEMO_USER_PASSWORD;
  if (!email || !password) return;
  if (UserModel.findByEmail(email)) return;

  const passwordHash = await authService.hashPassword(password);
  UserModel.create('Admin Demo', email, passwordHash, 'admin');
  console.log(`Usuario demo creado: ${email}`);
}
