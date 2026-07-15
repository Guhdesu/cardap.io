import { Router, Request, Response } from 'express';
import { Server as SocketServer } from 'socket.io';
import multer from 'multer';
import { pool } from '../db/connection';
import { requireAuth, requireRole } from '../middleware/auth';
import { uploadToCloudinary, deleteFromCloudinary } from '../lib/cloudinary';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
  fileFilter: (_req, file, cb) => {
    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/jpg'];
    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Apenas imagens nos formatos JPG e PNG são permitidas.'));
    }
  }
});

export function adminCardapioRouter(io: SocketServer): Router {
  const router = Router();

  router.use(requireAuth);
  router.use(requireRole('admin'));

  router.get('/', async (_req: Request, res: Response) => {
    try {
      const result = await pool.query(
        'SELECT id, nome, descricao, preco, categoria, disponivel, imagem_url, imagem_public_id FROM cardapio_itens ORDER BY id ASC'
      );
      const items = result.rows.map((row) => ({
        id: row.id,
        nome: row.nome,
        descricao: row.descricao,
        preco: parseFloat(row.preco),
        categoria: row.categoria,
        disponivel: row.disponivel,
        imagem_url: row.imagem_url,
        imagem_public_id: row.imagem_public_id,
      }));
      res.json(items);
    } catch (err) {
      console.error('[AdminCardapio] Erro ao listar:', err);
      res.status(500).json({ error: 'Erro interno no servidor.' });
    }
  });

  router.post('/upload-imagem', (req, res, next) => {
    upload.single('imagem')(req, res, (err: any) => {
      if (err) {
        if (err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({ error: 'A imagem deve ter no máximo 5 MB.' });
        }
        return res.status(400).json({ error: err.message || 'Erro ao processar arquivo.' });
      }
      next();
    });
  }, async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        res.status(400).json({ error: 'Nenhum arquivo de imagem foi enviado.' });
        return;
      }

      const uploadResult = await uploadToCloudinary(req.file.buffer);
      res.status(200).json({
        secure_url: uploadResult.secure_url,
        public_id: uploadResult.public_id,
      });
    } catch (err: any) {
      console.error('[AdminCardapio] Erro no upload:', err);
      res.status(500).json({ error: err.message || 'Erro interno no servidor ao fazer upload.' });
    }
  });

  router.post('/', async (req: Request, res: Response) => {
    const { nome, descricao, preco, categoria, imagem_url, imagem_public_id, disponivel } = req.body;

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
        `INSERT INTO cardapio_itens (nome, descricao, preco, categoria, imagem_url, imagem_public_id, disponivel)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING id, nome, descricao, preco, categoria, imagem_url, imagem_public_id, disponivel`,
        [nome, descricao || '', priceNum, categoria, imagem_url || '', imagem_public_id || null, isDisponivel]
      );

      const novoItem = result.rows[0];
      novoItem.preco = parseFloat(novoItem.preco);

      io.emit('cardapio_atualizado', { acao: 'criar', item: novoItem });

      res.status(201).json(novoItem);
    } catch (err) {
      console.error('[AdminCardapio] Erro ao criar:', err);
      res.status(500).json({ error: 'Erro interno no servidor.' });
    }
  });

  router.put('/:id', async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      res.status(400).json({ error: 'ID inválido.' });
      return;
    }

    const { nome, descricao, preco, categoria, imagem_url, imagem_public_id, disponivel } = req.body;

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
      const currentRes = await pool.query(
        'SELECT imagem_public_id FROM cardapio_itens WHERE id = $1',
        [id]
      );
      if (currentRes.rows.length === 0) {
        res.status(404).json({ error: 'Item não encontrado.' });
        return;
      }
      const oldPublicId = currentRes.rows[0].imagem_public_id;

      if (oldPublicId && oldPublicId !== imagem_public_id) {
        try {
          await deleteFromCloudinary(oldPublicId);
        } catch (destroyErr) {
          console.error('[AdminCardapio] Falha ao deletar imagem antiga do Cloudinary:', destroyErr);
        }
      }

      const result = await pool.query(
        `UPDATE cardapio_itens
         SET nome = $1, descricao = $2, preco = $3, categoria = $4, imagem_url = $5, imagem_public_id = $6, disponivel = $7
         WHERE id = $8
         RETURNING id, nome, descricao, preco, categoria, imagem_url, imagem_public_id, disponivel`,
        [nome, descricao || '', priceNum, categoria, imagem_url || '', imagem_public_id || null, disponivel !== false, id]
      );

      const itemAtualizado = result.rows[0];
      itemAtualizado.preco = parseFloat(itemAtualizado.preco);

      io.emit('cardapio_atualizado', { acao: 'atualizar', item: itemAtualizado });

      res.json(itemAtualizado);
    } catch (err) {
      console.error('[AdminCardapio] Erro ao atualizar:', err);
      res.status(500).json({ error: 'Erro interno no servidor.' });
    }
  });

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
         RETURNING id, nome, descricao, preco, categoria, imagem_url, imagem_public_id, disponivel`,
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
      // 1. Busca o item para verificar se tem imagem cadastrada e obter o imagem_public_id
      const currentRes = await pool.query(
        'SELECT imagem_public_id FROM cardapio_itens WHERE id = $1',
        [id]
      );
      if (currentRes.rows.length === 0) {
        res.status(404).json({ error: 'Item não encontrado.' });
        return;
      }
      const publicId = currentRes.rows[0].imagem_public_id;

      // 2. Verifica se o item foi pedido em alguma comanda (histórico em pedido_itens)
      const checkRes = await pool.query(
        'SELECT 1 FROM pedido_itens WHERE item_id = $1 LIMIT 1',
        [id]
      );

      if (checkRes.rows.length > 0) {
        // Possui histórico: não deleta fisicamente, apenas marca como indisponível
        const updateRes = await pool.query(
          `UPDATE cardapio_itens
           SET disponivel = false
           WHERE id = $1
           RETURNING id, nome, descricao, preco, categoria, imagem_url, imagem_public_id, disponivel`,
          [id]
        );

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
        // Sem histórico: deleta do banco de dados
        await pool.query('DELETE FROM cardapio_itens WHERE id = $1', [id]);

        // Se houver imagem no Cloudinary, deleta ela também
        if (publicId) {
          try {
            await deleteFromCloudinary(publicId);
          } catch (destroyErr) {
            console.error('[AdminCardapio] Falha ao deletar imagem do Cloudinary na exclusão:', destroyErr);
          }
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
