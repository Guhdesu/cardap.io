'use client';

import { useEffect, useState, useRef } from 'react';
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
  pendente: 'PREPARAR',
  preparando: 'PRONTO',
  pronto: 'ENTREGAR',
};

// Sintetiza um som de sino de restaurante (ding-dong) usando Web Audio API
const playNotificationSound = () => {
  try {
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    // Primeiro tom (Ding)
    const osc1 = audioCtx.createOscillator();
    const gain1 = audioCtx.createGain();
    osc1.connect(gain1);
    gain1.connect(audioCtx.destination);
    
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(880, audioCtx.currentTime); // Nota Lá (A5)
    gain1.gain.setValueAtTime(0.2, audioCtx.currentTime);
    gain1.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.5);
    
    osc1.start(audioCtx.currentTime);
    osc1.stop(audioCtx.currentTime + 0.5);

    // Segundo tom (Dong) após 180ms
    setTimeout(() => {
      const osc2 = audioCtx.createOscillator();
      const gain2 = audioCtx.createGain();
      osc2.connect(gain2);
      gain2.connect(audioCtx.destination);
      
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(659.25, audioCtx.currentTime); // Nota Mi (E5)
      gain2.gain.setValueAtTime(0.2, audioCtx.currentTime);
      gain2.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.7);
      
      osc2.start(audioCtx.currentTime);
      osc2.stop(audioCtx.currentTime + 0.7);
    }, 180);
  } catch (err) {
    console.error('[Audio] Erro ao reproduzir notificação:', err);
  }
};

