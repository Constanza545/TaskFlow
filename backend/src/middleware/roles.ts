import { NextFunction, Request, Response } from 'express';
import { Role, UserModel } from '../models/User';

/**
 * Middleware de autorización por rol.
 * Uso: router.post('/tasks', requireAuth, requireRole('admin', 'miembro'), handler)
 *
 * El rol embebido en el JWT puede quedar obsoleto (ej. un admin degradado
 * conservaría sus permisos hasta que el token expire), así que la fuente de
 * verdad es siempre el rol vigente en la base de datos.
 */
export function requireRole(...allowedRoles: Role[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'No autenticado' });
      return;
    }
    const user = UserModel.findById(req.user.sub);
    if (!user) {
      res.status(401).json({ error: 'El usuario ya no existe' });
      return;
    }
    if (!allowedRoles.includes(user.role)) {
      res.status(403).json({ error: 'No tenés permisos para realizar esta acción' });
      return;
    }
    req.user.role = user.role; // los handlers posteriores ven el rol vigente
    next();
  };
}
