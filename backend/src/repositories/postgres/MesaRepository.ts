import { pool } from '../../db/connection';
import { IMesaRepository } from '../interfaces';
import { Mesa, Comanda, StatusComanda } from '../../types';

export class MesaRepository implements IMesaRepository {
  async listarTodas(): Promise<Mesa[]> {
    const res = await pool.query('SELECT id, numero FROM mesas ORDER BY numero ASC');
    return res.rows.map((row) => ({
      id: row.id,
      numero: row.numero,
    }));
  }

  async buscarPorId(id: number): Promise<Mesa | null> {
    const res = await pool.query('SELECT id, numero FROM mesas WHERE id = $1', [id]);
    if (res.rows.length === 0) return null;
    return {
      id: res.rows[0].id,
      numero: res.rows[0].numero,
    };
  }

  async obterOuCriarComanda(mesaId: number, sessaoId?: number): Promise<Comanda> {
    const existente = await this.buscarComanda(mesaId);
    if (existente) {
      if (sessaoId && !existente.sessao_id) {
        await pool.query('UPDATE comandas SET sessao_id = $1 WHERE id = $2', [sessaoId, existente.id]);
        existente.sessao_id = sessaoId;
      }
      return existente;
    }

    const res = await pool.query(
      'INSERT INTO comandas (mesa_id, sessao_id, status, criado_em) VALUES ($1, $2, $3, NOW()) RETURNING id, mesa_id, sessao_id, status, criado_em',
      [mesaId, sessaoId || null, 'aberta']
    );
    const row = res.rows[0];
    return {
      id: row.id,
      mesa_id: row.mesa_id,
      sessao_id: row.sessao_id ? Number(row.sessao_id) : undefined,
      status: row.status as StatusComanda,
      criado_em: row.criado_em,
    };
  }

  async buscarComanda(mesaId: number): Promise<Comanda | null> {
    const res = await pool.query(
      "SELECT id, mesa_id, sessao_id, status, criado_em FROM comandas WHERE mesa_id = $1 AND status = 'aberta' ORDER BY criado_em DESC LIMIT 1",
      [mesaId]
    );
    if (res.rows.length === 0) return null;
    const row = res.rows[0];
    return {
      id: row.id,
      mesa_id: row.mesa_id,
      sessao_id: row.sessao_id ? Number(row.sessao_id) : undefined,
      status: row.status as StatusComanda,
      criado_em: row.criado_em,
    };
  }
}