export default function StaffPage() {
  const [comandas, setComandas] = useState<ComandaComItens[]>([]);
  const [novoPedido, setNovoPedido] = useState(false);
  const [conectado, setConectado] = useState(false);
  const [activeTab, setActiveTab] = useState<'pedidos' | 'mesas'>('pedidos');
  const isFirstRender = useRef(true);

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
      playNotificationSound();

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

  // Achata e organiza todos os itens por status
  const todosItens = comandas.flatMap((c) =>
    c.itens.map((i) => ({
      ...i,
      comanda_id: c.id,
      mesa_numero: c.mesa_numero,
    }))
  );

  const itensPendente = todosItens.filter((i) => i.status === 'pendente');
  const itensPreparando = todosItens.filter((i) => i.status === 'preparando');
  const itensPronto = todosItens.filter((i) => i.status === 'pronto');
  // Para manter a coluna limpa, mostra apenas os últimos 8 entregues
  const itensEntregue = todosItens
    .filter((i) => i.status === 'entregue')
    .slice(-8);

  const totalAtivos = itensPendente.length + itensPreparando.length + itensPronto.length;

  const renderColuna = (titulo: string, emoji: string, itens: typeof todosItens, status: StatusPedido) => {
    return (
      <div className={styles.kanbanColumn}>
        <div className={styles.columnHeader}>
          <h2 className={styles.columnTitle}>
            <span>{emoji}</span> {titulo}
          </h2>
          <span className={styles.columnBadge}>{itens.length}</span>
        </div>

        <div className={styles.columnCards}>
          {itens.length === 0 ? (
            <div className={styles.emptyCardList}>Fila vazia</div>
          ) : (
            itens.map((item) => {
              const proximo = PROXIMO_STATUS[item.status];
              return (
                <div key={item.id} className={`${styles.kanbanCard} ${item.status === 'entregue' ? styles.cardEntregue : ''} animate-fade-in`}>
                  <div className={styles.cardHeader}>
                    <span className={styles.cardMesa}>MESA {String(item.mesa_numero).padStart(2, '0')}</span>
                    <span className={styles.cardId}>#{item.id}</span>
                  </div>
                  <div className={styles.cardBody}>
                    <span className={styles.cardItemNome}>
                      <span className={styles.cardItemQty}>{item.quantidade}x</span>
                      {item.item_nome}
                    </span>
                    {item.observacao && (
                      <span className={styles.cardObs}>"{item.observacao}"</span>
                    )}
                  </div>
                  {proximo && (
                    <div className={styles.cardFooter}>
                      <button
                        className={`btn btn-primary ${styles.cardBtn}`}
                        onClick={() => atualizarStatus(item.id, proximo)}
                      >
                        {STATUS_BTN_LABEL[item.status]} →
                      </button>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    );
  };

  return (
    <div className={styles.page}>
      {/* Header */}
      <header className={styles.header}>
        <div>
          <span className={styles.logo}>cardap<span className={styles.dot}>.</span>io</span>
          <h1 className={styles.title}>PAINEL DA COZINHA</h1>
        </div>
        <div className={styles.headerRight}>
          {novoPedido && (
            <div className={`${styles.novoPedidoAlert} animate-pulse`}>
              🔔 NOVO PEDIDO RECEBIDO!
            </div>
          )}
          <div className={`${styles.status} ${conectado ? styles.statusOn : styles.statusOff}`}>
            <span className={styles.statusDot} />
            {conectado ? 'Conectado' : 'Desconectado'}
          </div>
          {totalAtivos > 0 && (
            <div className={styles.totalBadge}>{totalAtivos} item{totalAtivos !== 1 ? 'ns' : ''} ativo{totalAtivos !== 1 ? 's' : ''}</div>
          )}
        </div>
      </header>

      {/* Navegação por Abas */}
      <div className={styles.tabsContainer}>
        <button
          className={`${styles.tabButton} ${activeTab === 'pedidos' ? styles.tabButtonActive : ''}`}
          onClick={() => setActiveTab('pedidos')}
        >
          📋 FILA DE PREPARAÇÃO
        </button>
        <button
          className={`${styles.tabButton} ${activeTab === 'mesas' ? styles.tabButtonActive : ''}`}
          onClick={() => setActiveTab('mesas')}
        >
          🪑 MESAS ATIVAS
        </button>
      </div>

      {/* Conteúdo Principal */}
      <main className={styles.main}>
        {comandas.length === 0 ? (
          <div className={styles.empty}>
            <div className={styles.emptyIcon}>🍳</div>
            <p>Nenhum pedido ativo no momento.</p>
            <span>Os novos pedidos das mesas aparecerão aqui em tempo real.</span>
          </div>
        ) : activeTab === 'mesas' ? (
          <div className={styles.mesasGrid}>
            {comandas.map((comanda) => {
              const totalComanda = comanda.itens.reduce((acc, item) => {
                const itemPreco = item.preco ?? 0;
                return acc + (item.quantidade * itemPreco);
              }, 0);

              return (
                <div key={comanda.id} className={`${styles.mesaCard} animate-fade-in`}>
                  <div className={styles.mesaCardHeader}>
                    <div>
                      <h3 className={styles.mesaCardTitle}>MESA {String(comanda.mesa_numero).padStart(2, '0')}</h3>
                      <span className={styles.mesaCardSub}>Comanda #{comanda.id}</span>
                    </div>
                    <span className={styles.mesaCardStatusBadge}>Ativa</span>
                  </div>

                  <div className={styles.mesaCardBody}>
                    <h4 className={styles.itemsTitle}>Itens Consumidos:</h4>
                    <div className={styles.mesaCardItemsList}>
                      {comanda.itens.map((item) => (
                        <div key={item.id} className={styles.mesaCardItem}>
                          <span className={styles.mesaCardItemQty}>{item.quantidade}x</span>
                          <span className={styles.mesaCardItemName}>{item.item_nome}</span>
                          <span className={styles.mesaCardItemPrice}>
                            R$ {((item.preco ?? 0) * item.quantidade).toFixed(2)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className={styles.mesaCardFooter}>
                    <span className={styles.totalLabel}>TOTAL A PAGAR:</span>
                    <span className={styles.totalValue}>R$ {totalComanda.toFixed(2)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className={styles.kanbanBoard}>
            {renderColuna('NOVOS', '📥', itensPendente, 'pendente')}
            {renderColuna('EM PREPARO', '🔥', itensPreparando, 'preparando')}
            {renderColuna('PRONTO', '🔔', itensPronto, 'pronto')}
            {renderColuna('ENTREGUE', '✅', itensEntregue, 'entregue')}
          </div>
        )}
      </main>
    </div>
  );
}
