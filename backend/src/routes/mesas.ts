import { Router, Request, Response } from 'express';
import { MesaService } from '../services/MesaService';
import { pool } from '../db/connection';

export function mesasRouter(service: MesaService): Router {
  const router = Router();

  // GET /mesas — lista todas as mesas
  router.get('/', async (_req: Request, res: Response) => {
    try {
      const mesas = await service.listarTodasAsMesas();
      res.json(mesas);
    } catch (err) {
      res.status(500).json({ error: (err as Error).message });
    }
  });

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

  // POST /mesas/:mesaId/comanda — cria (ou reabre) uma comanda
  router.post('/:mesaId/comanda', async (req: Request, res: Response) => {
    const mesaId = parseInt(req.params.mesaId);
    if (isNaN(mesaId)) {
      res.status(400).json({ error: 'ID de mesa inválido' });
      return;
    }

    try {
      const data = await service.entrarNaMesa(mesaId);
      res.status(201).json(data.comanda);
    } catch (err) {
      res.status(500).json({ error: (err as Error).message });
    }
  });

  // GET /mesas/:mesaId/status — retorna estado da mesa e comandas abertas
  router.get('/:mesaId/status', async (req: Request, res: Response) => {
    const mesaId = parseInt(req.params.mesaId);
    if (isNaN(mesaId)) {
      res.status(400).json({ error: 'ID de mesa inválido' });
      return;
    }

    try {
      const mesa = await service.buscarMesaPorId(mesaId);
      if (!mesa) {
        res.status(404).json({ error: 'Mesa não encontrada' });
        return;
      }

      // Busca todas as comandas abertas para a mesa
      const result = await pool.query(
        "SELECT id, mesa_id, status, criado_em FROM comandas WHERE mesa_id = $1 AND status = 'aberta' ORDER BY criado_em DESC",
        [mesaId]
      );

      const comandas = result.rows;
      const status = comandas.length > 0 ? 'ocupada' : 'livre';

      res.json({
        mesa,
        status,
        comandas,
      });
    } catch (err) {
      res.status(500).json({ error: (err as Error).message });
    }
  });

  return router;
}
