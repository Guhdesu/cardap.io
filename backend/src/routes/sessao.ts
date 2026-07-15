import { Router, Request, Response } from 'express';
import { SessaoService } from '../services/SessaoService';
import { makeRequireSessaoCliente } from '../middleware/auth';

export function sessaoRouter(service: SessaoService): Router {
  const router = Router();
  const requireSessaoCliente = makeRequireSessaoCliente((id) => service.validarSessao(id));

  // GET /entrar?token=UUID
  router.get('/entrar', async (req: Request, res: Response) => {
    const token = req.query.token as string;

    if (!token) {
      res.status(400).json({ error: 'Token do QR Code não informado.' });
      return;
    }

    try {
      const { sessao, mesaNumero } = await service.entrarComToken(token);

      // Define cookie HTTP-Only para a sessão de 4 horas
      res.cookie('sessao_id', sessao.id.toString(), {
        httpOnly: true,
        maxAge: 4 * 60 * 60 * 1000, // 4 horas
        path: '/',
        sameSite: 'lax',
      });

      res.json({
        sessao_id: sessao.id,
        mesa_id: sessao.mesa_id,
        mesa_numero: mesaNumero,
      });
    } catch (err: any) {
      console.error('[sessao] Erro no /entrar:', err);
      res.status(400).json({ error: err.message || 'Token inválido ou expirado.' });
    }
  });

  // GET /sessao/valida
  router.get('/sessao/valida', requireSessaoCliente, (req: Request, res: Response) => {
    res.json({ active: true, sessao: req.sessao });
  });

  // POST /sessao/sair - encerra a sessão ativa do cliente
  router.post('/sessao/sair', requireSessaoCliente, async (req: Request, res: Response) => {
    try {
      if (req.sessao) {
        await service.encerrarSessao(req.sessao.id);
      }
      res.clearCookie('sessao_id');
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: 'Erro ao encerrar sessão.' });
    }
  });

  return router;
}
