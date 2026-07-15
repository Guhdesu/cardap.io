import {
  ItemCardapio,
  Mesa,
  Comanda,
  PedidoItem,
  ComandaComItens,
  NovoPedidoItem,
  StatusPedido,
  QRCode,
  SessaoCliente,
} from '../types';

// ============================================================
// Interfaces dos repositórios — NUNCA alterar ao trocar de DB
// Trocar de mock → postgres = criar nova implementação aqui
// ============================================================

export interface ICardapioRepository {
  listarDisponiveis(): Promise<ItemCardapio[]>;
  buscarPorId(id: number): Promise<ItemCardapio | null>;
}

export interface IMesaRepository {
  listarTodas(): Promise<Mesa[]>;
  buscarPorId(id: number): Promise<Mesa | null>;
  obterOuCriarComanda(mesaId: number, sessaoId?: number): Promise<Comanda>;
  buscarComanda(mesaId: number): Promise<Comanda | null>;
}

export interface IPedidoRepository {
  criar(comanda_id: number, itens: NovoPedidoItem[]): Promise<PedidoItem[]>;
  atualizarStatus(id: number, status: StatusPedido): Promise<PedidoItem | null>;
  listarPorComanda(comanda_id: number): Promise<PedidoItem[]>;
  listarComandasAbertas(): Promise<ComandaComItens[]>;
}

export interface ISessaoRepository {
  buscarTokenAtivo(token: string): Promise<QRCode | null>;
  criarSessao(qrCodeId: number, mesaId: number): Promise<SessaoCliente>;
  buscarSessaoAtiva(sessaoId: number): Promise<SessaoCliente | null>;
  encerrarSessao(sessaoId: number): Promise<void>;
  obterQRCodePorMesa(mesaId: number): Promise<QRCode | null>;
}
