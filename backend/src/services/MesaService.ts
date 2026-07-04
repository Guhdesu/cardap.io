import { IMesaRepository } from '../repositories/interfaces';
import { Mesa, Comanda } from '../types';

export class MesaService {
  constructor(private mesaRepo: IMesaRepository) {}

  async listarTodasAsMesas(): Promise<Mesa[]> {
    return this.mesaRepo.listarTodas();
  }

  async buscarMesaPorId(id: number): Promise<Mesa | null> {
    return this.mesaRepo.buscarPorId(id);
  }

  async entrarNaMesa(mesaId: number): Promise<{ mesa: Mesa; comanda: Comanda }> {
    const mesa = await this.mesaRepo.buscarPorId(mesaId);
    if (!mesa) {
      throw new Error('Mesa não encontrada');
    }
    const comanda = await this.mesaRepo.obterOuCriarComanda(mesaId);
    return { mesa, comanda };
  }
}
