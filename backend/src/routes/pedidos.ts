import { Router, Request, Response } from 'express';
import { PedidoService } from '../services/PedidoService';
import { NovoPedidoPayload, AtualizarStatusPayload } from '../types';
import { requireAuth } from '../middleware/auth';

export function pedidosRouter(service: PedidoService): Router {
  const router = Router();

  // POST /pedidos — cliente envia pedido
  router.post('/', async (req: Request, res: Response) => {
    const { comanda_id, itens } = req.body as NovoPedidoPayload;

    if (!comanda_id || !itens || itens.length === 0) {
      res.status(400).json({ error: 'comanda_id e itens são obrigatórios' });
      return;
    }

    try {
      const itensCriados = await service.fazerPedido(comanda_id, itens);
      res.status(201).json(itensCriados);
    } catch (err) {
      res.status(500).json({ error: (err as Error).message });
    }
  });

  // GET /pedidos/comanda/:comanda_id — cliente consulta seus pedidos
  router.get('/comanda/:comanda_id', async (req: Request, res: Response) => {
    const comanda_id = parseInt(req.params.comanda_id);

    if (isNaN(comanda_id)) {
      res.status(400).json({ error: 'comanda_id inválido' });
      return;
    }

    try {
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
