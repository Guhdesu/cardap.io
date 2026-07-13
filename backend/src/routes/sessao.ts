import { Router, Request, Response } from 'express';
import { SessaoService } from '../services/SessaoService';
import { makeRequireSessaoCliente } from '../middleware/auth';
import { pool } from '../db/connection';

export function sessaoRouter(service: SessaoService): Router {
  const router = Router();
  const requireSessaoCliente = makeRequireSessaoCliente((id) => service.validarSessao(id));

  // GET /entrar/token-info?token=UUID
  router.get('/entrar/token-info', async (req: Request, res: Response) => {
    const token = req.query.token as string;
    if (!token) {
      res.status(400).json({ error: 'Token do QR Code não informado.' });
      return;
    }

    try {
      const qrCode = await service.buscarTokenAtivo(token);
      if (!qrCode) {
        res.status(400).json({ error: 'Token do QR Code inválido ou expirado.' });
        return;
      }

      const mesa = await service.buscarMesaPorId(qrCode.mesa_id);

      // Busca todas as comandas ativas para esta mesa
      const comandaResult = await pool.query(
        "SELECT id, mesa_id, status FROM comandas WHERE mesa_id = $1 AND status = 'aberta' ORDER BY criado_em DESC",
        [qrCode.mesa_id]
      );

      const comandasInfo = [];
      for (const comanda of comandaResult.rows) {
        // Busca resumo dos itens e valor total
        const itensResult = await pool.query(
          "SELECT COUNT(pi.id) as count, COALESCE(SUM(pi.quantidade * pi.preco_unitario), 0) as total FROM pedido_itens pi WHERE pi.comanda_id = $1",
          [comanda.id]
        );
        comandasInfo.push({
          id: comanda.id,
          status: comanda.status,
          itens_count: parseInt(itensResult.rows[0].count),
          total: parseFloat(itensResult.rows[0].total),
        });
      }

      res.json({
        mesa_id: qrCode.mesa_id,
        mesa_numero: mesa?.numero || qrCode.mesa_id,
        comandas: comandasInfo,
      });
    } catch (err: any) {
      console.error('[sessao] Erro no /entrar/token-info:', err);
      res.status(400).json({ error: err.message || 'Token inválido.' });
    }
  });

  // GET /entrar?token=UUID&comanda_acao=nova|juntar&comanda_id=123
  router.get('/entrar', async (req: Request, res: Response) => {
    const token = req.query.token as string;
    const comandaAcao = req.query.comanda_acao as 'juntar' | 'nova' | undefined;
    const comandaId = req.query.comanda_id ? parseInt(req.query.comanda_id as string) : undefined;

    if (!token) {
      res.status(400).json({ error: 'Token do QR Code não informado.' });
      return;
    }

    try {
      const { sessao, mesaNumero } = await service.entrarComToken(token, comandaAcao, comandaId);

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
