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

  async obterOuCriarComanda(mesaId: number): Promise<Comanda> {
    const existente = await this.buscarComanda(mesaId);
    if (existente) return existente;

    const res = await pool.query(
      'INSERT INTO comandas (mesa_id, status, criado_em) VALUES ($1, $2, NOW()) RETURNING id, mesa_id, status, criado_em',
      [mesaId, 'aberta']
    );
    const row = res.rows[0];
    return {
      id: row.id,
      mesa_id: row.mesa_id,
      status: row.status as StatusComanda,
      criado_em: row.criado_em,
    };
  }

  async buscarComanda(mesaId: number): Promise<Comanda | null> {
    const res = await pool.query(
      "SELECT id, mesa_id, status, criado_em FROM comandas WHERE mesa_id = $1 AND status = 'aberta' ORDER BY criado_em DESC LIMIT 1",
      [mesaId]
    );
    if (res.rows.length === 0) return null;
    const row = res.rows[0];
    return {
      id: row.id,
      mesa_id: row.mesa_id,
      status: row.status as StatusComanda,
      criado_em: row.criado_em,
    };
  }
}
