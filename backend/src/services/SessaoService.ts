import { ISessaoRepository, IMesaRepository } from '../repositories/interfaces';
import { SessaoCliente, QRCode } from '../types';
import { pool } from '../db/connection';

export class SessaoService {
  constructor(
    private sessaoRepo: ISessaoRepository,
    private mesaRepo: IMesaRepository
  ) {}

  async entrarComToken(
    token: string,
    comandaAcao?: 'juntar' | 'nova',
    targetComandaId?: number
  ): Promise<{ sessao: SessaoCliente; mesaNumero: number }> {
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

    if (comandaAcao === 'nova') {
      // Cria uma nova comanda obrigatoriamente
      await pool.query(
        'INSERT INTO comandas (mesa_id, sessao_id, status, criado_em) VALUES ($1, $2, $3, NOW())',
        [qrCode.mesa_id, sessao.id, 'aberta']
      );
    } else if (comandaAcao === 'juntar' && targetComandaId) {
      // Associa a comanda específica à sessão
      await pool.query('UPDATE comandas SET sessao_id = $1 WHERE id = $2', [sessao.id, targetComandaId]);
    } else {
      // Obtém ou cria a comanda ativa para esta mesa vinculando com a sessão
      await this.mesaRepo.obterOuCriarComanda(qrCode.mesa_id, sessao.id);
    }

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

  async buscarTokenAtivo(token: string): Promise<QRCode | null> {
    return this.sessaoRepo.buscarTokenAtivo(token);
  }

  async buscarMesaPorId(mesaId: number) {
    return this.mesaRepo.buscarPorId(mesaId);
  }
}
