import { Router, Request, Response } from 'express';
import { pool } from '../db/connection';
import { PedidoService } from '../services/PedidoService';
import { NovoPedidoPayload, AtualizarStatusPayload } from '../types';
import { requireAuth, makeRequireSessaoCliente } from '../middleware/auth';
import { SessaoRepository } from '../repositories/postgres/SessaoRepository';

export function pedidosRouter(service: PedidoService): Router {
  const router = Router();
  const sessaoRepo = new SessaoRepository();
  const requireSessaoCliente = makeRequireSessaoCliente((id) => sessaoRepo.buscarSessaoAtiva(id));

  // POST /pedidos — cliente envia pedido (protegido por sessão)
  router.post('/', requireSessaoCliente, async (req: Request, res: Response) => {
    const { comanda_id, itens } = req.body as NovoPedidoPayload;

    if (!comanda_id || !itens || itens.length === 0) {
      res.status(400).json({ error: 'comanda_id e itens são obrigatórios' });
      return;
    }

    try {
      // Valida se a comanda pertence à sessão ou mesa do cliente
      const comandaResult = await pool.query('SELECT sessao_id, mesa_id FROM comandas WHERE id = $1', [comanda_id]);
      if (comandaResult.rows.length === 0) {
        res.status(404).json({ error: 'Comanda não encontrada' });
        return;
      }
      const comanda = comandaResult.rows[0];
      if (comanda.sessao_id !== req.sessao!.id && comanda.mesa_id !== req.sessao!.mesa_id) {
        res.status(403).json({ error: 'Acesso negado. Esta comanda não pertence à sua sessão.' });
        return;
      }

      const itensCriados = await service.fazerPedido(comanda_id, itens);
      res.status(201).json(itensCriados);
    } catch (err) {
      res.status(500).json({ error: (err as Error).message });
    }
  });

  // GET /pedidos/comanda/:comanda_id — cliente consulta seus pedidos (protegido por sessão)
  router.get('/comanda/:comanda_id', requireSessaoCliente, async (req: Request, res: Response) => {
    const comanda_id = parseInt(req.params.comanda_id);

    if (isNaN(comanda_id)) {
      res.status(400).json({ error: 'comanda_id inválido' });
      return;
    }

    try {
      // Valida se a comanda pertence à sessão ou mesa do cliente
      const comandaResult = await pool.query('SELECT sessao_id, mesa_id FROM comandas WHERE id = $1', [comanda_id]);
      if (comandaResult.rows.length === 0) {
        res.status(404).json({ error: 'Comanda não encontrada' });
        return;
      }
      const comanda = comandaResult.rows[0];
      if (comanda.sessao_id !== req.sessao!.id && comanda.mesa_id !== req.sessao!.mesa_id) {
        res.status(403).json({ error: 'Acesso negado. Esta comanda não pertence à sua sessão.' });
        return;
      }

      const itens = await service.obterPedidosPorComanda(comanda_id);
      res.json(itens);
    } catch (err) {
      res.status(500).json({ error: (err as Error).message });
    }
  });

  // PUT /pedidos/:id/status — staff atualiza status de um item (protegido)
  router.put('/:id/status', requireAuth, async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    const { status } = req.body as AtualizarStatusPayload;

    if (isNaN(id) || !status) {
      res.status(400).json({ error: 'id e status são obrigatórios' });
      return;
    }

    try {
      const atualizado = await service.atualizarStatusItem(id, status);
      res.json(atualizado);
    } catch (err) {
      res.status(404).json({ error: (err as Error).message });
    }
  });

  // GET /pedidos/staff/comandas — painel do staff (protegido)
  router.get('/staff/comandas', requireAuth, async (_req: Request, res: Response) => {
    try {
      const comandas = await service.listarComandasAtivas();
      res.json(comandas);
    } catch (err) {
      res.status(500).json({ error: (err as Error).message });
    }
  });

  return router;
}
