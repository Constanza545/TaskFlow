import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { Role } from '../models/User';

export interface JwtPayload {
  sub: number;
  email: string;
  role: Role;
}

export const authService = {
  async hashPassword(password: string): Promise<string> {
    const salt = await bcrypt.genSalt(10);
    return bcrypt.hash(password, salt);
  },

  async comparePassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  },

  signToken(payload: JwtPayload): string {
    return jwt.sign(payload, env.jwtSecret, { expiresIn: env.jwtExpiresIn } as jwt.SignOptions);
  },

  verifyToken(token: string): JwtPayload {
    return jwt.verify(token, env.jwtSecret) as unknown as JwtPayload;
  },
};
