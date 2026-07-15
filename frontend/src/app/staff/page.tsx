'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { getSocket } from '@/lib/socket';
import { PedidoItem, StatusPedido, ComandaComItens, Mesa } from '@/lib/types';
import styles from './page.module.css';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

const PROXIMO_STATUS: Record<StatusPedido, StatusPedido | null> = {
  pendente: 'preparando',
  preparando: 'pronto',
  pronto: 'entregue',
  entregue: null,
};

const STATUS_BTN_LABEL: Record<StatusPedido, string> = {
  pendente: 'Começar a Preparar',
  preparando: 'Pronto para Servir',
  pronto: 'Entregar Pedido',
  entregue: 'Entregue',
};

// Som de notificação neo-brutalista amigável
const playNotificationSound = () => {
  if (typeof window === 'undefined') return;
  try {
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    // Primeiro bip (grave)
    const osc1 = audioCtx.createOscillator();
    const gain1 = audioCtx.createGain();
    osc1.connect(gain1);
    gain1.connect(audioCtx.destination);
    osc1.frequency.value = 587.33; // D5
    gain1.gain.setValueAtTime(0.15, audioCtx.currentTime);
    gain1.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.15);
    osc1.start();
    osc1.stop(audioCtx.currentTime + 0.15);

    // Segundo bip (agudo, atrasado)
    setTimeout(() => {
      const osc2 = audioCtx.createOscillator();
      const gain2 = audioCtx.createGain();
      osc2.connect(gain2);
      gain2.connect(audioCtx.destination);
      osc2.frequency.value = 880; // A5
      gain2.gain.setValueAtTime(0.15, audioCtx.currentTime);
      gain2.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.25);
      osc2.start();
      osc2.stop(audioCtx.currentTime + 0.25);
    }, 120);

  } catch (e) {
    console.warn('[AudioContext] Não foi possível reproduzir som de notificação:', e);
  }
};

