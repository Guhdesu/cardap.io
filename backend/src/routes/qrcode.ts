import { Router, Request, Response } from 'express';
import QRCode from 'qrcode';
import { MesaService } from '../services/MesaService';
import { SessaoService } from '../services/SessaoService';
import { requireAuth } from '../middleware/auth';

export function qrcodeRouter(
  service: MesaService,
  sessaoService: SessaoService,
  frontendUrl: string
): Router {
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

    // Busca o token ativo na tabela qr_codes
    const tokenObj = await sessaoService.obterQRCodePorMesa(mesaId);
    const token = tokenObj ? tokenObj.token : '';

    // URL direciona para a página do frontend que cria a sessão
    const url = token
      ? `${frontendUrl}/entrar?token=${token}`
      : `${frontendUrl}/mesa/${mesaId}`;

    const png = await QRCode.toBuffer(url, { width: 400, margin: 2 });

    res.setHeader('Content-Type', 'image/png');
    res.send(png);
  });

  // GET /qrcode/admin/:mesaId/export - retorna PNG para download do QR Code da mesa (protegido)
  router.get('/admin/:mesaId/export', requireAuth, async (req: Request, res: Response) => {
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

    const tokenObj = await sessaoService.obterQRCodePorMesa(mesaId);
    if (!tokenObj) {
      res.status(404).json({ error: 'QR Code/Token não encontrado para esta mesa' });
      return;
    }

    const url = `${frontendUrl}/entrar?token=${tokenObj.token}`;
    const png = await QRCode.toBuffer(url, { width: 400, margin: 2 });

    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Content-Disposition', `attachment; filename="qrcode-mesa-${mesa.numero}.png"`);
    res.send(png);
  });

  // GET /qrcode — lista todas as mesas com URL do QR
  router.get('/', async (req: Request, res: Response) => {
    const mesas = await service.listarTodasAsMesas();
    const lista = await Promise.all(
      mesas.map(async (m) => {
        const tokenObj = await sessaoService.obterQRCodePorMesa(m.id);
        const token = tokenObj ? tokenObj.token : '';
        const backendUrl = `${req.protocol}://${req.get('host')}`;

        return {
          mesa_id: m.id,
          mesa_numero: m.numero,
          qrcode_url: `${backendUrl}/qrcode/${m.id}`,
          mesa_url: token
            ? `${frontendUrl}/entrar?token=${token}`
            : `${frontendUrl}/mesa/${m.id}`,
        };
      })
    );
    res.json(lista);
  });

  return router;
}
