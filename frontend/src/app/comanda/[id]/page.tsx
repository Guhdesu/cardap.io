'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ItemCardapio, ItemCarrinho, Comanda, PedidoItem, StatusPedido } from '@/lib/types';
import { getSocket } from '@/lib/socket';
import styles from './comanda.module.css';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

const STATUS_LABEL: Record<StatusPedido, string> = {
  pendente: 'Pendente',
  preparando: '🔥 Preparando',
  pronto: '✅ Pronto!',
  entregue: 'Entregue',
};

export default function ComandaPage() {
  const params = useParams();
  const router = useRouter();
  const comandaId = Number(params.id);

  const [comanda, setComanda] = useState<Comanda | null>(null);
  const [carrinho, setCarrinho] = useState<ItemCarrinho[]>([]);
  const [pedidos, setPedidos] = useState<PedidoItem[]>([]);
  const [observacoes, setObservacoes] = useState<Record<number, string>>({});
  const [activeTab, setActiveTab] = useState<'carrinho' | 'pedidos'>('carrinho');
  const [loading, setLoading] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Estados do checkout/fechamento
  const [fechamentoSolicitado, setFechamentoSolicitado] = useState(false);
  const [encerrada, setEncerrada] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // Inicialização
  useEffect(() => {
    const init = async () => {
      try {
        const sessaoId = localStorage.getItem('sessao_id');
        const savedMesaId = localStorage.getItem('mesa_id');

        if (!sessaoId || !savedMesaId) {
          router.replace('/entrar?expired=true');
          return;
        }

        const comandaRes = await fetch(`${API}/comanda/${comandaId}`, {
          headers: { 'x-sessao-id': sessaoId },
        });

        if (!comandaRes.ok) {
          if (comandaRes.status === 401 || comandaRes.status === 403) {
            localStorage.removeItem('sessao_id');
            localStorage.removeItem('mesa_id');
            router.replace('/entrar?expired=true');
            return;
          }
          throw new Error('Comanda não encontrada ou encerrada');
        }
        const comandaData = await comandaRes.json();
        setComanda(comandaData);
        setPedidos(comandaData.itens || []);

        if (comandaData.status === 'fechamento_solicitado') {
          setFechamentoSolicitado(true);
        } else if (comandaData.status === 'encerrada') {
          setEncerrada(true);
        }

        // Sincroniza localmente
        localStorage.setItem('comanda_id', String(comandaId));
        localStorage.setItem('mesa_id', String(comandaData.mesa_id));

        // Carrega carrinho específico dessa comanda do localStorage
        const savedCarrinho = localStorage.getItem(`carrinho_comanda_${comandaId}`);
        if (savedCarrinho) {
          try {
            setCarrinho(JSON.parse(savedCarrinho));
          } catch (e) {
            console.error('[localStorage] Erro ao carregar carrinho:', e);
          }
        }

        // Socket.io room join
        const socket = getSocket();
        socket.connect();
        socket.emit('join_mesa', { mesaId: comandaData.mesa_id });

        socket.on('status_atualizado', (data: { pedido_item_id: number; status: StatusPedido; item_nome: string }) => {
          setPedidos((prev) =>
            prev.map((p) => (p.id === data.pedido_item_id ? { ...p, status: data.status } : p))
          );
        });

        socket.on('comanda_encerrada', (data: { comanda_id: number }) => {
          if (Number(data.comanda_id) === comandaId) {
            localStorage.removeItem('sessao_id');
            localStorage.removeItem('mesa_id');
            localStorage.removeItem('comanda_id');
            localStorage.removeItem(`carrinho_comanda_${comandaId}`);
            setEncerrada(true);
          }
        });

        socket.on('fechamento_solicitado', (data: { comanda_id: number }) => {
          if (Number(data.comanda_id) === comandaId) {
            setFechamentoSolicitado(true);
          }
        });
      } catch (err) {
        console.error('[init] Falha na inicialização da comanda:', err);
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    };

    init();

    return () => {
      getSocket().disconnect();
    };
  }, [comandaId, router]);

  // Persiste carrinho local
  useEffect(() => {
    if (!loading && comandaId) {
      localStorage.setItem(`carrinho_comanda_${comandaId}`, JSON.stringify(carrinho));
    }
  }, [carrinho, comandaId, loading]);

  const totalCarrinho = carrinho.reduce((sum, i) => sum + i.item.preco * i.quantidade, 0);
  const totalPedidos = pedidos.reduce((sum, p) => sum + (p.preco ?? 0) * p.quantidade, 0);
  const totalConsolidado = totalPedidos + totalCarrinho;

  const adicionarAoCarrinho = (item: ItemCardapio) => {
    if (fechamentoSolicitado) return;
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
      localStorage.removeItem(`carrinho_comanda_${comandaId}`);
      setActiveTab('pedidos');
    } catch (err) {
      alert((err as Error).message);
    } finally {
      setEnviando(false);
    }
  };

  const confirmarFechamento = async () => {
    setShowConfirmModal(false);
    try {
      const sessaoId = localStorage.getItem('sessao_id') || '';
      const res = await fetch(`${API}/comanda/${comandaId}/solicitar-fechamento`, {
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
      setActiveTab('pedidos');
    } catch (err: any) {
      alert(err.message || 'Erro ao fechar conta.');
    }
  };

  // Se a comanda foi paga / encerrada
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
        <span>Carregando sua comanda...</span>
      </div>
    );
  }

  if (error || !comanda) {
    return (
      <div className={styles.errorContainer}>
        <div className={styles.errorIcon}>⚠️</div>
        <h2 className={styles.errorTitle}>Ops! Algo deu errado</h2>
        <p className={styles.errorMessage}>{error || 'Comanda inválida'}</p>
        <button
          className="btn btn-primary"
          onClick={() => router.push('/')}
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
        <div className={styles.mesaBadge}>MESA {String(comanda.mesa_id).padStart(2, '0')}</div>
      </header>

      {/* Voltar ao Cardápio */}
      <div style={{ padding: '0 16px' }}>
        <Link href={`/mesa/${comanda.mesa_id}`} className={styles.voltarLink}>
          ← VOLTAR AO CARDÁPIO
        </Link>
      </div>

      {/* Nav tabs */}
      <nav className={styles.nav}>
        <button
          className={`${styles.navTab} ${activeTab === 'carrinho' ? styles.navTabActive : ''}`}
          onClick={() => setActiveTab('carrinho')}
        >
          CARRINHO {carrinho.length > 0 && <span className={styles.navBadge}>{carrinho.length}</span>}
        </button>
        <button
          className={`${styles.navTab} ${activeTab === 'pedidos' ? styles.navTabActive : ''}`}
          onClick={() => setActiveTab('pedidos')}
        >
          HISTÓRICO {pedidos.length > 0 && <span className={styles.navBadge}>{pedidos.length}</span>}
        </button>
      </nav>

      {/* Content */}
      <div className={styles.content}>
        {activeTab === 'carrinho' && (
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
                <Link href={`/mesa/${comanda.mesa_id}`} className="btn btn-outline">
                  Adicionar Itens
                </Link>
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

        {activeTab === 'pedidos' && (
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

            {/* Resumo Consolidado e Fechamento */}
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

      {/* Confirm Close Modal */}
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
