/**
 * Testes unitários — MesaService
 *
 * Valida a lógica de negócio de mesas: listagem, busca por ID
 * e o fluxo de entrada em uma mesa (obter ou criar comanda).
 */
import { MesaService } from '../services/MesaService';
import { IMesaRepository } from '../repositories/interfaces';
import { Mesa, Comanda } from '../types';

// ── Dados de Mock ───────────────────────────────────────────
const mesasMock: Mesa[] = [
  { id: 1, numero: 1 },
  { id: 2, numero: 2 },
  { id: 3, numero: 3 },
];

const comandaMock: Comanda = {
  id: 10,
  mesa_id: 1,
  status: 'aberta',
  criado_em: new Date(),
};

function criarMockRepo(): jest.Mocked<IMesaRepository> {
  return {
    listarTodas: jest.fn().mockResolvedValue(mesasMock),
    buscarPorId: jest.fn().mockImplementation(async (id: number) => {
      return mesasMock.find((m) => m.id === id) ?? null;
    }),
    obterOuCriarComanda: jest.fn().mockResolvedValue(comandaMock),
    buscarComanda: jest.fn().mockResolvedValue(comandaMock),
  };
}

describe('MesaService', () => {
  let service: MesaService;
  let mockRepo: jest.Mocked<IMesaRepository>;

  beforeEach(() => {
    mockRepo = criarMockRepo();
    service = new MesaService(mockRepo);
  });

  // ─── Listar Mesas ─────────────────────────────────────────

  test('deve listar todas as mesas', async () => {
    const mesas = await service.listarTodasAsMesas();
    expect(mesas).toHaveLength(3);
    expect(mockRepo.listarTodas).toHaveBeenCalledTimes(1);
  });

  // ─── Buscar Mesa por ID ───────────────────────────────────

  test('deve retornar mesa ao buscar por ID existente', async () => {
    const mesa = await service.buscarMesaPorId(1);
    expect(mesa).not.toBeNull();
    expect(mesa!.numero).toBe(1);
  });

  test('deve retornar null para mesa inexistente', async () => {
    const mesa = await service.buscarMesaPorId(99);
    expect(mesa).toBeNull();
  });

  // ─── Entrar na Mesa ───────────────────────────────────────

  test('deve retornar mesa e comanda ao entrar numa mesa válida', async () => {
    const resultado = await service.entrarNaMesa(1);
    expect(resultado.mesa.id).toBe(1);
    expect(resultado.comanda.status).toBe('aberta');
    expect(mockRepo.obterOuCriarComanda).toHaveBeenCalledWith(1);
  });

  test('deve lançar erro ao tentar entrar numa mesa inexistente', async () => {
    await expect(service.entrarNaMesa(99)).rejects.toThrow('Mesa não encontrada');
  });
});
