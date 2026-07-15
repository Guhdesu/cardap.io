import { pool } from '../../db/connection';
import { ISessaoRepository } from '../interfaces';
import { QRCode, SessaoCliente } from '../../types';

export class SessaoRepository implements ISessaoRepository {
  async buscarTokenAtivo(token: string): Promise<QRCode | null> {
    const res = await pool.query(
      'SELECT id, mesa_id, token, ativo, criado_em FROM qr_codes WHERE token = $1 AND ativo = true LIMIT 1',
      [token]
    );
    if (res.rows.length === 0) return null;
    const row = res.rows[0];
    return {
      id: row.id,
      mesa_id: row.mesa_id,
      token: row.token,
      ativo: row.ativo,
      criado_em: row.criado_em,
    };
  }

  async criarSessao(qrCodeId: number, mesaId: number): Promise<SessaoCliente> {
    const res = await pool.query(
      'INSERT INTO sessoes_cliente (qr_code_id, mesa_id, iniciada_em) VALUES ($1, $2, NOW()) RETURNING id, qr_code_id, mesa_id, iniciada_em, encerrada_em',
      [qrCodeId, mesaId]
    );
    const row = res.rows[0];
    return {
      id: row.id,
      qr_code_id: row.qr_code_id,
      mesa_id: row.mesa_id,
      iniciada_em: row.iniciada_em,
      encerrada_em: row.encerrada_em,
    };
  }

  async buscarSessaoAtiva(sessaoId: number): Promise<SessaoCliente | null> {
    const res = await pool.query(
      'SELECT id, qr_code_id, mesa_id, iniciada_em, encerrada_em FROM sessoes_cliente WHERE id = $1 AND encerrada_em IS NULL LIMIT 1',
      [sessaoId]
    );
    if (res.rows.length === 0) return null;
    const row = res.rows[0];
    return {
      id: row.id,
      qr_code_id: row.qr_code_id,
      mesa_id: row.mesa_id,
      iniciada_em: row.iniciada_em,
      encerrada_em: row.encerrada_em,
    };
  }

  async encerrarSessao(sessaoId: number): Promise<void> {
    await pool.query(
      'UPDATE sessoes_cliente SET encerrada_em = NOW() WHERE id = $1',
      [sessaoId]
    );
  }

  async obterQRCodePorMesa(mesaId: number): Promise<QRCode | null> {
    const res = await pool.query(
      'SELECT id, mesa_id, token, ativo, criado_em FROM qr_codes WHERE mesa_id = $1 AND ativo = true ORDER BY criado_em DESC LIMIT 1',
      [mesaId]
    );
    if (res.rows.length === 0) return null;
    const row = res.rows[0];
    return {
      id: row.id,
      mesa_id: row.mesa_id,
      token: row.token,
      ativo: row.ativo,
      criado_em: row.criado_em,
    };
  }
}
