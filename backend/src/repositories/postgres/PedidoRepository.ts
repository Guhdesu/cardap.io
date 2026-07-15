import { pool } from '../../db/connection';
import { IPedidoRepository } from '../interfaces';
import { PedidoItem, ComandaComItens, NovoPedidoItem, StatusPedido } from '../../types';

export class PedidoRepository implements IPedidoRepository {
  async criar(comanda_id: number, itens: NovoPedidoItem[]): Promise<PedidoItem[]> {
    const ids = itens.map((i) => i.item_id);
    const cardapioRes = await pool.query(
      'SELECT id, nome, preco FROM cardapio_itens WHERE id = ANY($1)',
      [ids]
    );
    const itemNomes = new Map<number, string>(
      cardapioRes.rows.map((row) => [row.id, row.nome])
    );
    const itemPrecos = new Map<number, number>(
      cardapioRes.rows.map((row) => [row.id, parseFloat(row.preco)])
    );

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const itensCriados: PedidoItem[] = [];

      for (const item of itens) {
        const nome = itemNomes.get(item.item_id) ?? 'Item Desconhecido';
        const preco = itemPrecos.get(item.item_id) ?? 0.00;
        const res = await client.query(
          'INSERT INTO pedido_itens (comanda_id, item_id, item_nome, quantidade, observacao, status, preco_unitario, criado_em) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW()) RETURNING id, comanda_id, item_id, item_nome, quantidade, observacao, status, preco_unitario, criado_em',
          [comanda_id, item.item_id, nome, item.quantidade, item.observacao ?? '', 'pendente', preco]
        );
        const row = res.rows[0];
        itensCriados.push({
          id: row.id,
          comanda_id: row.comanda_id,
          item_id: row.item_id,
          item_nome: row.item_nome,
          quantidade: row.quantidade,
          observacao: row.observacao,
          status: row.status,
          criado_em: row.criado_em,
          preco: parseFloat(row.preco_unitario),
        });
      }

      await client.query('COMMIT');
      return itensCriados;
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  }

  async atualizarStatus(id: number, status: StatusPedido): Promise<PedidoItem | null> {
    const res = await pool.query(
      'UPDATE pedido_itens SET status = $1 WHERE id = $2 RETURNING id, comanda_id, item_id, item_nome, quantidade, observacao, status, preco_unitario, criado_em',
      [status, id]
    );
    if (res.rows.length === 0) return null;
    const row = res.rows[0];

    return {
      id: row.id,
      comanda_id: row.comanda_id,
      item_id: row.item_id,
      item_nome: row.item_nome,
      quantidade: row.quantidade,
      observacao: row.observacao,
      status: row.status,
      criado_em: row.criado_em,
      preco: row.preco_unitario ? parseFloat(row.preco_unitario) : 0,
    };
  }

  async listarPorComanda(comanda_id: number): Promise<PedidoItem[]> {
    const res = await pool.query(
      `SELECT pi.id, pi.comanda_id, pi.item_id, pi.item_nome, pi.quantidade, pi.observacao, pi.status, pi.criado_em, pi.preco_unitario 
       FROM pedido_itens pi
       WHERE pi.comanda_id = $1 
       ORDER BY pi.criado_em ASC`,
      [comanda_id]
    );
    return res.rows.map((row) => ({
      id: row.id,
      comanda_id: row.comanda_id,
      item_id: row.item_id,
      item_nome: row.item_nome,
      quantidade: row.quantidade,
      observacao: row.observacao,
      status: row.status,
      criado_em: row.criado_em,
      preco: row.preco_unitario ? parseFloat(row.preco_unitario) : 0,
    }));
  }

  async listarComandasAbertas(): Promise<ComandaComItens[]> {
    const query = `
      SELECT 
        c.id AS comanda_id,
        c.mesa_id,
        c.status AS comanda_status,
        c.criado_em AS comanda_criado_em,
        m.numero AS mesa_numero,
        pi.id AS item_id,
        pi.item_id AS item_cardapio_id,
        pi.item_nome,
        pi.quantidade,
        pi.observacao,
        pi.status AS item_status,
        pi.criado_em AS item_criado_em,
        pi.preco_unitario AS item_preco
      FROM comandas c
      JOIN mesas m ON c.mesa_id = m.id
      LEFT JOIN pedido_itens pi ON pi.comanda_id = c.id
      WHERE c.status = 'aberta'
      ORDER BY c.criado_em DESC, pi.criado_em ASC
    `;
    const res = await pool.query(query);

    const comandasMap = new Map<number, ComandaComItens>();

    for (const row of res.rows) {
      if (!comandasMap.has(row.comanda_id)) {
        comandasMap.set(row.comanda_id, {
          id: row.comanda_id,
          mesa_id: row.mesa_id,
          status: row.comanda_status,
          criado_em: row.comanda_criado_em,
          mesa_numero: row.mesa_numero,
          itens: [],
        });
      }

      if (row.item_id) {
        comandasMap.get(row.comanda_id)!.itens.push({
          id: row.item_id,
          comanda_id: row.comanda_id,
          item_id: row.item_cardapio_id,
          item_nome: row.item_nome,
          quantidade: row.quantidade,
          observacao: row.observacao,
          status: row.item_status,
          criado_em: row.item_criado_em,
          preco: row.item_preco ? parseFloat(row.item_preco) : 0,
        });
      }
    }

    return Array.from(comandasMap.values()).filter((c) => c.itens.length > 0);
  }
}
