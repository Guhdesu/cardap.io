'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { getSocket } from '@/lib/socket';
import { PedidoItem, StatusPedido, ComandaComItens, Mesa, ItemCardapio } from '@/lib/types';
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
  const [activeTab, setActiveTab] = useState<'kanban' | 'mesas' | 'cardapio'>('kanban');

  // Gerenciamento de Cardápio (Admin)
  const [itensCardapio, setItensCardapio] = useState<ItemCardapio[]>([]);
  const [showItemModal, setShowItemModal] = useState(false);
  const [itemEditando, setItemEditando] = useState<ItemCardapio | null>(null); // null = novo
  const [modalNome, setModalNome] = useState('');
  const [modalDescricao, setModalDescricao] = useState('');
  const [modalPreco, setModalPreco] = useState('');
  const [modalCategoria, setModalCategoria] = useState('');
  const [modalImagemUrl, setModalImagemUrl] = useState('');
  const [modalDisponivel, setModalDisponivel] = useState(true);
  const [avisoExclusao, setAvisoExclusao] = useState<string | null>(null);

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

    // Escuta atualizações de cardápio do socket para manter reatividade
    socket.on('cardapio_atualizado', () => {
      if (activeTab === 'cardapio' && usuario?.role === 'admin') {
        fetch(`${API}/admin/cardapio`, { headers: authHeader() })
          .then((r) => r.json())
          .then(setItensCardapio)
          .catch((e) => console.error('[Cardapio Admin Socket] Erro:', e));
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [carregandoAuth, usuario, activeTab]);

  // Carrega lista de cardápio do administrador
  useEffect(() => {
    if (activeTab === 'cardapio' && usuario?.role === 'admin') {
      fetch(`${API}/admin/cardapio`, { headers: authHeader() })
        .then((r) => r.json())
        .then(setItensCardapio)
        .catch((e) => console.error('[Cardapio Admin] Erro:', e));
    }
  }, [activeTab, usuario]);

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

  // Funções de Gerenciamento de Cardápio
  const abrirCriarItem = () => {
    setItemEditando(null);
    setModalNome('');
    setModalDescricao('');
    setModalPreco('');
    setModalCategoria('');
    setModalImagemUrl('');
    setModalDisponivel(true);
    setShowItemModal(true);
  };

  const abrirEditarItem = (item: ItemCardapio) => {
    setItemEditando(item);
    setModalNome(item.nome);
    setModalDescricao(item.descricao);
    setModalPreco(String(item.preco));
    setModalCategoria(item.categoria);
    setModalImagemUrl(item.imagem_url);
    setModalDisponivel(item.disponivel);
    setShowItemModal(true);
  };

  const toggleDisponibilidade = async (item: ItemCardapio) => {
    try {
      const res = await fetch(`${API}/admin/cardapio/${item.id}/disponibilidade`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...authHeader() },
        body: JSON.stringify({ disponivel: !item.disponivel }),
      });

      if (!res.ok) {
        throw new Error('Falha ao atualizar disponibilidade.');
      }
      
      const itemAtualizado = await res.json();
      setItensCardapio((prev) => prev.map((i) => i.id === item.id ? itemAtualizado : i));
    } catch (e: any) {
      alert(e.message || 'Erro ao alterar disponibilidade.');
    }
  };

  const salvarItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalNome || !modalCategoria || !modalPreco) {
      alert('Nome, Categoria e Preço são obrigatórios.');
      return;
    }

    const priceNum = parseFloat(modalPreco);
    if (isNaN(priceNum) || priceNum <= 0) {
      alert('O preço deve ser maior que zero.');
      return;
    }

    const payload = {
      nome: modalNome,
      descricao: modalDescricao,
      preco: priceNum,
      categoria: modalCategoria,
      imagem_url: modalImagemUrl,
      disponivel: modalDisponivel,
    };

    try {
      const url = itemEditando ? `${API}/admin/cardapio/${itemEditando.id}` : `${API}/admin/cardapio`;
      const method = itemEditando ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', ...authHeader() },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Falha ao salvar item.');
      }

      const itemSalvo = await res.json();
      
      if (itemEditando) {
        setItensCardapio((prev) => prev.map((i) => i.id === itemEditando.id ? itemSalvo : i));
      } else {
        setItensCardapio((prev) => [...prev, itemSalvo]);
      }
      
      setShowItemModal(false);
    } catch (err: any) {
      alert(err.message || 'Erro ao salvar item.');
    }
  };

  const excluirItem = async (itemId: number) => {
    if (!confirm('Deseja realmente excluir este item do cardápio?')) return;

    try {
      const res = await fetch(`${API}/admin/cardapio/${itemId}`, {
        method: 'DELETE',
        headers: authHeader(),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Falha ao excluir item.');
      }

      const data = await res.json();
      if (data.marcado_indisponivel) {
        setAvisoExclusao(data.mensagem);
        // Atualiza a lista para marcar como esgotado/indisponível localmente
        if (data.item) {
          setItensCardapio((prev) => prev.map((i) => i.id === itemId ? data.item : i));
        }
      } else {
        setItensCardapio((prev) => prev.filter((i) => i.id !== itemId));
      }
    } catch (err: any) {
      alert(err.message || 'Erro ao excluir item.');
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

  // Categorias disponíveis para o datalist no modal
  const categoriasDisponiveis = Array.from(new Set(itensCardapio.map((i) => i.categoria)));

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
        {usuario?.role === 'admin' && (
          <button
            className={`${styles.tabBtn} ${activeTab === 'cardapio' ? styles.tabBtnActive : ''}`}
            onClick={() => setActiveTab('cardapio')}
          >
            🍔 GERENCIAR CARDÁPIO
          </button>
        )}
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
        ) : activeTab === 'cardapio' ? (
          <div className={styles.adminCardapioContainer}>
            <div className={styles.adminCardapioHeader}>
              <h2 className={styles.sectionTitle}>GERENCIAR CARDÁPIO</h2>
              <button className="btn btn-primary" onClick={abrirCriarItem}>
                ➕ ADICIONAR NOVO ITEM
              </button>
            </div>

            <div className={styles.adminCardapioList}>
              {itensCardapio.length === 0 ? (
                <div className={styles.emptyCardList}>Nenhum item cadastrado no cardápio</div>
              ) : (
                itensCardapio.map((item) => (
                  <div key={item.id} className={`${styles.adminItemCard} ${!item.disponivel ? styles.adminItemIndisponivel : ''}`}>
                    <img src={item.imagem_url || 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=120&q=80'} alt={item.nome} className={styles.adminItemImg} />
                    <div className={styles.adminItemDetails}>
                      <div className={styles.adminItemHeaderRow}>
                        <span className={styles.adminItemCat}>{item.categoria.toUpperCase()}</span>
                        <span className={`${styles.adminItemStatus} ${item.disponivel ? styles.statusAtivo : styles.statusInativo}`}>
                          {item.disponivel ? 'Disponível' : 'Esgotado'}
                        </span>
                      </div>
                      <h3 className={styles.adminItemNome}>{item.nome}</h3>
                      <p className={styles.adminItemDesc}>{item.descricao}</p>
                      <span className={styles.adminItemPreco}>R$ {item.preco.toFixed(2).replace('.', ',')}</span>
                    </div>

                    <div className={styles.adminItemAcoes}>
                      <label className={styles.switchContainer}>
                        <input
                          type="checkbox"
                          checked={item.disponivel}
                          onChange={() => toggleDisponibilidade(item)}
                        />
                        <span className={styles.switchLabel}>Disponível</span>
                      </label>
                      <button className="btn btn-outline" style={{ fontSize: '0.75rem', padding: '6px 12px' }} onClick={() => abrirEditarItem(item)}>
                        ✏️ EDITAR
                      </button>
                      <button
                        className="btn btn-outline"
                        style={{ borderColor: 'var(--color-accent)', color: 'var(--color-accent)', fontSize: '0.75rem', padding: '6px 12px' }}
                        onClick={() => excluirItem(item.id)}
                      >
                        🗑️ EXCLUIR
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Modal de Item (Criar / Editar) */}
            {showItemModal && (
              <div className={styles.modalOverlay}>
                <div className={styles.modal} style={{ maxWidth: '500px' }}>
                  <h3 className={styles.modalTitle}>{itemEditando ? 'Editar Item' : 'Novo Item do Cardápio'}</h3>
                  <form onSubmit={salvarItem} className={styles.modalForm}>
                    <div className={styles.formGroup}>
                      <label>Nome do Item *</label>
                      <input
                        type="text"
                        value={modalNome}
                        onChange={(e) => setModalNome(e.target.value)}
                        placeholder="Ex: X-Salada Especial"
                        required
                      />
                    </div>

                    <div className={styles.formGroup}>
                      <label>Descrição</label>
                      <textarea
                        value={modalDescricao}
                        onChange={(e) => setModalDescricao(e.target.value)}
                        placeholder="Ex: Blend de carne 150g, queijo cheddar..."
                        rows={3}
                      />
                    </div>

                    <div className={styles.formRow}>
                      <div className={styles.formGroup} style={{ flex: 1 }}>
                        <label>Preço (R$) *</label>
                        <input
                          type="number"
                          step="0.01"
                          value={modalPreco}
                          onChange={(e) => setModalPreco(e.target.value)}
                          placeholder="Ex: 29.90"
                          required
                        />
                      </div>

                      <div className={styles.formGroup} style={{ flex: 1 }}>
                        <label>Categoria *</label>
                        <input
                          type="text"
                          list="categorias-list"
                          value={modalCategoria}
                          onChange={(e) => setModalCategoria(e.target.value)}
                          placeholder="Digite ou selecione"
                          required
                        />
                        <datalist id="categorias-list">
                          {categoriasDisponiveis.map((cat) => (
                            <option key={cat} value={cat} />
                          ))}
                        </datalist>
                      </div>
                    </div>

                    <div className={styles.formGroup}>
                      <label>URL da Imagem</label>
                      <input
                        type="url"
                        value={modalImagemUrl}
                        onChange={(e) => setModalImagemUrl(e.target.value)}
                        placeholder="Ex: https://imagens.com/burgers.jpg"
                      />
                    </div>

                    {modalImagemUrl && (
                      <div className={styles.imgPreview}>
                        <p>Preview da Imagem:</p>
                        <img src={modalImagemUrl} alt="Preview" />
                      </div>
                    )}

                    <div className={styles.formGroupCheckbox}>
                      <label>
                        <input
                          type="checkbox"
                          checked={modalDisponivel}
                          onChange={(e) => setModalDisponivel(e.target.checked)}
                        />
                        <span>Item disponível para pedidos</span>
                      </label>
                    </div>

                    <div className={styles.modalActions}>
                      <button type="button" className="btn btn-outline" onClick={() => setShowItemModal(false)}>
                        Cancelar
                      </button>
                      <button type="submit" className="btn btn-primary">
                        Salvar Item
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* Aviso Exclusão Condicional */}
            {avisoExclusao && (
              <div className={styles.modalOverlay}>
                <div className={styles.modal}>
                  <h3 className={styles.modalTitle}>Item Inativado</h3>
                  <p className={styles.modalText}>{avisoExclusao}</p>
                  <button className="btn btn-primary" onClick={() => setAvisoExclusao(null)} style={{ width: '100%' }}>
                    Entendido
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className={styles.kanbanBoard}>
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
