import { Router, Request, Response } from 'express';
import { CardapioService } from '../services/CardapioService';

export function cardapioRouter(service: CardapioService): Router {
  const router = Router();

  router.get('/', async (_req: Request, res: Response) => {
    const itens = await service.listarItensDisponiveis();
    res.json(itens);
  });

  return router;
}
