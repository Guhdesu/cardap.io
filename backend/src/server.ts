import 'dotenv/config';
import express from 'express';
import { createServer } from 'http';
import { Server as SocketServer } from 'socket.io';
import cors from 'cors';

// ── Repositórios ──────────────────────────────────────────
// Para trocar para PostgreSQL: alterar estes 3 imports
import { CardapioRepository } from './repositories/memory/CardapioRepository';
import { MesaRepository } from './repositories/memory/MesaRepository';
import { PedidoRepository } from './repositories/memory/PedidoRepository';

// ── Rotas ─────────────────────────────────────────────────
import { cardapioRouter } from './routes/cardapio';
import { mesasRouter } from './routes/mesas';
import { pedidosRouter } from './routes/pedidos';
import { qrcodeRouter } from './routes/qrcode';

// ── Socket ────────────────────────────────────────────────
import { setupSocketEvents } from './socket/events';

// ── Config ────────────────────────────────────────────────
const PORT = process.env.PORT ?? 3001;
const FRONTEND_URL = process.env.FRONTEND_URL ?? 'http://localhost:3000';

// ── Instâncias dos repositórios ───────────────────────────
const cardapioRepo = new CardapioRepository();
const mesaRepo = new MesaRepository();
const pedidoRepo = new PedidoRepository(cardapioRepo, mesaRepo);

// ── App Express ───────────────────────────────────────────
const app = express();
const httpServer = createServer(app);

const io = new SocketServer(httpServer, {
  cors: { origin: FRONTEND_URL, methods: ['GET', 'POST'] },
});

app.use(cors({ origin: FRONTEND_URL }));
app.use(express.json());

// ── Rotas ─────────────────────────────────────────────────
app.use('/cardapio', cardapioRouter(cardapioRepo));
app.use('/mesas', mesasRouter(mesaRepo));
app.use('/pedidos', pedidosRouter(pedidoRepo, mesaRepo, io));
app.use('/qrcode', qrcodeRouter(mesaRepo, FRONTEND_URL));

app.get('/health', (_req, res) => res.json({ status: 'ok' }));

// ── Socket.io ─────────────────────────────────────────────
setupSocketEvents(io);

// ── Start ─────────────────────────────────────────────────
httpServer.listen(PORT, () => {
  console.log(`🚀 Backend rodando em http://localhost:${PORT}`);
  console.log(`   Frontend esperado em ${FRONTEND_URL}`);
  console.log(`   Repositórios: memory (mock)`);
});
