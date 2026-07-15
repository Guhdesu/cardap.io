// Tipos espelhados do backend — mantém contratos alinhados
export type StatusPedido = 'pendente' | 'preparando' | 'pronto' | 'entregue';

export interface ItemCardapio {
  id: number;
  nome: string;
  descricao: string;
  preco: number;
  categoria: string;
  disponivel: boolean;
  imagem_url: string;
  imagem_public_id?: string | null;
}

export interface Comanda {
  id: number;
  mesa_id: number;
  status: 'aberta' | 'fechamento_solicitado' | 'encerrada' | 'fechada';
  criado_em: string;
}

export interface Mesa {
  id: number;
  numero: number;
}

export interface PedidoItem {
  id: number;
  comanda_id: number;
  item_id: number;
  item_nome: string;
  quantidade: number;
  observacao: string;
  status: StatusPedido;
  criado_em: string;
  preco?: number;
}

export interface ComandaComItens extends Comanda {
  mesa_numero: number;
  itens: PedidoItem[];
}

// Carrinho local (não vai pro backend diretamente)
export interface ItemCarrinho {
  item: ItemCardapio;
  quantidade: number;
  observacao: string;
}
