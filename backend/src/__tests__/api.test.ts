/**
 * Testes de Integração — API Rest
 *
 * Valida a integração entre as rotas HTTP do Express e os serviços.
 */
import request from 'supertest';
import express from 'express';
import { cardapioRouter } from '../routes/cardapio';
import { mesasRouter } from '../routes/mesas';
import { CardapioService } from '../services/CardapioService';
import { MesaService } from '../services/MesaService';

// ── Mocks dos Serviços ──────────────────────────────────────
const mockCardapioService = {
  listarItensDisponiveis: jest.fn().mockResolvedValue([
    { id: 1, nome: 'Pizza', preco: 45.0, disponivel: true }
  ]),
} as unknown as CardapioService;

const mockMesaService = {
  listarTodasAsMesas: jest.fn().mockResolvedValue([
    { id: 1, numero: 10 }
  ]),
  entrarNaMesa: jest.fn().mockResolvedValue({
    mesa: { id: 1, numero: 10 },
    comanda: { id: 100, status: 'aberta' }
  }),
} as unknown as MesaService;

// ── App Express de Teste ────────────────────────────────────
const app = express();
app.use(express.json());
app.use('/cardapio', cardapioRouter(mockCardapioService));
app.use('/mesas', mesasRouter(mockMesaService));

describe('Integração API', () => {

  // 1. Teste de Integração: Listar Cardápio
  test('GET /cardapio deve retornar os itens com status 200', async () => {
    const res = await request(app).get('/cardapio');
    
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body[0].nome).toBe('Pizza');
    expect(mockCardapioService.listarItensDisponiveis).toHaveBeenCalled();
  });

  // 2. Teste de Integração: Listar Mesas
  test('GET /mesas deve retornar as mesas com status 200', async () => {
    const res = await request(app).get('/mesas');
    
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body[0].numero).toBe(10);
    expect(mockMesaService.listarTodasAsMesas).toHaveBeenCalled();
  });

  // 3. Teste de Integração: Entrar na Mesa (GET com erro simulado)
  test('GET /mesas/:id deve retornar 404 se mesa não existe', async () => {
    mockMesaService.entrarNaMesa = jest.fn().mockRejectedValue(new Error('Mesa não encontrada'));
    
    const res = await request(app).get('/mesas/99');
    
    expect(res.status).toBe(404);
    expect(res.body.error).toBe('Mesa não encontrada');
  });
  
  // 4. Teste de Integração: Entrar na Mesa (Sucesso)
  test('GET /mesas/:id deve retornar 200 e a comanda associada', async () => {
    mockMesaService.entrarNaMesa = jest.fn().mockResolvedValue({
      mesa: { id: 1, numero: 10 },
      comanda: { id: 100, status: 'aberta' }
    });
    
    const res = await request(app).get('/mesas/1');
    
    expect(res.status).toBe(200);
    expect(res.body.mesa.numero).toBe(10);
    expect(res.body.comanda.status).toBe('aberta');
  });

});
