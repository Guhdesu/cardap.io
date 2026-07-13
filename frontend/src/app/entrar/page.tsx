'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import styles from './page.module.css';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

function EntrarContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const expired = searchParams.get('expired');

  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  // Estados para escolha de comanda
  const [comandasAtivas, setComandasAtivas] = useState<{ id: number; total: number; itens_count: number }[]>([]);
  const [mesaNumero, setMesaNumero] = useState<number | null>(null);
  const [mesaId, setMesaId] = useState<number | null>(null);

  const executarEntradaDirect = async (targetToken: string, acao: 'juntar' | 'nova', targetComandaId?: number) => {
    try {
      let url = `${API}/entrar?token=${targetToken}&comanda_acao=${acao}`;
      if (acao === 'juntar' && targetComandaId) {
        url += `&comanda_id=${targetComandaId}`;
      }

      const res = await fetch(url);
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Não foi possível validar o token do QR Code.');
      }

      const data = await res.json();
      localStorage.setItem('sessao_id', data.sessao_id.toString());
      localStorage.setItem('mesa_id', data.mesa_id.toString());
      localStorage.setItem('mesa_numero', data.mesa_numero.toString());

      router.replace(`/mesa/${data.mesa_id}`);
    } catch (err: any) {
      setLoading(false);
      setErro(err.message || 'Erro ao realizar login na mesa.');
    }
  };

  useEffect(() => {
    if (expired) {
      setLoading(false);
      setErro('Sua sessão expirou ou foi encerrada. Escaneie o QR Code da mesa novamente para acessar.');
      return;
    }

    if (!token) {
      setLoading(false);
      setErro('Token de acesso ausente. Por favor, escaneie o QR Code impresso na sua mesa.');
      return;
    }

    // Busca informações preliminares da mesa e comanda
    fetch(`${API}/entrar/token-info?token=${token}`)
      .then(async (res) => {
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || 'Não foi possível validar a mesa.');
        }
        return res.json();
      })
      .then((data) => {
        setMesaNumero(data.mesa_numero);
        setMesaId(data.mesa_id);

        if (data.comandas && data.comandas.length > 0) {
          // Ordena: comandas com itens primeiro, depois vazias. Secundário: mais recente (ID maior) primeiro
          const sorted = [...data.comandas].sort((a, b) => {
            const hasA = a.itens_count > 0 ? 1 : 0;
            const hasB = b.itens_count > 0 ? 1 : 0;
            if (hasA !== hasB) return hasB - hasA;
            return b.id - a.id;
          });
          setComandasAtivas(sorted);
          setLoading(false);
        } else {
          // Entra abrindo nova comanda automaticamente se não há nenhuma comanda ativa
          executarEntradaDirect(token, 'nova');
        }
      })
      .catch((err) => {
        setLoading(false);
        setErro(err.message || 'Erro de conexão com o servidor.');
      });
  }, [token, expired]);

  const confirmarEntrada = (acao: 'juntar' | 'nova', targetComandaId?: number) => {
    if (!token) return;
    setLoading(true);
    executarEntradaDirect(token, acao, targetComandaId);
  };

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner}></div>
        <p className={styles.loadingText}>Validando sua mesa...</p>
        <span className={styles.loadingSub}>Aguarde um instante</span>
      </div>
    );
  }

  if (erro) {
    return (
      <div className={styles.errorContainer}>
        <div className={styles.errorCard}>
          <div className={styles.errorIcon}>⚠️</div>
          <h2 className={styles.errorTitle}>Ops! Acesso inválido</h2>
          <p className={styles.errorText}>{erro}</p>
          <div className={styles.instructions}>
            <h3>Como acessar o cardápio:</h3>
            <ul>
              <li>Aponte a câmera do seu celular para o QR Code impresso no cartão de mesa.</li>
              <li>Aguarde a leitura automática e clique no link exibido.</li>
              <li>Em caso de problemas, solicite ajuda a um de nossos garçons.</li>
            </ul>
          </div>
          <button
            className={`btn btn-primary ${styles.errorBtn}`}
            onClick={() => router.push('/')}
          >
            VOLTAR PARA A PÁGINA INICIAL
          </button>
        </div>
      </div>
    );
  }

  if (comandasAtivas.length > 0) {
    return (
      <div className={styles.choiceContainer}>
        <div className={styles.choiceHeader}>
          <h1 className={styles.choiceTitle}>Mesa {String(mesaNumero).padStart(2, '0')}</h1>
          <p className={styles.choiceSubtitle}>
            Já existem comandas nesta mesa. Como deseja pedir?
          </p>
        </div>

        <div className={styles.choiceCards}>
          {/* Card principal no topo: Criar minha comanda */}
          <div className={styles.individualCard} onClick={() => confirmarEntrada('nova')}>
            <div className={styles.cardMainInfo}>
              <h2 className={styles.cardHeaderTitle}>👤 Criar minha comanda</h2>
              <p className={styles.cardHeaderSubtitle}>Pedidos e pagamento separados.</p>
            </div>
            <span className={styles.actionChevron}>›</span>
          </div>

          <div className={styles.dividerRow}>OU</div>

          {/* Seção inferior: Comandas compartilhadas */}
          <div className={styles.sharedSection}>
            <div className={styles.sharedSectionHeader}>
              <h3 className={styles.sharedSectionTitle}>Comandas Compartilhadas</h3>
              <p className={styles.sharedSectionDesc}>Peça junto e divida a conta com a mesa.</p>
            </div>
            <div className={styles.comandaList}>
              {comandasAtivas.map((comanda) => (
                <div
                  key={comanda.id}
                  className={styles.comandaRow}
                  onClick={() => confirmarEntrada('juntar', comanda.id)}
                >
                  <div>
                    <h4 className={styles.comandaRowTitle}>👥 Comanda #{comanda.id}</h4>
                    <p className={`${styles.comandaRowMeta} ${comanda.itens_count > 0 ? styles.comandaRowMetaActive : ''}`}>
                      {comanda.itens_count > 0 ? (
                        `${comanda.itens_count} ${comanda.itens_count === 1 ? 'item' : 'itens'} · R$ ${comanda.total.toFixed(2).replace('.', ',')}`
                      ) : (
                        'Sem pedidos'
                      )}
                    </p>
                  </div>
                  <span className={styles.actionChevron}>›</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}

export default function EntrarPage() {
  return (
    <div className={styles.page}>
      <Suspense fallback={
        <div className={styles.loadingContainer}>
          <div className={styles.spinner}></div>
          <p className={styles.loadingText}>Carregando...</p>
        </div>
      }>
        <EntrarContent />
      </Suspense>
    </div>
  );
}
