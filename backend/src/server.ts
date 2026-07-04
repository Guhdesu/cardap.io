import 'dotenv/config';
import express from 'express';
import { createServer } from 'http';
import { Server as SocketServer } from 'socket.io';
import { pool, testConnection } from './db/connection';
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

// ── Serviços ──────────────────────────────────────────────
import { CardapioService } from './services/CardapioService';
import { MesaService } from './services/MesaService';

// ── Config ────────────────────────────────────────────────
const PORT = process.env.PORT ?? 3001;
const FRONTEND_URL = process.env.FRONTEND_URL ?? 'http://localhost:3000';

// ── Instâncias dos repositórios ───────────────────────────
const cardapioRepo = new CardapioRepository();
const mesaRepo = new MesaRepository();
const pedidoRepo = new PedidoRepository(cardapioRepo, mesaRepo);

// ── Instâncias dos serviços ────────────────────────────────
const cardapioService = new CardapioService(cardapioRepo);
const mesaService = new MesaService(mesaRepo);

// ── App Express ───────────────────────────────────────────
const app = express();
const httpServer = createServer(app);

const io = new SocketServer(httpServer, {
  cors: { origin: FRONTEND_URL, methods: ['GET', 'POST'] },
});

app.use(cors({ origin: FRONTEND_URL }));
app.use(express.json());

// ── Rotas ─────────────────────────────────────────────────
app.use('/cardapio', cardapioRouter(cardapioService));
app.use('/mesas', mesasRouter(mesaService));
app.use('/pedidos', pedidosRouter(pedidoRepo, mesaRepo, io));
app.use('/qrcode', qrcodeRouter(mesaService, FRONTEND_URL));

app.get('/health', (_req, res) => res.json({ status: 'ok' }));

// Testa a conexão com o banco — usado para validar o deploy
app.get('/health/db', async (_req, res) => {
  if (!process.env.DATABASE_URL) {
    res.status(503).json({ status: 'unavailable', message: 'DATABASE_URL não configurada' });
    return;
  }
  try {
    const start = Date.now();
    const result = await pool.query('SELECT NOW() AS now');
    const latency = Date.now() - start;
    res.json({
      status: 'ok',
      db_time: result.rows[0].now,
      latency_ms: latency,
    });
  } catch (err) {
    res.status(500).json({ status: 'error', message: String(err) });
  }
});

// ── Socket.io ─────────────────────────────────────────────
setupSocketEvents(io);

// ── Start ─────────────────────────────────────────────────
httpServer.listen(PORT, async () => {
  console.log(`🚀 Backend rodando em http://localhost:${PORT}`);
  console.log(`   Frontend esperado em ${FRONTEND_URL}`);
  console.log(`   Repositórios: memory (mock)`);
  await testConnection();
});
