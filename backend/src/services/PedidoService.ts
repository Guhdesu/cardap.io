import { Server as SocketServer } from 'socket.io';
import { IPedidoRepository } from '../repositories/interfaces';
import { NovoPedidoItem, PedidoItem, StatusPedido, ComandaComItens } from '../types';

export class PedidoService {
  constructor(
    private pedidoRepo: IPedidoRepository,
    private io: SocketServer,
  ) {}

  async fazerPedido(comanda_id: number, itens: NovoPedidoItem[]): Promise<PedidoItem[]> {
    const itensCriados = await this.pedidoRepo.criar(comanda_id, itens);

    // Busca dados da comanda para notificar o staff com o número da mesa
    const comandasAbertas = await this.pedidoRepo.listarComandasAbertas();
    const comanda = comandasAbertas.find((c) => c.id === comanda_id);

    // Emite para o painel do staff via Socket.io
    this.io.to('staff').emit('novo_pedido', {
      comanda_id,
      mesa_numero: comanda?.mesa_numero ?? '?',
      itens: itensCriados,
    });

    return itensCriados;
  }

  async obterPedidosPorComanda(comanda_id: number): Promise<PedidoItem[]> {
    return this.pedidoRepo.listarPorComanda(comanda_id);
  }

  async atualizarStatusItem(id: number, status: StatusPedido): Promise<PedidoItem> {
    const atualizado = await this.pedidoRepo.atualizarStatus(id, status);
    if (!atualizado) {
      throw new Error('Item de pedido não encontrado');
    }

    // Busca a mesa da comanda para notificar o cliente correto
    const comandas = await this.pedidoRepo.listarComandasAbertas();
    const comanda = comandas.find((c) => c.id === atualizado.comanda_id);

    if (comanda) {
      // Emite para a mesa específica via Socket.io
      this.io.to(`mesa:${comanda.mesa_id}`).emit('status_atualizado', {
        pedido_item_id: atualizado.id,
        status: atualizado.status,
        item_nome: atualizado.item_nome,
      });
    }

    return atualizado;
  }

  async listarComandasAtivas(): Promise<ComandaComItens[]> {
    return this.pedidoRepo.listarComandasAbertas();
  }
}
