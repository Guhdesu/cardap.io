/**
 * Testes unitários — Comanda (modelo de domínio)
 *
 * Valida o ciclo de vida de uma Comanda:
 *  ABERTA → AGUARDANDO_PAGAMENTO → ENCERRADA
 * e as regras de negócio associadas (adicionar pedidos, calcular total).
 */
import { Comanda, PedidoResumo } from '../../models/Comanda';
import { StatusComanda } from '../../models/types';

describe('Comanda', () => {
  let comanda: Comanda;

  beforeEach(() => {
    comanda = new Comanda('mesa-001');
  });

  // ─── Criação ──────────────────────────────────────────────

  test('deve criar uma comanda com status ABERTA', () => {
    expect(comanda.status).toBe(StatusComanda.ABERTA);
    expect(comanda.mesaId).toBe('mesa-001');
    expect(comanda.pedidos).toHaveLength(0);
    expect(comanda.fechadaEm).toBeUndefined();
  });

  test('deve gerar um id único para cada comanda', () => {
    const outra = new Comanda('mesa-002');
    expect(comanda.id).not.toBe(outra.id);
  });

  // ─── Pedidos ──────────────────────────────────────────────

  test('deve adicionar pedidos quando a comanda está aberta', () => {
    const pedido: PedidoResumo = { id: 'ped-1', subtotal: 25.9 };
    comanda.adicionarPedido(pedido);
    expect(comanda.pedidos).toHaveLength(1);
    expect(comanda.pedidos[0]).toEqual(pedido);
  });

  test('deve lançar erro ao adicionar pedido em comanda não aberta', () => {
    comanda.solicitarFechamento();
    expect(() =>
      comanda.adicionarPedido({ id: 'ped-2', subtotal: 10 }),
    ).toThrow('Não é possível adicionar pedidos a uma comanda que não está aberta.');
  });

  // ─── Cálculo de Total ─────────────────────────────────────

  test('deve calcular total como 0 quando não há pedidos', () => {
    expect(comanda.calcularTotal()).toBe(0);
  });

  test('deve calcular total somando subtotais dos pedidos', () => {
    comanda.adicionarPedido({ id: 'ped-1', subtotal: 25.9 });
    comanda.adicionarPedido({ id: 'ped-2', subtotal: 14.5 });
    comanda.adicionarPedido({ id: 'ped-3', subtotal: 9.0 });
    expect(comanda.calcularTotal()).toBeCloseTo(49.4);
  });

  // ─── Transições de Estado ─────────────────────────────────

  test('deve transicionar de ABERTA para AGUARDANDO_PAGAMENTO', () => {
    comanda.solicitarFechamento();
    expect(comanda.status).toBe(StatusComanda.AGUARDANDO_PAGAMENTO);
  });

  test('deve lançar erro ao solicitar fechamento de comanda que já não está aberta', () => {
    comanda.solicitarFechamento();
    expect(() => comanda.solicitarFechamento()).toThrow(
      'Somente comandas abertas podem solicitar fechamento.',
    );
  });

  test('deve encerrar comanda que está AGUARDANDO_PAGAMENTO', () => {
    comanda.solicitarFechamento();
    comanda.encerrar();
    expect(comanda.status).toBe(StatusComanda.ENCERRADA);
    expect(comanda.fechadaEm).toBeInstanceOf(Date);
  });

  test('deve lançar erro ao encerrar comanda diretamente (sem solicitar fechamento)', () => {
    expect(() => comanda.encerrar()).toThrow(
      'O pagamento deve ser solicitado antes de encerrar a comanda.',
    );
  });

  test('deve bloquear pedidos após solicitar fechamento', () => {
    comanda.solicitarFechamento();
    expect(() =>
      comanda.adicionarPedido({ id: 'ped-x', subtotal: 5 }),
    ).toThrow();
  });

  test('deve manter o total calculado após encerrar a comanda', () => {
    comanda.adicionarPedido({ id: 'ped-1', subtotal: 30 });
    comanda.adicionarPedido({ id: 'ped-2', subtotal: 20 });
    comanda.solicitarFechamento();
    comanda.encerrar();
    expect(comanda.calcularTotal()).toBe(50);
  });
});
