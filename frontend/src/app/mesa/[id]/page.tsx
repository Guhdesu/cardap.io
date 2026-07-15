'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ItemCardapio, ItemCarrinho, Comanda } from '@/lib/types';
import { getSocket } from '@/lib/socket';
import styles from './page.module.css';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

const CATEGORIAS = ['Todos', 'Burgers', 'Acompanhamentos', 'Bebidas', 'Sobremesas'];

export default function MesaPage() {
  const params = useParams();
  const router = useRouter();
  const mesaId = Number(params.id);

  const [comanda, setComanda] = useState<Comanda | null>(null);
  const [cardapio, setCardapio] = useState<ItemCardapio[]>([]);
  const [categoria, setCategoria] = useState('Todos');
  const [carrinho, setCarrinho] = useState<ItemCarrinho[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Inicialização
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

        setComanda(mesaData.comanda);
        setCardapio(cardapioData);

        // Persiste as informações do contexto de sessão
        localStorage.setItem('mesa_id', String(mesaId));
        if (mesaData.comanda?.id) {
          const comandaId = mesaData.comanda.id;
          localStorage.setItem('comanda_id', String(comandaId));

          // Restaurar carrinho do localStorage vinculado a esta comanda específica
          const savedCarrinho = localStorage.getItem(`carrinho_comanda_${comandaId}`);
          if (savedCarrinho) {
            try {
              setCarrinho(JSON.parse(savedCarrinho));
            } catch (e) {
              console.error('[localStorage] Erro ao carregar carrinho:', e);
            }
          }
        }
      } catch (err) {
        console.error('[init] Falha na inicialização:', err);
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    };

    init();
  }, [mesaId, router]);

  // Socket.io reativo para atualização do cardápio em tempo real
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

    return () => {
      socket.off('cardapio_atualizado');
      socket.disconnect();
    };
  }, [mesaId]);

  // Persiste o carrinho no localStorage sempre que mudar
  useEffect(() => {
    if (!loading && comanda?.id) {
      localStorage.setItem(`carrinho_comanda_${comanda.id}`, JSON.stringify(carrinho));
    }
  }, [carrinho, comanda, loading]);

  const itensFiltrados = categoria === 'Todos'
    ? cardapio
    : cardapio.filter((i) => i.categoria === categoria);

  const totalCarrinho = carrinho.reduce((sum, i) => sum + i.item.preco * i.quantidade, 0);
  const qtdCarrinho = carrinho.reduce((sum, i) => sum + i.quantidade, 0);

  const adicionarAoCarrinho = (item: ItemCardapio) => {
    if (!item.disponivel) return;
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

        {/* Espaço para o bottom bar */}
        <div style={{ height: 100 }} />
      </div>

      {/* Barra inferior fixa — navegação para Minha Comanda */}
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
            onClick={() => router.push(`/comanda/${comanda.id}`)}
          >
            VER COMANDA →
          </button>
        </div>
      )}
    </div>
  );
}
