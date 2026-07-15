'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import styles from './login.module.css';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

export default function StaffLoginPage() {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErro('');
    setCarregando(true);

    try {
      const res = await fetch(`${API}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, senha }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErro(data.error ?? 'Erro ao realizar login.');
        return;
      }

      // Armazena token e dados do usuário no localStorage
      localStorage.setItem('staff_token', data.token);
      localStorage.setItem('staff_usuario', JSON.stringify(data.usuario));

      // Sincroniza o token no cookie imediatamente para que o proxy permita o acesso
      document.cookie = `staff_token=${data.token}; path=/; samesite=lax; max-age=${8 * 60 * 60}`;

      router.replace('/staff');
    } catch {
      setErro('Falha na conexão com o servidor.');
    } finally {
      setCarregando(false);
    }
  };

  return (
    <main className={styles.page}>
      <div className={styles.card}>
        <div className={styles.header}>
          <span className={styles.logo}>
            cardap<span className={styles.dot}>.</span>io
          </span>
          <h1 className={styles.title}>ACESSO STAFF</h1>
          <p className={styles.sub}>Painel de operação do restaurante</p>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.field}>
            <label htmlFor="email" className={styles.label}>E-MAIL</label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              className={styles.input}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@cardap.io"
            />
          </div>

          <div className={styles.field}>
            <label htmlFor="senha" className={styles.label}>SENHA</label>
            <input
              id="senha"
              type="password"
              autoComplete="current-password"
              required
              className={styles.input}
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              placeholder="••••••••"
            />
          </div>

          {erro && (
            <div className={styles.erro} role="alert">
              {erro}
            </div>
          )}

          <button
            type="submit"
            className={`btn btn-primary ${styles.btnSubmit}`}
            disabled={carregando}
          >
            {carregando ? 'ENTRANDO...' : 'ENTRAR →'}
          </button>
        </form>
      </div>
    </main>
  );
}
