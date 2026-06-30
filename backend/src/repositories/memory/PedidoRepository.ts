import { IPedidoRepository, ICardapioRepository } from '../interfaces';
import { PedidoItem, ComandaComItens, NovoPedidoItem, StatusPedido } from '../../types';
import { MesaRepository } from './MesaRepository';

export class PedidoRepository implements IPedidoRepository {
  private itens: PedidoItem[] = [];
  private nextId = 1;

  constructor(
    private cardapioRepo: ICardapioRepository,
    private mesaRepo: MesaRepository,
  ) {}

  async criar(comanda_id: number, novosItens: NovoPedidoItem[]): Promise<PedidoItem[]> {
    const criados: PedidoItem[] = [];

    for (const novoItem of novosItens) {
      const itemCardapio = await this.cardapioRepo.buscarPorId(novoItem.item_id);
      if (!itemCardapio) continue;

      const pedidoItem: PedidoItem = {
        id: this.nextId++,
        comanda_id,
        item_id: novoItem.item_id,
        item_nome: itemCardapio.nome,
        quantidade: novoItem.quantidade,
        observacao: novoItem.observacao ?? '',
        status: 'pendente',
        criado_em: new Date(),
      };

      this.itens.push(pedidoItem);
      criados.push(pedidoItem);
    }

    return criados;
  }

  async atualizarStatus(id: number, status: StatusPedido): Promise<PedidoItem | null> {
    const item = this.itens.find((i) => i.id === id);
    if (!item) return null;
    item.status = status;
    return item;
  }

  async listarPorComanda(comanda_id: number): Promise<PedidoItem[]> {
    return this.itens.filter((i) => i.comanda_id === comanda_id);
  }

  async listarComandasAbertas(): Promise<ComandaComItens[]> {
    const mesas = await this.mesaRepo.listarTodas();
    const resultado: ComandaComItens[] = [];

    for (const mesa of mesas) {
      const comanda = await this.mesaRepo.buscarComanda(mesa.id);
      if (!comanda || comanda.status !== 'aberta') continue;

      const itensDaComanda = await this.listarPorComanda(comanda.id);
      if (itensDaComanda.length === 0) continue;

      resultado.push({
        ...comanda,
        mesa_numero: mesa.numero,
        itens: itensDaComanda,
      });
    }

    // Mais recente primeiro
    return resultado.sort(
      (a, b) => b.criado_em.getTime() - a.criado_em.getTime(),
    );
  }
}
