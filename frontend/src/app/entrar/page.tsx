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

    // Chama o backend para validar o token e criar a sessão
    fetch(`${API}/entrar?token=${token}`)
      .then(async (res) => {
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || 'Não foi possível validar o token do QR Code.');
        }
        return res.json();
      })
      .then((data) => {
        // Salva dados no localStorage
        localStorage.setItem('sessao_id', data.sessao_id.toString());
        localStorage.setItem('mesa_id', data.mesa_id.toString());
        localStorage.setItem('mesa_numero', data.mesa_numero.toString());

        // Redireciona para o cardápio da mesa
        router.replace(`/mesa/${data.mesa_id}`);
      })
      .catch((err) => {
        setLoading(false);
        setErro(err.message || 'Erro de conexão com o servidor.');
      });
  }, [token, expired, router]);

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
