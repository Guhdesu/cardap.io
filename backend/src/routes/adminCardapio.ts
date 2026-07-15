import { Router, Request, Response } from 'express';
import { Server as SocketServer } from 'socket.io';
import { pool } from '../db/connection';
import { requireAuth, requireRole } from '../middleware/auth';

export function adminCardapioRouter(io: SocketServer): Router {
  const router = Router();

  // Protege todas as rotas neste roteador
  router.use(requireAuth);
  router.use(requireRole('admin'));

  // GET /admin/cardapio — lista tudo (incluindo indisponíveis)
  router.get('/', async (_req: Request, res: Response) => {
    try {
      const result = await pool.query(
        'SELECT id, nome, descricao, preco, categoria, disponivel, imagem_url FROM cardapio_itens ORDER BY id ASC'
      );
      const items = result.rows.map((row) => ({
        id: row.id,
        nome: row.nome,
        descricao: row.descricao,
        preco: parseFloat(row.preco),
        categoria: row.categoria,
        disponivel: row.disponivel,
        imagem_url: row.imagem_url,
      }));
      res.json(items);
    } catch (err) {
      console.error('[AdminCardapio] Erro ao listar:', err);
      res.status(500).json({ error: 'Erro interno no servidor.' });
    }
  });

  // POST /admin/cardapio — cria novo item
  router.post('/', async (req: Request, res: Response) => {
    const { nome, descricao, preco, categoria, imagem_url, disponivel } = req.body;

    if (!nome || !categoria || preco === undefined) {
      res.status(400).json({ error: 'Nome, categoria e preço são obrigatórios.' });
      return;
    }

    const priceNum = parseFloat(preco);
    if (isNaN(priceNum) || priceNum <= 0) {
      res.status(400).json({ error: 'O preço deve ser um número maior que zero.' });
      return;
    }

    try {
      const isDisponivel = disponivel !== false;
      const result = await pool.query(
        `INSERT INTO cardapio_itens (nome, descricao, preco, categoria, imagem_url, disponivel)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING id, nome, descricao, preco, categoria, imagem_url, disponivel`,
        [nome, descricao || '', priceNum, categoria, imagem_url || '', isDisponivel]
      );

      const novoItem = result.rows[0];
      novoItem.preco = parseFloat(novoItem.preco);

      // WebSocket notification
      io.emit('cardapio_atualizado', { acao: 'criar', item: novoItem });

      res.status(201).json(novoItem);
    } catch (err) {
      console.error('[AdminCardapio] Erro ao criar:', err);
      res.status(500).json({ error: 'Erro interno no servidor.' });
    }
  });

  // PUT /admin/cardapio/:id — atualiza item
  router.put('/:id', async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      res.status(400).json({ error: 'ID inválido.' });
      return;
    }

    const { nome, descricao, preco, categoria, imagem_url, disponivel } = req.body;

    if (!nome || !categoria || preco === undefined) {
      res.status(400).json({ error: 'Nome, categoria e preço são obrigatórios.' });
      return;
    }

    const priceNum = parseFloat(preco);
    if (isNaN(priceNum) || priceNum <= 0) {
      res.status(400).json({ error: 'O preço deve ser um número maior que zero.' });
      return;
    }

    try {
      const result = await pool.query(
        `UPDATE cardapio_itens
         SET nome = $1, descricao = $2, preco = $3, categoria = $4, imagem_url = $5, disponivel = $6
         WHERE id = $7
         RETURNING id, nome, descricao, preco, categoria, imagem_url, disponivel`,
        [nome, descricao || '', priceNum, categoria, imagem_url || '', disponivel !== false, id]
      );

      if (result.rows.length === 0) {
        res.status(404).json({ error: 'Item não encontrado.' });
        return;
      }

      const itemAtualizado = result.rows[0];
      itemAtualizado.preco = parseFloat(itemAtualizado.preco);

      // WebSocket notification
      io.emit('cardapio_atualizado', { acao: 'atualizar', item: itemAtualizado });

      res.json(itemAtualizado);
    } catch (err) {
      console.error('[AdminCardapio] Erro ao atualizar:', err);
      res.status(500).json({ error: 'Erro interno no servidor.' });
    }
  });

  // PATCH /admin/cardapio/:id/disponibilidade — toggle rápido
  router.patch('/:id/disponibilidade', async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      res.status(400).json({ error: 'ID inválido.' });
      return;
    }

    const { disponivel } = req.body;
    if (disponivel === undefined) {
      res.status(400).json({ error: 'Campo disponivel é obrigatório.' });
      return;
    }

    try {
      const result = await pool.query(
        `UPDATE cardapio_itens
         SET disponivel = $1
         WHERE id = $2
         RETURNING id, nome, descricao, preco, categoria, imagem_url, disponivel`,
        [!!disponivel, id]
      );

      if (result.rows.length === 0) {
        res.status(404).json({ error: 'Item não encontrado.' });
        return;
      }

      const itemAtualizado = result.rows[0];
      itemAtualizado.preco = parseFloat(itemAtualizado.preco);

      // WebSocket notification
      io.emit('cardapio_atualizado', { acao: 'disponibilidade', item: itemAtualizado });

      res.json(itemAtualizado);
    } catch (err) {
      console.error('[AdminCardapio] Erro no patch disponibilidade:', err);
      res.status(500).json({ error: 'Erro interno no servidor.' });
    }
  });

  // DELETE /admin/cardapio/:id — deleta ou inativa
  router.delete('/:id', async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      res.status(400).json({ error: 'ID inválido.' });
      return;
    }

    try {
      // Verifica se o item foi pedido em alguma comanda (histórico em pedido_itens)
      const checkRes = await pool.query(
        'SELECT 1 FROM pedido_itens WHERE item_id = $1 LIMIT 1',
        [id]
      );

      if (checkRes.rows.length > 0) {
        // Possui histórico: não deleta, apenas marca como indisponível
        const updateRes = await pool.query(
          `UPDATE cardapio_itens
           SET disponivel = false
           WHERE id = $1
           RETURNING id, nome, descricao, preco, categoria, imagem_url, disponivel`,
          [id]
        );

        if (updateRes.rows.length === 0) {
          res.status(404).json({ error: 'Item não encontrado.' });
          return;
        }

        const itemAtualizado = updateRes.rows[0];
        itemAtualizado.preco = parseFloat(itemAtualizado.preco);

        // WebSocket notification
        io.emit('cardapio_atualizado', { acao: 'disponibilidade', item: itemAtualizado });

        res.json({
          success: true,
          marcado_indisponivel: true,
          mensagem: 'O item possui histórico de pedidos e não pôde ser excluído. Foi marcado como indisponível.',
          item: itemAtualizado
        });
      } else {
        // Sem histórico: deleta
        const deleteRes = await pool.query(
          'DELETE FROM cardapio_itens WHERE id = $1 RETURNING id',
          [id]
        );

        if (deleteRes.rows.length === 0) {
          res.status(404).json({ error: 'Item não encontrado.' });
          return;
        }

        // WebSocket notification
        io.emit('cardapio_atualizado', { acao: 'deletar', id });

        res.json({
          success: true,
          marcado_indisponivel: false,
          mensagem: 'Item excluído com sucesso.'
        });
      }
    } catch (err) {
      console.error('[AdminCardapio] Erro ao deletar:', err);
      res.status(500).json({ error: 'Erro interno no servidor.' });
    }
  });

  return router;
}