export default function StaffPanel() {
  const router = useRouter();
  const [usuario, setUsuario] = useState<{ id: number; nome: string; role: string } | null>(null);
  const [carregandoAuth, setCarregandoAuth] = useState(true);

  // Kanban / Mesas
  const [comandas, setComandas] = useState<ComandaComItens[]>([]);
  const [mesas, setMesas] = useState<Mesa[]>([]);
  const mesasRef = useRef<Mesa[]>([]);

  // Socket
  const [conectado, setConectado] = useState(false);
  const [novoPedido, setNovoPedido] = useState(false);
  const [novoFechamento, setNovoFechamento] = useState<string | null>(null);

  // Tabs
  const [activeTab, setActiveTab] = useState<'kanban' | 'mesas'>('kanban');

  // Recupera token do localStorage/cookie
  const getStaffToken = () => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('staff_token');
  };

  const authHeader = (): Record<string, string> => {
    const token = getStaffToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  // Auth check
  useEffect(() => {
    const token = getStaffToken();
    if (!token) {
      router.replace('/staff/login');
      return;
    }

    fetch(`${API}/auth/me`, { headers: { Authorization: `Bearer ${token}` } })
      .then(async (res) => {
        if (!res.ok) {
          throw new Error('Não autorizado');
        }
        return res.json();
      })
      .then((data) => {
        setUsuario(data.usuario);
        setCarregandoAuth(false);
      })
      .catch(() => {
        localStorage.removeItem('staff_token');
        router.replace('/staff/login');
      });
  }, [router]);

  // Carrega comanda/mesas e inicializa socket
  useEffect(() => {
    if (carregandoAuth || !usuario) return;
    
    // Carga inicial
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
              ? { ...c, status: 'aberta', itens: [...c.itens, ...data.itens] }
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

    socket.on('fechamento_solicitado', (data: { comanda_id: number; mesa_id: number; mesa_numero: number }) => {
      setNovoFechamento(`Mesa ${data.mesa_numero} solicitou a conta!`);
      setTimeout(() => setNovoFechamento(null), 6000);
      playNotificationSound();

      setComandas((prev) =>
        prev.map((c) =>
          c.id === data.comanda_id ? { ...c, status: 'fechamento_solicitado' } : c
        )
      );
    });

    return () => {
      socket.disconnect();
    };
  }, [carregandoAuth, usuario]);

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

  const confirmarPagamento = async (comandaId: number) => {
    try {
      const res = await fetch(`${API}/comanda/${comandaId}/encerrar`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...authHeader(),
        },
      });

      if (!res.ok) {
        throw new Error('Falha ao encerrar comanda.');
      }

      setComandas((prev) => prev.filter((c) => c.id !== comandaId));
    } catch (err: any) {
      alert(err.message || 'Erro ao confirmar pagamento.');
    }
  };

  const logout = () => {
    localStorage.removeItem('staff_token');
    router.replace('/staff/login');
  };

  if (carregandoAuth) {
    return (
      <div className={styles.loading}>
        <div className={styles.loadingDot} />
        <span>Carregando painel de staff...</span>
      </div>
    );
  }

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
  const itensEntregue = todosItens.filter((i) => i.status === 'entregue').slice(-8);

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
          {novoFechamento && (
            <div className={`${styles.toast} ${styles.toastFechamento} animate-pulse`}>
              💸 {novoFechamento}
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
            <span>Olá, <strong>{usuario?.nome}</strong> ({usuario?.role})</span>
            <button className={styles.logoutBtn} onClick={logout}>SAIR</button>
          </div>
        </div>
      </header>

      {/* Nav Tabs */}
      <div className={styles.tabsContainer}>
        <button
          className={`${styles.tabBtn} ${activeTab === 'kanban' ? styles.tabBtnActive : ''}`}
          onClick={() => setActiveTab('kanban')}
        >
          📋 FILA DA COZINHA (KANBAN)
        </button>
        <button
          className={`${styles.tabBtn} ${activeTab === 'mesas' ? styles.tabBtnActive : ''}`}
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
              const comandaFechamentoSolicitado = comandasDaMesa.some(
                (c) => c.status === 'fechamento_solicitado'
              );

              const totalMesa = comandasDaMesa.reduce((sumMesa, comanda) => {
                const totalComanda = comanda.itens.reduce(
                  (sumComanda, item) => sumComanda + (item.quantidade * (item.preco ?? 0)),
                  0
                );
                return sumMesa + totalComanda;
              }, 0);

              return (
                <div 
                  key={mesa.id} 
                  className={`${styles.mesaCard} ${
                    comandaFechamentoSolicitado ? styles.mesaCardPulsante : ''
                  } animate-fade-in`}
                >
                  <div className={styles.mesaCardHeader}>
                    <div>
                      <h3 className={styles.mesaCardTitle}>MESA {String(mesa.numero).padStart(2, '0')}</h3>
                      <span className={styles.mesaCardSub}>
                        {isOcupada ? `${comandasDaMesa.length} comanda(s) ativa(s)` : 'Sem comandas ativas'}
                      </span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px' }}>
                      <span className={`${styles.mesaCardStatusBadge} ${isOcupada ? styles.mesaOcupada : styles.mesaLivre}`}>
                        {isOcupada ? 'Ocupada' : 'Livre'}
                      </span>
                      <a
                        href={`${API}/qrcode/admin/${mesa.id}/export`}
                        download
                        className={styles.exportQRBtn}
                        title="Baixar QR Code para esta mesa"
                      >
                        📥 QR CODE
                      </a>
                    </div>
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
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                  <span className={styles.comandaMesaTitle}>COMANDA #{comanda.id}</span>
                                  {comanda.status === 'fechamento_solicitado' && (
                                    <span className={styles.contaSolicitadaBadge}>⚠️ CONTA SOLICITADA</span>
                                  )}
                                </div>
                                <span className={styles.comandaMesaTotal}>
                                  R$ {totalComanda.toFixed(2).replace('.', ',')}
                                </span>
                              </div>

                              <div className={styles.comandaMesaItens}>
                                {comanda.itens.map((item) => (
                                  <div key={item.id} className={styles.comandaItemRow}>
                                    <span>{item.quantidade}x {item.item_nome}</span>
                                    <span>R$ {((item.preco ?? 0) * item.quantidade).toFixed(2).replace('.', ',')}</span>
                                  </div>
                                ))}
                              </div>

                              {comanda.status === 'fechamento_solicitado' && (
                                <div className={styles.comandaMesaAcoes}>
                                  <button
                                    className={`btn btn-primary ${styles.confirmarPagamentoBtn}`}
                                    onClick={() => confirmarPagamento(comanda.id)}
                                  >
                                    💵 CONFIRMAR PAGAMENTO & ENCERRAR
                                  </button>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {isOcupada && (
                    <div className={styles.mesaCardFooter}>
                      <span>Total Consolidado:</span>
                      <strong>R$ {totalMesa.toFixed(2).replace('.', ',')}</strong>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className={styles.kanbanContainer}>
            {renderColuna('PENDENTE', '📥', itensPendente, 'pendente')}
            {renderColuna('PREPARANDO', '🔥', itensPreparando, 'preparando')}
            {renderColuna('PRONTO', '✅', itensPronto, 'pronto')}
            {renderColuna('ENTREGUE', '🤝', itensEntregue, 'entregue')}
          </div>
        )}
      </main>
    </div>
  );
}
