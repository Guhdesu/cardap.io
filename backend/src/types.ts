// ============================================================
// Tipos compartilhados do domínio cardap.io
// ============================================================

export type StatusPedido = 'pendente' | 'preparando' | 'pronto' | 'entregue';
export type StatusComanda = 'aberta' | 'fechada';

export interface Mesa {
  id: number;
  numero: number;
}

export interface ItemCardapio {
  id: number;
  nome: string;
  descricao: string;
  preco: number;
  categoria: string;
  disponivel: boolean;
  imagem_url: string;
}

export interface Comanda {
  id: number;
  mesa_id: number;
  status: StatusComanda;
  criado_em: Date;
}

export interface PedidoItem {
  id: number;
  comanda_id: number;
  item_id: number;
  item_nome: string;
  quantidade: number;
  observacao: string;
  status: StatusPedido;
  criado_em: Date;
  preco?: number;
}

export interface ComandaComItens extends Comanda {
  mesa_numero: number;
  itens: PedidoItem[];
}

// Payloads de entrada
export interface NovoPedidoItem {
  item_id: number;
  quantidade: number;
  observacao?: string;
}

export interface NovoPedidoPayload {
  comanda_id: number;
  itens: NovoPedidoItem[];
}

export interface AtualizarStatusPayload {
  status: StatusPedido;
}
