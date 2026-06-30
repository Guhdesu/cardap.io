import { IMesaRepository } from '../interfaces';
import { Mesa, Comanda } from '../../types';

const MESAS_SEED: Mesa[] = [
  { id: 1, numero: 1 },
  { id: 2, numero: 2 },
  { id: 3, numero: 3 },
  { id: 4, numero: 4 },
  { id: 5, numero: 5 },
  { id: 6, numero: 6 },
  { id: 7, numero: 7 },
  { id: 8, numero: 8 },
];

export class MesaRepository implements IMesaRepository {
  private mesas: Mesa[] = MESAS_SEED;
  private comandas: Comanda[] = [];
  private nextComandaId = 1;

  async listarTodas(): Promise<Mesa[]> {
    return this.mesas;
  }

  async buscarPorId(id: number): Promise<Mesa | null> {
    return this.mesas.find((m) => m.id === id) ?? null;
  }

  async buscarComanda(mesaId: number): Promise<Comanda | null> {
    return (
      this.comandas.find((c) => c.mesa_id === mesaId && c.status === 'aberta') ??
      null
    );
  }

  async obterOuCriarComanda(mesaId: number): Promise<Comanda> {
    const existente = await this.buscarComanda(mesaId);
    if (existente) return existente;

    const nova: Comanda = {
      id: this.nextComandaId++,
      mesa_id: mesaId,
      status: 'aberta',
      criado_em: new Date(),
    };
    this.comandas.push(nova);
    return nova;
  }
}
