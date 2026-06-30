import { Router, Request, Response } from 'express';
import { Server as SocketServer } from 'socket.io';
import { IPedidoRepository, IMesaRepository } from '../repositories/interfaces';
import { NovoPedidoPayload, AtualizarStatusPayload } from '../types';

export function pedidosRouter(
  pedidoRepo: IPedidoRepository,
  mesaRepo: IMesaRepository,
  io: SocketServer,
): Router {
  const router = Router();

  // POST /pedidos — cliente envia pedido
  router.post('/', async (req: Request, res: Response) => {
    const { comanda_id, itens } = req.body as NovoPedidoPayload;

    if (!comanda_id || !itens || itens.length === 0) {
      res.status(400).json({ error: 'comanda_id e itens são obrigatórios' });
      return;
    }

    const itensCriados = await pedidoRepo.criar(comanda_id, itens);

    // Busca dados da comanda para notificar o staff com o número da mesa
    const comandasAbertas = await pedidoRepo.listarComandasAbertas();
    const comanda = comandasAbertas.find((c) => c.id === comanda_id);

    // Emite para o painel do staff
    io.to('staff').emit('novo_pedido', {
      comanda_id,
      mesa_numero: comanda?.mesa_numero ?? '?',
      itens: itensCriados,
    });

    res.status(201).json(itensCriados);
  });

  // GET /pedidos/comanda/:comanda_id — cliente consulta seus pedidos
  router.get('/comanda/:comanda_id', async (req: Request, res: Response) => {
    const comanda_id = parseInt(req.params.comanda_id);

    if (isNaN(comanda_id)) {
      res.status(400).json({ error: 'comanda_id inválido' });
      return;
    }

    const itens = await pedidoRepo.listarPorComanda(comanda_id);
    res.json(itens);
  });

  // PUT /pedidos/:id/status — staff atualiza status de um item
  router.put('/:id/status', async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    const { status } = req.body as AtualizarStatusPayload;

    if (isNaN(id) || !status) {
      res.status(400).json({ error: 'id e status são obrigatórios' });
      return;
    }

    const atualizado = await pedidoRepo.atualizarStatus(id, status);

    if (!atualizado) {
      res.status(404).json({ error: 'Item de pedido não encontrado' });
      return;
    }

    // Busca a mesa da comanda para notificar o cliente correto
    const comandas = await pedidoRepo.listarComandasAbertas();
    const comanda = comandas.find((c) => c.id === atualizado.comanda_id);

    if (comanda) {
      // Emite para a mesa específica
      io.to(`mesa:${comanda.mesa_id}`).emit('status_atualizado', {
        pedido_item_id: atualizado.id,
        status: atualizado.status,
        item_nome: atualizado.item_nome,
      });
    }

    res.json(atualizado);
  });

  // GET /pedidos/staff/comandas — painel do staff
  router.get('/staff/comandas', async (_req: Request, res: Response) => {
    const comandas = await pedidoRepo.listarComandasAbertas();
    res.json(comandas);
  });

  return router;
}
