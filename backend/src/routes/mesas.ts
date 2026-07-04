import { Router, Request, Response } from 'express';
import { MesaService } from '../services/MesaService';

export function mesasRouter(service: MesaService): Router {
  const router = Router();

  // Retorna info da mesa + comanda ativa (cria se não existir)
  router.get('/:id', async (req: Request, res: Response) => {
    const mesaId = parseInt(req.params.id);

    if (isNaN(mesaId)) {
      res.status(400).json({ error: 'ID de mesa inválido' });
      return;
    }

    try {
      const data = await service.entrarNaMesa(mesaId);
      res.json(data);
    } catch (err) {
      res.status(404).json({ error: (err as Error).message });
    }
  });

  return router;
}
