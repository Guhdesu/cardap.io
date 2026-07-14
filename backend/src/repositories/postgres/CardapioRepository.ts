import { pool } from '../../db/connection';
import { ICardapioRepository } from '../interfaces';
import { ItemCardapio } from '../../types';

export class CardapioRepository implements ICardapioRepository {
  async listarDisponiveis(): Promise<ItemCardapio[]> {
    const res = await pool.query(
      'SELECT id, nome, descricao, preco, categoria, disponivel, imagem_url FROM cardapio_itens WHERE disponivel = true'
    );
    return res.rows.map((row) => ({
      id: row.id,
      nome: row.nome,
      descricao: row.descricao,
      preco: parseFloat(row.preco),
      categoria: row.categoria,
      disponivel: row.disponivel,
      imagem_url: row.imagem_url,
    }));
  }

  async buscarPorId(id: number): Promise<ItemCardapio | null> {
    const res = await pool.query(
      'SELECT id, nome, descricao, preco, categoria, disponivel, imagem_url FROM cardapio_itens WHERE id = $1',
      [id]
    );
    if (res.rows.length === 0) return null;
    const row = res.rows[0];
    return {
      id: row.id,
      nome: row.nome,
      descricao: row.descricao,
      preco: parseFloat(row.preco),
      categoria: row.categoria,
      disponivel: row.disponivel,
      imagem_url: row.imagem_url,
    };
  }
}
