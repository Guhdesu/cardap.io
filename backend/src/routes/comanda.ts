import { Router, Request, Response } from 'express';
import { pool } from '../db/connection';

export function comandaRouter(): Router {
  const router = Router();

  // GET /comanda/:id — retorna dados completos da comanda
  router.get('/:id', async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      res.status(400).json({ error: 'ID de comanda inválido' });
      return;
    }

    try {
      const comandaResult = await pool.query(
        'SELECT id, mesa_id, status, criado_em FROM comandas WHERE id = $1',
        [id]
      );

      if (comandaResult.rows.length === 0) {
        res.status(404).json({ error: 'Comanda não encontrada' });
        return;
      }

      const comanda = comandaResult.rows[0];

      // Busca os itens do pedido e seus preços atuais
      const itensResult = await pool.query(
        `SELECT pi.id, pi.item_id, pi.item_nome, pi.quantidade, pi.observacao, pi.status, pi.criado_em, ci.preco
         FROM pedido_itens pi
         LEFT JOIN cardapio_itens ci ON pi.item_id = ci.id
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
        preco: row.preco ? parseFloat(row.preco) : 0,
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

  return router;
}
