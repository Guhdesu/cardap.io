import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';

const JWT_SECRET = process.env.JWT_SECRET ?? 'cardapio-dev-secret-change-in-production';

export interface JwtPayload {
  id: number;
  email: string;
  role: 'admin' | 'funcionario';
}

// Extende o tipo Request do Express para incluir o usuário autenticado
declare global {
  namespace Express {
    interface Request {
      usuario?: JwtPayload;
    }
  }
}

export function gerarToken(payload: JwtPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '8h' });
}

export function verificarToken(token: string): JwtPayload {
  return jwt.verify(token, JWT_SECRET) as JwtPayload;
}

// Middleware: exige token JWT válido no header Authorization ou cookie
export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers['authorization'];
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : req.cookies?.staff_token;

  if (!token) {
    res.status(401).json({ error: 'Autenticação necessária.' });
    return;
  }

  try {
    req.usuario = verificarToken(token);
    next();
  } catch {
    res.status(401).json({ error: 'Token inválido ou expirado.' });
  }
}

// Middleware: exige role específica (ex: 'admin')
export function requireRole(role: 'admin' | 'funcionario') {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.usuario) {
      res.status(401).json({ error: 'Autenticação necessária.' });
      return;
    }
    if (req.usuario.role !== role) {
      res.status(403).json({ error: 'Acesso negado. Permissão insuficiente.' });
      return;
    }
    next();
  };
}
