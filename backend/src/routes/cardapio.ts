import { Router, Request, Response } from 'express';
import { ICardapioRepository } from '../repositories/interfaces';

export function cardapioRouter(repo: ICardapioRepository): Router {
  const router = Router();

  router.get('/', async (_req: Request, res: Response) => {
    const itens = await repo.listarDisponiveis();
    res.json(itens);
  });

  return router;
}
