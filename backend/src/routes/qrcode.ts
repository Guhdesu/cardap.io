import { Router, Request, Response } from 'express';
import QRCode from 'qrcode';
import { MesaService } from '../services/MesaService';

export function qrcodeRouter(service: MesaService, frontendUrl: string): Router {
  const router = Router();

  // GET /qrcode/:mesaId — retorna PNG do QR Code da mesa
  router.get('/:mesaId', async (req: Request, res: Response) => {
    const mesaId = parseInt(req.params.mesaId);

    if (isNaN(mesaId)) {
      res.status(400).json({ error: 'ID de mesa inválido' });
      return;
    }

    const mesa = await service.buscarMesaPorId(mesaId);
    if (!mesa) {
      res.status(404).json({ error: 'Mesa não encontrada' });
      return;
    }

    const url = `${frontendUrl}/mesa/${mesaId}`;
    const png = await QRCode.toBuffer(url, { width: 400, margin: 2 });

    res.setHeader('Content-Type', 'image/png');
    res.send(png);
  });

  // GET /qrcode — lista todas as mesas com URL do QR
  router.get('/', async (_req: Request, res: Response) => {
    const mesas = await service.listarTodasAsMesas();
    const lista = mesas.map((m) => ({
      mesa_id: m.id,
      mesa_numero: m.numero,
      qrcode_url: `${frontendUrl.replace(':3000', ':3001').replace(':3002', ':3001')}/qrcode/${m.id}`,
      mesa_url: `${frontendUrl}/mesa/${m.id}`,
    }));
    res.json(lista);
  });

  return router;
}
