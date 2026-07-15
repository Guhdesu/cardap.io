'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ItemCardapio, ItemCarrinho, Comanda, PedidoItem, StatusPedido } from '@/lib/types';
import { getSocket } from '@/lib/socket';
import styles from './page.module.css';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

const CATEGORIAS = ['Todos', 'Burgers', 'Acompanhamentos', 'Bebidas', 'Sobremesas'];

const STATUS_LABEL: Record<StatusPedido, string> = {
  pendente: 'Pendente',
  preparando: '🔥 Preparando',
  pronto: '✅ Pronto!',
  entregue: 'Entregue',
};

export default function MesaPage() {
  const params = useParams();
  const router = useRouter();
  const mesaId = Number(params.id);

  // Estados principais
  const [comanda, setComanda] = useState<Comanda | null>(null);
  const [cardapio, setCardapio] = useState<ItemCardapio[]>([]);
  const [categoria, setCategoria] = useState('Todos');
  const [carrinho, setCarrinho] = useState<ItemCarrinho[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Estados integrados da Comanda (0ms delay)
  const [activeView, setActiveView] = useState<'cardapio' | 'comanda'>('cardapio');
  const [pedidos, setPedidos] = useState<PedidoItem[]>([]);
  const [observacoes, setObservacoes] = useState<Record<number, string>>({});
  const [comandaTab, setComandaTab] = useState<'carrinho' | 'pedidos'>('carrinho');
  const [enviando, setEnviando] = useState(false);
  const [fechamentoSolicitado, setFechamentoSolicitado] = useState(false);
  const [encerrada, setEncerrada] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // Inicialização unificada
  useEffect(() => {
    const init = async () => {
      try {
        const sessaoId = localStorage.getItem('sessao_id');
        const savedMesaId = localStorage.getItem('mesa_id');

        if (!sessaoId || !savedMesaId || Number(savedMesaId) !== mesaId) {
          router.replace('/entrar?expired=true');
          return;
        }

        // Valida a sessão contra o backend
        const validaRes = await fetch(`${API}/sessao/valida`, {
          headers: { 'x-sessao-id': sessaoId },
        });

        if (!validaRes.ok) {
          localStorage.removeItem('sessao_id');
          localStorage.removeItem('mesa_id');
          router.replace('/entrar?expired=true');
          return;
        }

        const [mesaRes, cardapioRes] = await Promise.all([
          fetch(`${API}/mesas/${mesaId}`),
          fetch(`${API}/cardapio`),
        ]);

        if (!mesaRes.ok) {
          const errData = await mesaRes.json();
          throw new Error(errData.error || 'Erro ao carregar mesa');
        }

        const mesaData = await mesaRes.json();
        const cardapioData = await cardapioRes.json();

        setCardapio(cardapioData);

        if (mesaData.comanda?.id) {
          const comandaId = mesaData.comanda.id;
          localStorage.setItem('comanda_id', String(comandaId));

          // Carrega os itens já pedidos da comanda
          const comandaRes = await fetch(`${API}/comanda/${comandaId}`, {
            headers: { 'x-sessao-id': sessaoId },
          });

          if (comandaRes.ok) {
            const comandaData = await comandaRes.json();
            setComanda(comandaData);
            setPedidos(comandaData.itens || []);
            if (comandaData.status === 'fechamento_solicitado') {
              setFechamentoSolicitado(true);
            } else if (comandaData.status === 'encerrada') {
              setEncerrada(true);
            }
          }

          // Restaurar carrinho do localStorage específico desta comanda
          const savedCarrinho = localStorage.getItem(`carrinho_comanda_${comandaId}`);
          if (savedCarrinho) {
            try {
              setCarrinho(JSON.parse(savedCarrinho));
            } catch (e) {
              console.error('[localStorage] Erro ao carregar carrinho:', e);
            }
          }
        } else {
          setComanda(mesaData.comanda);
        }

        localStorage.setItem('mesa_id', String(mesaId));
      } catch (err) {
        console.error('[init] Falha na inicialização:', err);
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    };

    init();
  }, [mesaId, router]);

  // Recarrega dados da comanda no background
  const recarregarComanda = async () => {
    if (!comanda) return;
    try {
      const sessaoId = localStorage.getItem('sessao_id') || '';
      const res = await fetch(`${API}/comanda/${comanda.id}`, {
        headers: { 'x-sessao-id': sessaoId },
      });
      if (res.ok) {
        const comandaData = await res.json();
        setComanda(comandaData);
        setPedidos(comandaData.itens || []);
        if (comandaData.status === 'fechamento_solicitado') {
          setFechamentoSolicitado(true);
        } else if (comandaData.status === 'encerrada') {
          setEncerrada(true);
        }
      }
    } catch (e) {
      console.error('[recarregarComanda] erro:', e);
    }
  };

  useEffect(() => {
    if (activeView === 'comanda') {
      recarregarComanda();
    }
  }, [activeView]);

  // Socket.io reativo para atualização de cardápio e comanda
  useEffect(() => {
    const socket = getSocket();
    socket.connect();
    socket.emit('join_mesa', { mesaId });

    socket.on('cardapio_atualizado', () => {
      fetch(`${API}/cardapio`)
        .then((r) => r.json())
        .then(setCardapio)
        .catch((e) => console.error('[Socket] Erro ao recarregar cardápio:', e));
    });

    socket.on('status_atualizado', (data: { pedido_item_id: number; status: StatusPedido; item_nome: string }) => {
      setPedidos((prev) =>
        prev.map((p) => (p.id === data.pedido_item_id ? { ...p, status: data.status } : p))
      );
    });

    socket.on('comanda_encerrada', (data: { comanda_id: number }) => {
      const activeComandaId = localStorage.getItem('comanda_id');
      if (activeComandaId && Number(data.comanda_id) === Number(activeComandaId)) {
        localStorage.removeItem('sessao_id');
        localStorage.removeItem('mesa_id');
        localStorage.removeItem('comanda_id');
        localStorage.removeItem(`carrinho_comanda_${activeComandaId}`);
        setEncerrada(true);
      }
    });

    socket.on('fechamento_solicitado', (data: { comanda_id: number }) => {
      const activeComandaId = localStorage.getItem('comanda_id');
      if (activeComandaId && Number(data.comanda_id) === Number(activeComandaId)) {
        setFechamentoSolicitado(true);
      }
    });

    return () => {
      socket.off('cardapio_atualizado');
      socket.off('status_atualizado');
      socket.off('comanda_encerrada');
      socket.off('fechamento_solicitado');
      socket.disconnect();
    };
  }, [mesaId]);

  // Persiste o carrinho no localStorage
  useEffect(() => {
    if (!loading && comanda?.id) {
      localStorage.setItem(`carrinho_comanda_${comanda.id}`, JSON.stringify(carrinho));
    }
  }, [carrinho, comanda, loading]);

  const itensFiltrados = categoria === 'Todos'
    ? cardapio
    : cardapio.filter((i) => i.categoria === categoria);

  const totalCarrinho = carrinho.reduce((sum, i) => sum + i.item.preco * i.quantidade, 0);
  const totalPedidos = pedidos.reduce((sum, p) => sum + (p.preco ?? 0) * p.quantidade, 0);
  const totalConsolidado = totalPedidos + totalCarrinho;
  const qtdCarrinho = carrinho.reduce((sum, i) => sum + i.quantidade, 0);

  const adicionarAoCarrinho = (item: ItemCardapio) => {
    if (!item.disponivel || fechamentoSolicitado) return;
    setCarrinho((prev) => {
      const existe = prev.find((i) => i.item.id === item.id);
      if (existe) return prev.map((i) => i.item.id === item.id ? { ...i, quantidade: i.quantidade + 1 } : i);
      return [...prev, { item, quantidade: 1, observacao: '' }];
    });
  };

  const removerDoCarrinho = (itemId: number) => {
    if (fechamentoSolicitado) return;
    setCarrinho((prev) => {
      const existe = prev.find((i) => i.item.id === itemId);
      if (!existe) return prev;
      if (existe.quantidade === 1) return prev.filter((i) => i.item.id !== itemId);
      return prev.map((i) => i.item.id === itemId ? { ...i, quantidade: i.quantidade - 1 } : i);
    });
  };

  const qtdNoItem = useCallback(
    (itemId: number) => carrinho.find((i) => i.item.id === itemId)?.quantidade ?? 0,
    [carrinho]
  );

  const enviarPedido = async () => {
    if (!comanda || carrinho.length === 0 || fechamentoSolicitado) return;
    setEnviando(true);

    try {
      const payload = {
        comanda_id: comanda.id,
        itens: carrinho.map((i) => ({
          item_id: i.item.id,
          quantidade: i.quantidade,
          observacao: observacoes[i.item.id] ?? '',
        })),
      };

      const sessaoId = localStorage.getItem('sessao_id') || '';

      const res = await fetch(`${API}/pedidos`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-sessao-id': sessaoId,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Falha ao enviar o pedido.');
      }

      const novosPedidos: PedidoItem[] = await res.json();
      setPedidos((prev) => [...prev, ...novosPedidos]);
      setCarrinho([]);
      setObservacoes({});
      localStorage.removeItem(`carrinho_comanda_${comanda.id}`);
      setComandaTab('pedidos');
    } catch (err) {
      alert((err as Error).message);
    } finally {
      setEnviando(false);
    }
  };

  const confirmarFechamento = async () => {
    setShowConfirmModal(false);
    if (!comanda) return;
    try {
      const sessaoId = localStorage.getItem('sessao_id') || '';
      const res = await fetch(`${API}/comanda/${comanda.id}/solicitar-fechamento`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-sessao-id': sessaoId,
        },
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Falha ao solicitar fechamento da conta.');
      }

      setFechamentoSolicitado(true);
      setComandaTab('pedidos');
    } catch (err: any) {
      alert(err.message || 'Erro ao fechar conta.');
    }
  };

  const handleVerComanda = () => {
    if (carrinho.length > 0) {
      setComandaTab('carrinho');
    } else {
      setComandaTab('pedidos');
    }
    setActiveView('comanda');
  };

  if (encerrada) {
    return (
      <div className={styles.thankYouContainer}>
        <div className={styles.thankYouCard}>
          <div className={styles.successIcon}>🎉</div>
          <h2 className={styles.successTitle}>Conta Paga!</h2>
          <p className={styles.successText}>Muito obrigado pela preferência. Volte sempre!</p>
          <button
            className="btn btn-primary"
            onClick={() => router.push('/')}
            style={{ width: '100%' }}
          >
            VOLTAR AO INÍCIO
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className={styles.loading}>
        <div className={styles.loadingDot} />
        <span>Carregando cardápio...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.errorContainer}>
        <div className={styles.errorIcon}>⚠️</div>
        <h2 className={styles.errorTitle}>Ops! Algo deu errado</h2>
        <p className={styles.errorMessage}>{error}</p>
        <button
          className="btn btn-primary"
          onClick={() => window.location.href = '/'}
          style={{ marginTop: '20px', width: '100%', justifyContent: 'center' }}
        >
          Voltar para a Página Inicial
        </button>
      </div>
    );
  }

  // Render da Comanda Integrada (0ms Delay)
  if (activeView === 'comanda') {
    return (
      <div className={styles.page}>
        <header className={styles.header}>
          <span className={styles.logo}>cardap<span className={styles.dot}>.</span>io</span>
          <div className={styles.mesaBadge}>MESA {mesaId.toString().padStart(2, '0')}</div>
        </header>

        <div style={{ padding: '0 16px' }}>
          <button onClick={() => setActiveView('cardapio')} className={styles.voltarLink}>
            ← VOLTAR AO CARDÁPIO
          </button>
        </div>

        <nav className={styles.nav}>
          <button
            className={`${styles.navTab} ${comandaTab === 'carrinho' ? styles.navTabActive : ''}`}
            onClick={() => setComandaTab('carrinho')}
          >
            CARRINHO {carrinho.length > 0 && <span className={styles.navBadge}>{carrinho.length}</span>}
          </button>
          <button
            className={`${styles.navTab} ${comandaTab === 'pedidos' ? styles.navTabActive : ''}`}
            onClick={() => setComandaTab('pedidos')}
          >
            HISTÓRICO {pedidos.length > 0 && <span className={styles.navBadge}>{pedidos.length}</span>}
          </button>
        </nav>

        <div className={styles.content}>
          {comandaTab === 'carrinho' && (
            <div>
              <h2 className={styles.sectionTitle}>ITENS PARA ENVIAR</h2>
              {fechamentoSolicitado ? (
                <div className={styles.fechamentoAguardando}>
                  <span>⌛ CONTA SOLICITADA</span>
                  <p>Esta comanda está em processo de fechamento. Novos pedidos estão bloqueados.</p>
                </div>
              ) : carrinho.length === 0 ? (
                <div className={styles.empty}>
                  <p>Nenhum item adicionado ao carrinho.</p>
                  <button onClick={() => setActiveView('cardapio')} className="btn btn-outline">
                    Adicionar Itens
                  </button>
                </div>
              ) : (
                <>
                  {carrinho.map((item) => (
                    <div key={item.item.id} className={styles.carrinhoItem}>
                      <div className={styles.carrinhoInfo}>
                        <span className={styles.carrinhoNome}>{item.item.nome}</span>
                        <span className="price">R$ {(item.item.preco * item.quantidade).toFixed(2).replace('.', ',')}</span>
                      </div>
                      <div className={styles.qtyControl}>
                        <button className={styles.qtyBtn} onClick={() => removerDoCarrinho(item.item.id)}>−</button>
                        <span className={styles.qtyNum}>{item.quantidade}</span>
                        <button className={styles.qtyBtn} onClick={() => adicionarAoCarrinho(item.item)}>+</button>
                      </div>
                      <textarea
                        className={styles.obsInput}
                        placeholder="Observação (opcional)"
                        value={observacoes[item.item.id] ?? ''}
                        onChange={(e) => setObservacoes((prev) => ({ ...prev, [item.item.id]: e.target.value }))}
                        rows={2}
                      />
                    </div>
                  ))}

                  <div className={styles.carrinhoTotal}>
                    <span>Subtotal do Carrinho</span>
                    <span className="price">R$ {totalCarrinho.toFixed(2).replace('.', ',')}</span>
                  </div>

                  <button
                    className="btn btn-primary"
                    style={{ width: '100%', marginTop: 16 }}
                    onClick={enviarPedido}
                    disabled={enviando}
                  >
                    {enviando ? 'Enviando...' : 'CONFIRMAR PEDIDO →'}
                  </button>
                </>
              )}
            </div>
          )}

          {comandaTab === 'pedidos' && (
            <div>
              <h2 className={styles.sectionTitle}>ITENS PEDIDOS</h2>
              {pedidos.length === 0 ? (
                <div className={styles.empty}>
                  <p>Nenhum pedido enviado ainda nesta comanda.</p>
                </div>
              ) : (
                <div className={styles.pedidosList}>
                  {pedidos.map((p) => (
                    <div key={p.id} className={styles.pedidoCard}>
                      <div className={styles.pedidoInfo}>
                        <span className={styles.pedidoNome}>{p.item_nome} (x{p.quantidade})</span>
                        {p.observacao && <span className={styles.pedidoObs}>{p.observacao}</span>}
                      </div>
                      <span className={`badge badge-${p.status}`}>{STATUS_LABEL[p.status]}</span>
                    </div>
                  ))}
                </div>
              )}

              <div className={styles.consolidacaoCard}>
                <h3 className={styles.tituloConsolidacao}>RESUMO DA CONTA</h3>
                <div className={styles.itemConsolidado}>
                  <span>Pedidos confirmados:</span>
                  <span>R$ {totalPedidos.toFixed(2).replace('.', ',')}</span>
                </div>
                {carrinho.length > 0 && (
                  <div className={styles.itemConsolidado}>
                    <span>Itens no carrinho:</span>
                    <span>R$ {totalCarrinho.toFixed(2).replace('.', ',')}</span>
                  </div>
                )}
                <div className={styles.linhaTotal}>
                  <span>Total Geral:</span>
                  <span>R$ {totalConsolidado.toFixed(2).replace('.', ',')}</span>
                </div>

                {fechamentoSolicitado ? (
                  <div className={styles.fechamentoAguardando}>
                    <span>⌛ CONTA SOLICITADA</span>
                    <p>Aguarde o garçom para realizar o pagamento e liberar a mesa.</p>
                  </div>
                ) : (
                  <button
                    className="btn btn-outline"
                    style={{ width: '100%', borderColor: 'var(--color-accent)', color: 'var(--color-accent)', fontWeight: 800 }}
                    onClick={() => setShowConfirmModal(true)}
                  >
                    🧮 PEDIR A CONTA / FECHAR COMANDA
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {showConfirmModal && (
          <div className={styles.modalOverlay}>
            <div className={styles.modal}>
              <h3 className={styles.modalTitle}>Confirmar Fechamento?</h3>
              <p className={styles.modalText}>
                Tem certeza que deseja solicitar o fechamento da conta? Você não poderá fazer novos pedidos nesta comanda.
              </p>
              <div className={styles.modalActions}>
                <button className="btn btn-outline" onClick={() => setShowConfirmModal(false)}>
                  Cancelar
                </button>
                <button className="btn btn-primary" onClick={confirmarFechamento}>
                  Pedir a Conta
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Render do Cardápio
  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <span className={styles.logo}>cardap<span className={styles.dot}>.</span>io</span>
        <div className={styles.mesaBadge}>MESA {mesaId.toString().padStart(2, '0')}</div>
      </header>

      <div className={styles.content}>
        <div className={`${styles.categorias} scrollable-x`}>
          {CATEGORIAS.map((cat) => (
            <button
              key={cat}
              className={`pill ${categoria === cat ? 'active' : ''}`}
              onClick={() => setCategoria(cat)}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className={styles.grid}>
          {itensFiltrados.map((item) => {
            const qty = qtdNoItem(item.id);
            return (
              <div key={item.id} className={`card-item ${styles.card}`}>
                <div className={styles.cardImg}>
                  <img src={item.imagem_url || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&auto=format&fit=crop&q=80'} alt={item.nome} />
                </div>
                <div className={styles.cardBody}>
                  <div>
                    <h3 className={styles.itemNome}>{item.nome.toUpperCase()}</h3>
                    <p className={styles.itemDesc}>{item.descricao}</p>
                  </div>
                  <div className={styles.cardFooter}>
                    <span className={`price ${styles.itemPreco}`}>
                      R$ {item.preco.toFixed(2).replace('.', ',')}
                    </span>
                    {!item.disponivel ? (
                      <span className={styles.esgotadoBadge}>ESGOTADO</span>
                    ) : qty === 0 ? (
                      <button className="btn-add" onClick={() => adicionarAoCarrinho(item)}>+</button>
                    ) : (
                      <div className={styles.qtyControl}>
                        <button className={styles.qtyBtn} onClick={() => removerDoCarrinho(item.id)}>−</button>
                        <span className={styles.qtyNum}>{qty}</span>
                        <button className={styles.qtyBtn} onClick={() => adicionarAoCarrinho(item)}>+</button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div style={{ height: 100 }} />
      </div>

      {comanda && (
        <div className={`bottom-bar animate-slide-up`}>
          <div>
            <span className={styles.bbQty}>
              {qtdCarrinho} {qtdCarrinho === 1 ? 'item' : 'itens'} no carrinho
            </span>
            <span className={styles.bbTotal}>
              R$ {totalCarrinho.toFixed(2).replace('.', ',')}
            </span>
          </div>
          <button
            className="btn btn-primary"
            onClick={handleVerComanda}
          >
            VER COMANDA →
          </button>
        </div>
      )}
    </div>
  );
}
