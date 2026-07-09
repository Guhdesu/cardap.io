/**
 * Testes unitários — CardapioService
 *
 * Valida a camada de serviço do cardápio usando um repositório mock,
 * demonstrando o princípio de Inversão de Dependência (DIP/SOLID).
 */
import { CardapioService } from '../services/CardapioService';
import { ICardapioRepository } from '../repositories/interfaces';
import { ItemCardapio } from '../types';

// ── Mock do Repositório ─────────────────────────────────────
const mockItens: ItemCardapio[] = [
  {
    id: 1,
    nome: 'Hambúrguer Artesanal',
    descricao: 'Blend 180g, queijo cheddar, pão brioche',
    preco: 39.9,
    categoria: 'Pratos Principais',
    disponivel: true,
    imagem_url: 'https://example.com/hamburguer.jpg',
  },
  {
    id: 2,
    nome: 'Suco de Laranja',
    descricao: 'Natural, 500ml',
    preco: 12.0,
    categoria: 'Bebidas',
    disponivel: true,
    imagem_url: 'https://example.com/suco.jpg',
  },
  {
    id: 3,
    nome: 'Pudim',
    descricao: 'Pudim de leite condensado',
    preco: 15.0,
    categoria: 'Sobremesas',
    disponivel: false,
    imagem_url: 'https://example.com/pudim.jpg',
  },
];

function criarMockRepo(): jest.Mocked<ICardapioRepository> {
  return {
    listarDisponiveis: jest.fn().mockResolvedValue(
      mockItens.filter((i) => i.disponivel),
    ),
    buscarPorId: jest.fn().mockImplementation(async (id: number) => {
      return mockItens.find((i) => i.id === id) ?? null;
    }),
  };
}

describe('CardapioService', () => {
  let service: CardapioService;
  let mockRepo: jest.Mocked<ICardapioRepository>;

  beforeEach(() => {
    mockRepo = criarMockRepo();
    service = new CardapioService(mockRepo);
  });

  // ─── Listar Itens Disponíveis ─────────────────────────────

  test('deve retornar apenas itens disponíveis', async () => {
    const itens = await service.listarItensDisponiveis();
    expect(itens).toHaveLength(2);
    expect(itens.every((i) => i.disponivel)).toBe(true);
    expect(mockRepo.listarDisponiveis).toHaveBeenCalledTimes(1);
  });

  test('deve retornar lista vazia quando nenhum item está disponível', async () => {
    mockRepo.listarDisponiveis.mockResolvedValue([]);
    const itens = await service.listarItensDisponiveis();
    expect(itens).toHaveLength(0);
  });

  // ─── Buscar por ID ────────────────────────────────────────

  test('deve retornar o item ao buscar por ID existente', async () => {
    const item = await service.buscarItemPorId(1);
    expect(item).not.toBeNull();
    expect(item!.nome).toBe('Hambúrguer Artesanal');
    expect(mockRepo.buscarPorId).toHaveBeenCalledWith(1);
  });

  test('deve retornar null ao buscar por ID inexistente', async () => {
    const item = await service.buscarItemPorId(999);
    expect(item).toBeNull();
    expect(mockRepo.buscarPorId).toHaveBeenCalledWith(999);
  });
});
