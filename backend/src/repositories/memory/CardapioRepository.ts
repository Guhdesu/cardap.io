import { ICardapioRepository } from '../interfaces';
import { ItemCardapio } from '../../types';

// ============================================================
// Seed do cardápio — edite aqui para alterar os itens
// ============================================================
const SEED: ItemCardapio[] = [
  {
    id: 1,
    nome: 'X-Treme Burger',
    descricao: 'Blend 180g, queijo cheddar duplo, bacon crocante, alface, tomate e molho especial da casa.',
    preco: 38.90,
    categoria: 'Burgers',
    disponivel: true,
    imagem_url: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&q=80',
  },
  {
    id: 2,
    nome: 'Smash Classic',
    descricao: 'Smash burger 120g smashado na chapa, queijo americano, cebola caramelizada e picles.',
    preco: 28.90,
    categoria: 'Burgers',
    disponivel: true,
    imagem_url: 'https://images.unsplash.com/photo-1550547660-d9450f859349?w=600&q=80',
  },
  {
    id: 3,
    nome: 'Double Stack',
    descricao: 'Dois blends 120g, queijo prato, alface americana, mostarda e ketchup artesanal.',
    preco: 44.90,
    categoria: 'Burgers',
    disponivel: true,
    imagem_url: 'https://images.unsplash.com/photo-1553979459-d2229ba7433b?w=600&q=80',
  },
  {
    id: 4,
    nome: 'Fries Clássico',
    descricao: 'Batata palito crocante com sal grosso e molho aioli.',
    preco: 18.90,
    categoria: 'Acompanhamentos',
    disponivel: true,
    imagem_url: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=600&q=80',
  },
  {
    id: 5,
    nome: 'Truffle Fries',
    descricao: 'Batata frita com azeite de trufas, parmesão ralado e salsinha.',
    preco: 26.90,
    categoria: 'Acompanhamentos',
    disponivel: true,
    imagem_url: 'https://images.unsplash.com/photo-1630384060421-cb20d0e0649d?w=600&q=80',
  },
  {
    id: 6,
    nome: 'Onion Rings',
    descricao: 'Anéis de cebola empanados com panko, crocantes e levíssimos.',
    preco: 22.90,
    categoria: 'Acompanhamentos',
    disponivel: true,
    imagem_url: 'https://images.unsplash.com/photo-1639024471283-03518883512d?w=600&q=80',
  },
  {
    id: 7,
    nome: 'Craft Lager',
    descricao: 'Cerveja lager artesanal gelada — 500ml, produção local.',
    preco: 16.90,
    categoria: 'Bebidas',
    disponivel: true,
    imagem_url: 'https://images.unsplash.com/photo-1608270586620-248524c67de9?w=600&q=80',
  },
  {
    id: 8,
    nome: 'Milkshake Baunilha',
    descricao: 'Milkshake cremoso de baunilha com chantilly e calda de caramelo.',
    preco: 24.90,
    categoria: 'Bebidas',
    disponivel: true,
    imagem_url: 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=600&q=80',
  },
  {
    id: 9,
    nome: 'Refrigerante Lata',
    descricao: 'Coca-Cola, Guaraná Antarctica ou Sprite — 350ml.',
    preco: 8.90,
    categoria: 'Bebidas',
    disponivel: true,
    imagem_url: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=600&q=80',
  },
  {
    id: 10,
    nome: 'Brownie Quente',
    descricao: 'Brownie de chocolate belga quentinho com sorvete de creme e calda de chocolate.',
    preco: 22.90,
    categoria: 'Sobremesas',
    disponivel: true,
    imagem_url: 'https://images.unsplash.com/photo-1564355808539-22fda35bed7e?w=600&q=80',
  },
];

export class CardapioRepository implements ICardapioRepository {
  private itens: ItemCardapio[] = SEED;

  async listarDisponiveis(): Promise<ItemCardapio[]> {
    return this.itens.filter((i) => i.disponivel);
  }

  async buscarPorId(id: number): Promise<ItemCardapio | null> {
    return this.itens.find((i) => i.id === id) ?? null;
  }
}
