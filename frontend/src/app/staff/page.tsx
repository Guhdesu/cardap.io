'use client';

import { useEffect, useState, useRef } from 'react';
import { ComandaComItens, PedidoItem, StatusPedido } from '@/lib/types';
import { getSocket } from '@/lib/socket';
import { useStaffAuth } from '@/lib/useStaffAuth';
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
  const { usuario, carregando: carregandoAuth, logout, authHeader } = useStaffAuth();
  const [comandas, setComandas] = useState<ComandaComItens[]>([]);
  const [mesas, setMesas] = useState<{ id: number; numero: number }[]>([]);
  const [novoPedido, setNovoPedido] = useState(false);
  const [conectado, setConectado] = useState(false);
  const [activeTab, setActiveTab] = useState<'pedidos' | 'mesas'>('pedidos');
  const isFirstRender = useRef(true);
  const mesasRef = useRef<{ id: number; numero: number }[]>([]);

  useEffect(() => {
    if (carregandoAuth || !usuario) return;
    // Carga inicial com token de autenticação
    fetch(`${API}/pedidos/staff/comandas`, { headers: authHeader() })
      .then((r) => r.json())
      .then(setComandas);

    fetch(`${API}/mesas`, { headers: authHeader() })
      .then((r) => r.json())
      .then((data) => {
        setMesas(data);
        mesasRef.current = data;
      })
      .catch((e) => console.error('[Mesas] Erro ao carregar mesas:', e));

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
        const mesaObj = mesasRef.current.find((m) => m.numero === data.mesa_numero);
        return [
          {
            id: data.comanda_id,
            mesa_id: mesaObj ? mesaObj.id : 0,
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
  }, [carregandoAuth, usuario, authHeader]);

  const atualizarStatus = async (itemId: number, status: StatusPedido) => {
    await fetch(`${API}/pedidos/${itemId}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...authHeader() },
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
                  <div className={item.status === 'entregue' ? styles.cardHeaderEntregue : styles.cardHeader}>
                    <span className={styles.cardMesa}>MESA {String(item.mesa_numero).padStart(2, '0')}</span>
                    <span className={styles.cardComanda}>Comanda #{item.comanda_id}</span>
                  </div>

                  <div className={styles.cardBody}>
                    <div className={styles.cardItemRow}>
                      <span className={styles.cardItemQty}>{item.quantidade}x</span>
                      <span className={styles.cardItemName}>{item.item_nome}</span>
                    </div>
                    {item.observacao && (
                      <div className={styles.cardObs}>
                        💡 {item.observacao}
                      </div>
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
        <div className={styles.headerBrand}>
          <span className={styles.logo}>
            cardap<span className={styles.dot}>.</span>io
          </span>
          <span className={styles.panelBadge}>STAFF</span>
        </div>

        <div className={styles.headerActions}>
          {novoPedido && (
            <div className={`${styles.toast} animate-pulse`}>
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
          <div className={styles.usuarioInfo}>
            <span className={styles.usuarioNome}>{usuario?.nome}</span>
            <span className={styles.usuarioRole}>{usuario?.role}</span>
          </div>
          <button onClick={logout} className={styles.logoutBtn} title="Sair">
            SAIR →
          </button>
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
        {activeTab === 'mesas' ? (
          <div className={styles.mesasGrid}>
            {mesas.map((mesa) => {
              const comandasDaMesa = comandas.filter(
                (c) => c.mesa_id === mesa.id || c.mesa_numero === mesa.numero
              );
              const isOcupada = comandasDaMesa.length > 0;
              
              const totalMesa = comandasDaMesa.reduce((sumMesa, comanda) => {
                const totalComanda = comanda.itens.reduce(
                  (sumComanda, item) => sumComanda + (item.quantidade * (item.preco ?? 0)),
                  0
                );
                return sumMesa + totalComanda;
              }, 0);

              return (
                <div key={mesa.id} className={`${styles.mesaCard} animate-fade-in`}>
                  <div className={styles.mesaCardHeader}>
                    <div>
                      <h3 className={styles.mesaCardTitle}>MESA {String(mesa.numero).padStart(2, '0')}</h3>
                      <span className={styles.mesaCardSub}>
                        {isOcupada ? `${comandasDaMesa.length} comanda(s) ativa(s)` : 'Sem comandas ativas'}
                      </span>
                    </div>
                    <span className={`${styles.mesaCardStatusBadge} ${isOcupada ? styles.mesaOcupada : styles.mesaLivre}`}>
                      {isOcupada ? 'Ocupada' : 'Livre'}
                    </span>
                  </div>

                  <div className={styles.mesaCardBody}>
                    {!isOcupada ? (
                      <p className={styles.emptyMesaText}>Mesa livre no momento.</p>
                    ) : (
                      <div className={styles.comandasMesaList}>
                        {comandasDaMesa.map((comanda) => {
                          const totalComanda = comanda.itens.reduce(
                            (sum, item) => sum + (item.quantidade * (item.preco ?? 0)),
                            0
                          );

                          return (
                            <div key={comanda.id} className={styles.comandaMesaContainer}>
                              <div className={styles.comandaMesaHeader}>
                                <span className={styles.comandaMesaTitle}>Comanda #{comanda.id}</span>
                                <span className={styles.comandaMesaTotal}>R$ {totalComanda.toFixed(2)}</span>
                              </div>
                              <div className={styles.comandaMesaItens}>
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
                          );
                        })}
                      </div>
                    )}
                  </div>

                  <div className={styles.mesaCardFooter}>
                    <span className={styles.totalLabel}>TOTAL CONSOLIDADO:</span>
                    <span className={styles.totalValue}>R$ {totalMesa.toFixed(2)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : comandas.length === 0 ? (
          <div className={styles.empty}>
            <div className={styles.emptyIcon}>🍳</div>
            <p>Nenhum pedido ativo no momento.</p>
            <span>Os novos pedidos das mesas aparecerão aqui em tempo real.</span>
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
