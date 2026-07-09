import { Router } from 'express';
import { z } from 'zod';
import { requireAuth } from '../middleware/auth';
import { UserModel } from '../models/User';
import { authService } from '../services/authService';

export const authRouter = Router();

const registerSchema = z.object({
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
  // Solo el primer usuario registrado se vuelve admin automáticamente;
  // los siguientes ingresan como "miembro" salvo que un admin los cambie luego.
});

const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(1, 'La contraseña es requerida'),
});

authRouter.post('/register', async (req, res) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0].message });
    return;
  }
  const { name, email, password } = parsed.data;

  if (UserModel.findByEmail(email)) {
    res.status(409).json({ error: 'Ya existe una cuenta con ese email' });
    return;
  }

  const role = UserModel.count() === 0 ? 'admin' : 'miembro';
  const passwordHash = await authService.hashPassword(password);
  const user = UserModel.create(name, email, passwordHash, role);

  const token = authService.signToken({ sub: user.id, email: user.email, role: user.role });
  res.status(201).json({ token, user: UserModel.toSafeUser(user) });
});

authRouter.post('/login', async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0].message });
    return;
  }
  const { email, password } = parsed.data;

  const user = UserModel.findByEmail(email);
  if (!user) {
    res.status(401).json({ error: 'Credenciales inválidas' });
    return;
  }

  const valid = await authService.comparePassword(password, user.password_hash);
  if (!valid) {
    res.status(401).json({ error: 'Credenciales inválidas' });
    return;
  }

  const token = authService.signToken({ sub: user.id, email: user.email, role: user.role });
  res.json({ token, user: UserModel.toSafeUser(user) });
});

// Devuelve el usuario vigente según la base (no lo que diga el token).
// El cliente lo usa al montar para refrescar rol y datos de la sesión guardada.
authRouter.get('/me', requireAuth, (req, res) => {
  const user = UserModel.findById(req.user!.sub);
  if (!user) {
    res.status(401).json({ error: 'El usuario ya no existe' });
    return;
  }
  res.json(UserModel.toSafeUser(user));
});
