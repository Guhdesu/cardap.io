import { ICardapioRepository } from '../repositories/interfaces';
import { ItemCardapio } from '../types';

export class CardapioService {
  constructor(private cardapioRepo: ICardapioRepository) {}

  async listarItensDisponiveis(): Promise<ItemCardapio[]> {
    return this.cardapioRepo.listarDisponiveis();
  }

  async buscarItemPorId(id: number): Promise<ItemCardapio | null> {
    return this.cardapioRepo.buscarPorId(id);
  }
}
