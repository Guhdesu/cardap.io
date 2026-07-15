import { Router, Request, Response } from 'express';
import bcrypt from 'bcrypt';
import { pool } from '../db/connection';
import { gerarToken, requireAuth } from '../middleware/auth';

export function authRouter(): Router {
  const router = Router();

  // POST /auth/login — recebe email e senha, retorna JWT
  router.post('/login', async (req: Request, res: Response) => {
    const { email, senha } = req.body as { email?: string; senha?: string };

    if (!email || !senha) {
      res.status(400).json({ error: 'Email e senha são obrigatórios.' });
      return;
    }

    try {
      const result = await pool.query(
        'SELECT id, nome, email, senha_hash, role, ativo FROM usuarios WHERE email = $1',
        [email.toLowerCase().trim()]
      );

      const usuario = result.rows[0];

      if (!usuario || !usuario.ativo) {
        res.status(401).json({ error: 'Credenciais inválidas.' });
        return;
      }

      const senhaCorreta = await bcrypt.compare(senha, usuario.senha_hash);
      if (!senhaCorreta) {
        res.status(401).json({ error: 'Credenciais inválidas.' });
        return;
      }

      const token = gerarToken({ id: usuario.id, email: usuario.email, role: usuario.role });

      // Retorna token no body (frontend armazena em cookie HTTP-only via Route Handler)
      res.json({
        token,
        usuario: { id: usuario.id, nome: usuario.nome, email: usuario.email, role: usuario.role },
      });
    } catch (err) {
      console.error('[Auth] Erro no login:', err);
      res.status(500).json({ error: 'Erro interno no servidor.' });
    }
  });

  // GET /auth/me — valida token e retorna dados do usuário logado
  router.get('/me', requireAuth, (req: Request, res: Response) => {
    res.json({ usuario: req.usuario });
  });

  // POST /auth/logout — instrução para o cliente descartar o token
  router.post('/logout', (_req: Request, res: Response) => {
    res.json({ message: 'Logout realizado. Descarte o token localmente.' });
  });

  return router;
}
