import { Router, Request, Response } from 'express';
import { IMesaRepository } from '../repositories/interfaces';

export function mesasRouter(repo: IMesaRepository): Router {
  const router = Router();

  // Retorna info da mesa + comanda ativa (cria se não existir)
  router.get('/:id', async (req: Request, res: Response) => {
    const mesaId = parseInt(req.params.id);

    if (isNaN(mesaId)) {
      res.status(400).json({ error: 'ID de mesa inválido' });
      return;
    }

    const mesa = await repo.buscarPorId(mesaId);
    if (!mesa) {
      res.status(404).json({ error: 'Mesa não encontrada' });
      return;
    }

    const comanda = await repo.obterOuCriarComanda(mesaId);
    res.json({ mesa, comanda });
  });

  return router;
}
