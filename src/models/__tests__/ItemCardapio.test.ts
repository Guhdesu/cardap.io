/**
 * Testes unitários — ItemCardapio (modelo de domínio)
 *
 * Valida criação, validações de preço, atualização de imagem
 * e alternância de disponibilidade.
 */
import { ItemCardapio, CriarItemCardapioDTO } from '../../models/ItemCardapio';

describe('ItemCardapio', () => {
  const dadosBase: CriarItemCardapioDTO = {
    nome: 'Hambúrguer Artesanal',
    descricao: 'Pão brioche, blend 180g, queijo cheddar',
    preco: 39.9,
    categoriaId: 'cat-pratos',
    imagemUrl: 'https://example.com/hamburguer.jpg',
  };

  // ─── Criação ──────────────────────────────────────────────

  test('deve criar um item com todos os campos corretos', () => {
    const item = new ItemCardapio(dadosBase);
    expect(item.nome).toBe(dadosBase.nome);
    expect(item.descricao).toBe(dadosBase.descricao);
    expect(item.preco).toBe(39.9);
    expect(item.categoriaId).toBe('cat-pratos');
    expect(item.imagemUrl).toBe(dadosBase.imagemUrl);
    expect(item.disponivel).toBe(true);
  });

  test('deve gerar um id único para cada item', () => {
    const item1 = new ItemCardapio(dadosBase);
    const item2 = new ItemCardapio(dadosBase);
    expect(item1.id).not.toBe(item2.id);
  });

  test('deve criar item sem imagem quando imagemUrl não é fornecida', () => {
    const { imagemUrl, ...semImagem } = dadosBase;
    const item = new ItemCardapio(semImagem);
    expect(item.imagemUrl).toBeUndefined();
  });

  test('deve lançar erro ao criar item com preço zero', () => {
    expect(() => new ItemCardapio({ ...dadosBase, preco: 0 })).toThrow(
      'O preço deve ser maior que zero.',
    );
  });

  test('deve lançar erro ao criar item com preço negativo', () => {
    expect(() => new ItemCardapio({ ...dadosBase, preco: -10 })).toThrow(
      'O preço deve ser maior que zero.',
    );
  });

  // ─── Atualização de Preço ─────────────────────────────────

  test('deve atualizar o preço para um valor válido', () => {
    const item = new ItemCardapio(dadosBase);
    item.atualizarPreco(45.0);
    expect(item.preco).toBe(45.0);
  });

  test('deve lançar erro ao atualizar preço para zero', () => {
    const item = new ItemCardapio(dadosBase);
    expect(() => item.atualizarPreco(0)).toThrow('O preço deve ser maior que zero.');
  });

  test('deve lançar erro ao atualizar preço para valor negativo', () => {
    const item = new ItemCardapio(dadosBase);
    expect(() => item.atualizarPreco(-5)).toThrow('O preço deve ser maior que zero.');
  });

  // ─── Atualização de Imagem ────────────────────────────────

  test('deve atualizar a URL da imagem', () => {
    const item = new ItemCardapio(dadosBase);
    item.atualizarImagem('https://example.com/nova.jpg');
    expect(item.imagemUrl).toBe('https://example.com/nova.jpg');
  });

  test('deve lançar erro ao atualizar imagem com URL vazia', () => {
    const item = new ItemCardapio(dadosBase);
    expect(() => item.atualizarImagem('')).toThrow('A URL da imagem não pode ser vazia.');
  });

  test('deve lançar erro ao atualizar imagem com URL contendo apenas espaços', () => {
    const item = new ItemCardapio(dadosBase);
    expect(() => item.atualizarImagem('   ')).toThrow('A URL da imagem não pode ser vazia.');
  });

  // ─── Disponibilidade ─────────────────────────────────────

  test('deve marcar como indisponível', () => {
    const item = new ItemCardapio(dadosBase);
    item.marcarIndisponivel();
    expect(item.disponivel).toBe(false);
  });

  test('deve marcar como disponível novamente', () => {
    const item = new ItemCardapio(dadosBase);
    item.marcarIndisponivel();
    item.marcarDisponivel();
    expect(item.disponivel).toBe(true);
  });
});
