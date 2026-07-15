import { ISessaoRepository, IMesaRepository } from '../repositories/interfaces';
import { SessaoCliente, QRCode } from '../types';

export class SessaoService {
  constructor(
    private sessaoRepo: ISessaoRepository,
    private mesaRepo: IMesaRepository
  ) {}

  async entrarComToken(token: string): Promise<{ sessao: SessaoCliente; mesaNumero: number }> {
    const qrCode = await this.sessaoRepo.buscarTokenAtivo(token);
    if (!qrCode) {
      throw new Error('Token inválido ou expirado');
    }

    const mesa = await this.mesaRepo.buscarPorId(qrCode.mesa_id);
    if (!mesa) {
      throw new Error('Mesa associada não encontrada');
    }

    // Cria a sessão do cliente
    const sessao = await this.sessaoRepo.criarSessao(qrCode.id, qrCode.mesa_id);

    // Obtém ou cria a comanda ativa para esta mesa vinculando com a sessão
    await this.mesaRepo.obterOuCriarComanda(qrCode.mesa_id, sessao.id);

    return { sessao, mesaNumero: mesa.numero };
  }

  async validarSessao(sessaoId: number): Promise<SessaoCliente | null> {
    return this.sessaoRepo.buscarSessaoAtiva(sessaoId);
  }

  async encerrarSessao(sessaoId: number): Promise<void> {
    await this.sessaoRepo.encerrarSessao(sessaoId);
  }

  async obterQRCodePorMesa(mesaId: number): Promise<QRCode | null> {
    return this.sessaoRepo.obterQRCodePorMesa(mesaId);
  }
}
