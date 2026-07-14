import { authService } from '../services/authService';
import { Role, UserModel } from '../models/User';

/**
 * Cuentas demo opcionales, pensadas para la instancia de demostración pública.
 * Solo se crean si DEMO_USER_EMAIL y DEMO_USER_PASSWORD están definidas: la
 * cuenta admin usa ese email tal cual, y del mismo dominio se derivan una
 * cuenta "miembro" y una "invitado" (misma contraseña) para poder probar los
 * tres niveles de permiso. El frontend deriva los emails con la misma regla
 * (ver Login.tsx). Sin esas variables el seed no hace nada y el primer
 * registro real sigue siendo quien recibe el rol admin.
 */
export async function seedDemoUsers(): Promise<void> {
  const adminEmail = process.env.DEMO_USER_EMAIL;
  const password = process.env.DEMO_USER_PASSWORD;
  if (!adminEmail || !password) return;

  const domain = adminEmail.split('@')[1];
  const accounts: { name: string; email: string; role: Role }[] = [
    { name: 'Admin Demo', email: adminEmail, role: 'admin' },
    { name: 'Miembro Demo', email: `miembro@${domain}`, role: 'miembro' },
    { name: 'Invitado Demo', email: `invitado@${domain}`, role: 'invitado' },
  ];

  const passwordHash = await authService.hashPassword(password);
  for (const account of accounts) {
    if (UserModel.findByEmail(account.email)) continue;
    UserModel.create(account.name, account.email, passwordHash, account.role);
    console.log(`Usuario demo creado: ${account.email} (${account.role})`);
  }
}
