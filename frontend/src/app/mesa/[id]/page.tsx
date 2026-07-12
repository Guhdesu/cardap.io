'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
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
  const mesaId = Number(params.id);

  const [comanda, setComanda] = useState<Comanda | null>(null);
  const [cardapio, setCardapio] = useState<ItemCardapio[]>([]);
  const [categoria, setCategoria] = useState('Todos');
  const [carrinho, setCarrinho] = useState<ItemCarrinho[]>([]);
  const [pedidos, setPedidos] = useState<PedidoItem[]>([]);
  const [view, setView] = useState<'cardapio' | 'carrinho' | 'pedidos'>('cardapio');
  const [loading, setLoading] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [observacoes, setObservacoes] = useState<Record<number, string>>({});
  const [error, setError] = useState<string | null>(null);

  // Inicialização
  useEffect(() => {
    const init = async () => {
      try {
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

        setComanda(mesaData.comanda);
        setCardapio(cardapioData);

        // Restaurar carrinho do localStorage
        const savedCarrinho = localStorage.getItem(`carrinho_mesa_${mesaId}`);
        if (savedCarrinho) {
          try {
            setCarrinho(JSON.parse(savedCarrinho));
          } catch (e) {
            console.error('[localStorage] Erro ao carregar carrinho:', e);
          }
        }

        // Restaurar observacoes do localStorage
        const savedObs = localStorage.getItem(`observacoes_mesa_${mesaId}`);
        if (savedObs) {
          try {
            setObservacoes(JSON.parse(savedObs));
          } catch (e) {
            console.error('[localStorage] Erro ao carregar observações:', e);
          }
        }

        // Carregar pedidos existentes se a comanda existir
        if (mesaData.comanda && mesaData.comanda.id) {
          const pedidosRes = await fetch(`${API}/pedidos/comanda/${mesaData.comanda.id}`);
          if (pedidosRes.ok) {
            const pedidosData = await pedidosRes.json();
            setPedidos(pedidosData);
          }
        }

        // Socket
        const socket = getSocket();
        socket.connect();
        socket.emit('join_mesa', { mesaId });

        socket.on('status_atualizado', (data: { pedido_item_id: number; status: StatusPedido; item_nome: string }) => {
          setPedidos((prev) =>
            prev.map((p) => (p.id === data.pedido_item_id ? { ...p, status: data.status } : p))
          );
        });
      } catch (err) {
        console.error('[init] Falha na inicialização:', err);
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    };

    init();

    return () => {
      getSocket().disconnect();
    };
  }, [mesaId]);

  // Persiste o carrinho no localStorage sempre que mudar
  useEffect(() => {
    if (!loading) {
      localStorage.setItem(`carrinho_mesa_${mesaId}`, JSON.stringify(carrinho));
    }
  }, [carrinho, mesaId, loading]);

  // Persiste observações no localStorage sempre que mudar
  useEffect(() => {
    if (!loading) {
      localStorage.setItem(`observacoes_mesa_${mesaId}`, JSON.stringify(observacoes));
    }
  }, [observacoes, mesaId, loading]);

  const itensFiltrados = categoria === 'Todos'
    ? cardapio
    : cardapio.filter((i) => i.categoria === categoria);

  const totalCarrinho = carrinho.reduce((sum, i) => sum + i.item.preco * i.quantidade, 0);
  const qtdCarrinho = carrinho.reduce((sum, i) => sum + i.quantidade, 0);

  const adicionarAoCarrinho = (item: ItemCardapio) => {
    setCarrinho((prev) => {
      const existe = prev.find((i) => i.item.id === item.id);
      if (existe) return prev.map((i) => i.item.id === item.id ? { ...i, quantidade: i.quantidade + 1 } : i);
      return [...prev, { item, quantidade: 1, observacao: '' }];
    });
  };

  const removerDoCarrinho = (itemId: number) => {
    setCarrinho((prev) => {
      const existe = prev.find((i) => i.item.id === itemId);
      if (!existe) return prev;
      if (existe.quantidade === 1) return prev.filter((i) => i.item.id !== itemId);
      return prev.map((i) => i.item.id === itemId ? { ...i, quantidade: i.quantidade - 1 } : i);
    });
  };

  const enviarPedido = async () => {
    if (!comanda || carrinho.length === 0) return;
    setEnviando(true);

    const payload = {
      comanda_id: comanda.id,
      itens: carrinho.map((i) => ({
        item_id: i.item.id,
        quantidade: i.quantidade,
        observacao: observacoes[i.item.id] ?? '',
      })),
    };

    const res = await fetch(`${API}/pedidos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const novosPedidos: PedidoItem[] = await res.json();
    setPedidos((prev) => [...prev, ...novosPedidos]);
    setCarrinho([]);
    setObservacoes({});
    localStorage.removeItem(`carrinho_mesa_${mesaId}`);
    localStorage.removeItem(`observacoes_mesa_${mesaId}`);
    setEnviando(false);
    setView('pedidos');
  };

  const qtdNoItem = useCallback(
    (itemId: number) => carrinho.find((i) => i.item.id === itemId)?.quantidade ?? 0,
    [carrinho]
  );

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

  return (
    <div className={styles.page}>
      {/* Header */}
      <header className={styles.header}>
        <span className={styles.logo}>cardap<span className={styles.dot}>.</span>io</span>
        <div className={styles.mesaBadge}>MESA {mesaId.toString().padStart(2, '0')}</div>
      </header>

      {/* Nav tabs */}
      <nav className={styles.nav}>
        <button
          className={`${styles.navTab} ${view === 'cardapio' ? styles.navTabActive : ''}`}
          onClick={() => setView('cardapio')}
        >
          CARDÁPIO
        </button>
        <button
          className={`${styles.navTab} ${view === 'pedidos' ? styles.navTabActive : ''}`}
          onClick={() => setView('pedidos')}
        >
          MEUS PEDIDOS {pedidos.length > 0 && <span className={styles.navBadge}>{pedidos.length}</span>}
        </button>
      </nav>

      {/* View: Cardápio */}
      {view === 'cardapio' && (
        <div className={styles.content}>
          {/* Categorias */}
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

          {/* Grid de itens */}
          <div className={styles.grid}>
            {itensFiltrados.map((item) => {
              const qty = qtdNoItem(item.id);
              return (
                <div key={item.id} className={`card-item ${styles.card}`}>
                  <div className={styles.cardImg}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={item.imagem_url} alt={item.nome} />
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
                      {qty === 0 ? (
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

          {/* Espaço para o bottom bar */}
          <div style={{ height: qtdCarrinho > 0 ? 80 : 24 }} />
        </div>
      )}

      {/* View: Carrinho */}
      {view === 'carrinho' && (
        <div className={styles.content}>
          <h2 className={styles.sectionTitle}>SEU PEDIDO</h2>
          {carrinho.length === 0 ? (
            <div className={styles.empty}>
              <p>Carrinho vazio.</p>
              <button className="btn btn-outline" onClick={() => setView('cardapio')}>Ver Cardápio</button>
            </div>
          ) : (
            <>
              {carrinho.map((item) => (
                <div key={item.item.id} className={styles.carrinhoItem}>
                  <div className={styles.carrinhoInfo}>
                    <span className={styles.carrinhoNome}>{item.item.nome}</span>
                    <span className={`price`}>R$ {(item.item.preco * item.quantidade).toFixed(2).replace('.', ',')}</span>
                  </div>
                  <div className={styles.qtyControl}>
                    <button className={styles.qtyBtn} onClick={() => removerDoCarrinho(item.item.id)}>−</button>
                    <span className={styles.qtyNum}>{item.quantidade}</span>
                    <button className={styles.qtyBtn} onClick={() => adicionarAoCarrinho(item.item)}>+</button>
                  </div>
                  <textarea
                    className={`input ${styles.obsInput}`}
                    placeholder="Observação (opcional)"
                    value={observacoes[item.item.id] ?? ''}
                    onChange={(e) => setObservacoes((prev) => ({ ...prev, [item.item.id]: e.target.value }))}
                    rows={2}
                  />
                </div>
              ))}
              <div className={styles.carrinhoTotal}>
                <span>Total</span>
                <span className="price">R$ {totalCarrinho.toFixed(2).replace('.', ',')}</span>
              </div>
              <button
                className="btn btn-primary"
                style={{ width: '100%', marginTop: 16 }}
                onClick={enviarPedido}
                disabled={enviando}
              >
                {enviando ? 'Enviando...' : 'CONFIRMAR PEDIDO'}
              </button>
            </>
          )}
        </div>
      )}

      {/* View: Meus pedidos */}
      {view === 'pedidos' && (
        <div className={styles.content}>
          <h2 className={styles.sectionTitle}>MEUS PEDIDOS</h2>
          {pedidos.length === 0 ? (
            <div className={styles.empty}>
              <p>Nenhum pedido ainda.</p>
              <button className="btn btn-outline" onClick={() => setView('cardapio')}>Ver Cardápio</button>
            </div>
          ) : (
            <div className={styles.pedidosList}>
              {pedidos.map((p) => (
                <div key={p.id} className={`card-item ${styles.pedidoCard} animate-fade-in`}>
                  <div className={styles.pedidoInfo}>
                    <span className={styles.pedidoNome}>{p.item_nome}</span>
                    {p.observacao && <span className={styles.pedidoObs}>{p.observacao}</span>}
                  </div>
                  <span className={`badge badge-${p.status}`}>{STATUS_LABEL[p.status]}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Bottom bar — carrinho flutuante */}
      {qtdCarrinho > 0 && view === 'cardapio' && (
        <div className={`bottom-bar animate-slide-up`}>
          <div>
            <span className={styles.bbQty}>{qtdCarrinho} {qtdCarrinho === 1 ? 'item' : 'itens'}</span>
            <span className={styles.bbTotal}>R$ {totalCarrinho.toFixed(2).replace('.', ',')}</span>
          </div>
          <button className="btn btn-primary" onClick={() => setView('carrinho')}>
            VER PEDIDO →
          </button>
        </div>
      )}
    </div>
  );
}
