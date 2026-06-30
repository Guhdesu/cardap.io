'use client';

import { useEffect, useState } from 'react';
import { ComandaComItens, PedidoItem, StatusPedido } from '@/lib/types';
import { getSocket } from '@/lib/socket';
import styles from './page.module.css';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

const STATUS_LABEL: Record<StatusPedido, string> = {
  pendente: 'Pendente',
  preparando: 'Preparando',
  pronto: 'Pronto',
  entregue: 'Entregue',
};

const PROXIMO_STATUS: Record<StatusPedido, StatusPedido | null> = {
  pendente: 'preparando',
  preparando: 'pronto',
  pronto: 'entregue',
  entregue: null,
};

const STATUS_BTN_LABEL: Partial<Record<StatusPedido, string>> = {
  pendente: 'INICIAR PREPARO',
  preparando: 'MARCAR PRONTO',
  pronto: 'CONFIRMAR ENTREGA',
};

export default function StaffPage() {
  const [comandas, setComandas] = useState<ComandaComItens[]>([]);
  const [novoPedido, setNovoPedido] = useState(false);
  const [conectado, setConectado] = useState(false);

  useEffect(() => {
    // Carga inicial
    fetch(`${API}/pedidos/staff/comandas`)
      .then((r) => r.json())
      .then(setComandas);

    // Socket
    const socket = getSocket();
    socket.connect();
    socket.emit('join_staff');

    socket.on('connect', () => setConectado(true));
    socket.on('disconnect', () => setConectado(false));

    socket.on('novo_pedido', (data: { comanda_id: number; mesa_numero: number; itens: PedidoItem[] }) => {
      setNovoPedido(true);
      setTimeout(() => setNovoPedido(false), 4000);

      setComandas((prev) => {
        const existente = prev.find((c) => c.id === data.comanda_id);
        if (existente) {
          return prev.map((c) =>
            c.id === data.comanda_id
              ? { ...c, itens: [...c.itens, ...data.itens] }
              : c
          );
        }
        // Nova comanda
        return [
          {
            id: data.comanda_id,
            mesa_id: 0,
            mesa_numero: data.mesa_numero,
            status: 'aberta',
            criado_em: new Date().toISOString(),
            itens: data.itens,
          },
          ...prev,
        ];
      });
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const atualizarStatus = async (itemId: number, status: StatusPedido) => {
    await fetch(`${API}/pedidos/${itemId}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });

    setComandas((prev) =>
      prev.map((c) => ({
        ...c,
        itens: c.itens.map((i) => (i.id === itemId ? { ...i, status } : i)),
      }))
    );
  };

  const totalAtivos = comandas.reduce((sum, c) => sum + c.itens.filter((i) => i.status !== 'entregue').length, 0);

  return (
    <div className={styles.page}>
      {/* Header */}
      <header className={styles.header}>
        <div>
          <span className={styles.logo}>cardap<span className={styles.dot}>.</span>io</span>
          <h1 className={styles.title}>PAINEL DO STAFF</h1>
        </div>
        <div className={styles.headerRight}>
          {novoPedido && (
            <div className={`${styles.novoPedidoAlert} animate-fade-in`}>
              🔔 NOVO PEDIDO!
            </div>
          )}
          <div className={`${styles.status} ${conectado ? styles.statusOn : styles.statusOff}`}>
            <span className={styles.statusDot} />
            {conectado ? 'Conectado' : 'Desconectado'}
          </div>
          {totalAtivos > 0 && (
            <div className={styles.totalBadge}>{totalAtivos} ativo{totalAtivos !== 1 ? 's' : ''}</div>
          )}
        </div>
      </header>

      {/* Grid de comandas */}
      <main className={styles.main}>
        {comandas.length === 0 ? (
          <div className={styles.empty}>
            <div className={styles.emptyIcon}>🍽️</div>
            <p>Nenhum pedido ativo.</p>
            <span>Aguardando pedidos das mesas...</span>
          </div>
        ) : (
          <div className={styles.grid}>
            {comandas.map((comanda) => (
              <div key={comanda.id} className={styles.comandaCard}>
                <div className={styles.comandaHeader}>
                  <span className={styles.mesaTag}>MESA {String(comanda.mesa_numero).padStart(2, '0')}</span>
                  <span className={styles.itensCont}>
                    {comanda.itens.length} {comanda.itens.length === 1 ? 'item' : 'itens'}
                  </span>
                </div>

                <div className={styles.itensList}>
                  {comanda.itens.map((item) => {
                    const proximo = PROXIMO_STATUS[item.status];
                    return (
                      <div key={item.id} className={`${styles.itemRow} ${item.status === 'entregue' ? styles.itemEntregue : ''}`}>
                        <div className={styles.itemInfo}>
                          <span className={styles.itemQty}>{item.quantidade}x</span>
                          <div>
                            <span className={styles.itemNome}>{item.item_nome}</span>
                            {item.observacao && (
                              <span className={styles.itemObs}>"{item.observacao}"</span>
                            )}
                          </div>
                        </div>
                        <div className={styles.itemActions}>
                          <span className={`badge badge-${item.status}`}>{STATUS_LABEL[item.status]}</span>
                          {proximo && (
                            <button
                              className={`btn btn-primary ${styles.statusBtn}`}
                              onClick={() => atualizarStatus(item.id, proximo)}
                            >
                              {STATUS_BTN_LABEL[item.status]}
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
