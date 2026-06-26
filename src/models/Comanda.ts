import { randomUUID } from 'crypto';
import { StatusComanda } from './types';

export interface PedidoResumo {
  id: string;
  subtotal: number;
}

export class Comanda {
  readonly id: string;
  readonly mesaId: string;
  readonly abertaEm: Date;

  private _status: StatusComanda;
  private _pedidos: PedidoResumo[];
  private _fechadaEm?: Date;

  constructor(mesaId: string) {
    this.id = randomUUID();
    this.mesaId = mesaId;
    this.abertaEm = new Date();
    this._status = StatusComanda.ABERTA;
    this._pedidos = [];
  }

  get status(): StatusComanda {
    return this._status;
  }

  get pedidos(): ReadonlyArray<PedidoResumo> {
    return this._pedidos;
  }

  get fechadaEm(): Date | undefined {
    return this._fechadaEm;
  }

  adicionarPedido(pedido: PedidoResumo): void {
    if (this._status !== StatusComanda.ABERTA) {
      throw new Error('Não é possível adicionar pedidos a uma comanda que não está aberta.');
    }
    this._pedidos.push(pedido);
  }

  calcularTotal(): number {
    return this._pedidos.reduce((total, pedido) => total + pedido.subtotal, 0);
  }

  solicitarFechamento(): void {
    if (this._status !== StatusComanda.ABERTA) {
      throw new Error('Somente comandas abertas podem solicitar fechamento.');
    }
    this._status = StatusComanda.AGUARDANDO_PAGAMENTO;
  }

  encerrar(): void {
    if (this._status !== StatusComanda.AGUARDANDO_PAGAMENTO) {
      throw new Error('O pagamento deve ser solicitado antes de encerrar a comanda.');
    }
    this._status = StatusComanda.ENCERRADA;
    this._fechadaEm = new Date();
  }
}
