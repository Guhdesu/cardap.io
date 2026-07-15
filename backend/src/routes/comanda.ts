import { Router, Request, Response } from 'express';
import { Server as SocketServer } from 'socket.io';
import { pool } from '../db/connection';
import { makeRequireSessaoCliente, requireAuth } from '../middleware/auth';
import { SessaoRepository } from '../repositories/postgres/SessaoRepository';

export function comandaRouter(io: SocketServer): Router {
  const router = Router();
  const sessaoRepo = new SessaoRepository();
  const requireSessaoCliente = makeRequireSessaoCliente((id) => sessaoRepo.buscarSessaoAtiva(id));

  // GET /comanda/:id — retorna dados completos da comanda (protegido por sessão)
  router.get('/:id', requireSessaoCliente, async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      res.status(400).json({ error: 'ID de comanda inválido' });
      return;
    }

    try {
      const comandaResult = await pool.query(
        'SELECT id, mesa_id, sessao_id, status, criado_em FROM comandas WHERE id = $1',
        [id]
      );

      if (comandaResult.rows.length === 0) {
        res.status(404).json({ error: 'Comanda não encontrada' });
        return;
      }

      const comanda = comandaResult.rows[0];

      // Garante que o cliente só acesse a própria comanda/sessão
      if (comanda.sessao_id !== req.sessao!.id && comanda.mesa_id !== req.sessao!.mesa_id) {
        res.status(403).json({ error: 'Acesso negado. Esta comanda não pertence à sua sessão.' });
        return;
      }

      // Busca os itens do pedido e seus preços atuais
      const itensResult = await pool.query(
        `SELECT pi.id, pi.item_id, pi.item_nome, pi.quantidade, pi.observacao, pi.status, pi.criado_em, pi.preco_unitario
         FROM pedido_itens pi
         WHERE pi.comanda_id = $1
         ORDER BY pi.criado_em ASC`,
         [id]
      );

      const itens = itensResult.rows.map((row) => ({
        id: row.id,
        comanda_id: id,
        item_id: row.item_id,
        item_nome: row.item_nome,
        quantidade: row.quantidade,
        observacao: row.observacao,
        status: row.status,
        criado_em: row.criado_em,
        preco: row.preco_unitario ? parseFloat(row.preco_unitario) : 0,
      }));

      const total = itens.reduce((sum, item) => sum + item.preco * item.quantidade, 0);

      res.json({
        id: comanda.id,
        mesa_id: comanda.mesa_id,
        status: comanda.status,
        criado_em: comanda.criado_em,
        itens,
        total,
      });
    } catch (err) {
      console.error('[Comanda] Erro ao buscar comanda:', err);
      res.status(500).json({ error: 'Erro interno no servidor.' });
    }
  });

  // PUT /comanda/:id/solicitar-fechamento (requer sessao)
  router.put('/:id/solicitar-fechamento', requireSessaoCliente, async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      res.status(400).json({ error: 'ID de comanda inválido' });
      return;
    }

    try {
      const comandaRes = await pool.query(
        `SELECT c.id, c.mesa_id, c.sessao_id, c.status, m.numero as mesa_numero 
         FROM comandas c 
         JOIN mesas m ON c.mesa_id = m.id 
         WHERE c.id = $1`, 
        [id]
      );

      if (comandaRes.rows.length === 0) {
        res.status(404).json({ error: 'Comanda não encontrada' });
        return;
      }

      const comanda = comandaRes.rows[0];

      // Valida posse da comanda
      if (comanda.sessao_id !== req.sessao!.id && comanda.mesa_id !== req.sessao!.mesa_id) {
        res.status(403).json({ error: 'Acesso negado. Esta comanda não pertence à sua sessão.' });
        return;
      }

      if (comanda.status !== 'aberta') {
        res.status(400).json({ error: `Comanda já está em estado: ${comanda.status}` });
        return;
      }

      // Altera status de aberta -> fechamento_solicitado
      await pool.query("UPDATE comandas SET status = 'fechamento_solicitado' WHERE id = $1", [id]);

      // Emite evento WebSocket fechamento_solicitado para a sala staff
      io.to('staff').emit('fechamento_solicitado', {
        comanda_id: id,
        mesa_id: comanda.mesa_id,
        mesa_numero: comanda.mesa_numero,
      });

      res.json({ success: true, status: 'fechamento_solicitado' });
    } catch (err: any) {
      console.error('[comanda] Erro ao solicitar fechamento:', err);
      res.status(500).json({ error: 'Erro interno no servidor.' });
    }
  });

  // PUT /comanda/:id/encerrar (somente staff)
  router.put('/:id/encerrar', requireAuth, async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      res.status(400).json({ error: 'ID de comanda inválido' });
      return;
    }

    try {
      const comandaRes = await pool.query(
        'SELECT id, mesa_id, sessao_id, status FROM comandas WHERE id = $1',
        [id]
      );

      if (comandaRes.rows.length === 0) {
        res.status(404).json({ error: 'Comanda não encontrada' });
        return;
      }

      const comanda = comandaRes.rows[0];

      // Altera status para encerrada e preenche encerrada_em
      await pool.query(
        "UPDATE comandas SET status = 'encerrada', encerrada_em = NOW() WHERE id = $1",
        [id]
      );

      // Encerra a sessao_cliente preenchendo encerrada_em
      if (comanda.sessao_id) {
        await pool.query('UPDATE sessoes_cliente SET encerrada_em = NOW() WHERE id = $1', [comanda.sessao_id]);
      }

      // Reativa/mantém o qr_code daquela mesa como ativo = true
      await pool.query('UPDATE qr_codes SET ativo = true WHERE mesa_id = $1', [comanda.mesa_id]);

      // Emite evento WebSocket comanda_encerrada para o cliente daquela comanda e mesa
      io.to(`comanda:${id}`).emit('comanda_encerrada', { comanda_id: id });
      io.to(`mesa:${comanda.mesa_id}`).emit('comanda_encerrada', { comanda_id: id });

      res.json({ success: true, status: 'encerrada' });
    } catch (err: any) {
      console.error('[comanda] Erro ao encerrar comanda:', err);
      res.status(500).json({ error: 'Erro interno no servidor.' });
    }
  });

  return router;
}
