'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import styles from './page.module.css';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

export default function Home() {
  const [mesaEscolhida, setMesaEscolhida] = useState<number>(1);
  const [mesaNum, setMesaNum] = useState('');
  const router = useRouter();

  // Escolhe uma mesa aleatória ao carregar para evitar hydration mismatch
  useEffect(() => {
    setMesaEscolhida(Math.floor(Math.random() * 20) + 1);
  }, []);

  const handleRandomize = () => {
    let nextMesa;
    do {
      nextMesa = Math.floor(Math.random() * 20) + 1;
    } while (nextMesa === mesaEscolhida);
    setMesaEscolhida(nextMesa);
  };

  const handleAccess = (e: React.FormEvent) => {
    e.preventDefault();
    const num = parseInt(mesaNum);
    if (!isNaN(num) && num > 0) {
      router.push(`/mesa/${num}`);
    }
  };

  return (
    <main className={styles.main}>
      <div className={styles.hero}>
        <span className={styles.logo}>cardap<span className={styles.dot}>.</span>io</span>
        <h1 className={styles.headline}>PEÇA NA<br />MESA.</h1>
        <p className={styles.sub}>Acesse o cardápio e faça seu pedido direto para a cozinha.</p>
      </div>

      <div className={styles.demoSection}>
        <h2 className={styles.sectionTitle}>ACESSAR MESA</h2>
        <p className={styles.demoSub}>
          Escaneie o QR Code abaixo com seu celular para pedir na Mesa {mesaEscolhida.toString().padStart(2, '0')}:
        </p>
        
        <div className={styles.qrContainer}>
          <img
            src={`${API}/qrcode/${mesaEscolhida}`}
            alt={`QR Code Mesa ${mesaEscolhida}`}
            className={styles.qrImage}
            key={mesaEscolhida} // Força recarregar a imagem do QR Code ao mudar a mesa
          />
          <div className={`${styles.qrCorner} ${styles.topLeft}`}></div>
          <div className={`${styles.qrCorner} ${styles.topRight}`}></div>
          <div className={`${styles.qrCorner} ${styles.bottomLeft}`}></div>
          <div className={`${styles.qrCorner} ${styles.bottomRight}`}></div>
        </div>

        <button 
          onClick={() => router.push(`/mesa/${mesaEscolhida}`)} 
          className="btn btn-primary"
          style={{ width: '100%', justifyContent: 'center' }}
        >
          PEDIR NA MESA {mesaEscolhida.toString().padStart(2, '0')}
        </button>

        <button 
          onClick={handleRandomize} 
          className="btn btn-outline"
          style={{ width: '100%', justifyContent: 'center', borderColor: 'var(--color-ink)' }}
        >
          GERAR OUTRA MESA ALEATÓRIA
        </button>
      </div>

      <div className={styles.divider}>
        <span>OU INFORME O NÚMERO DA MESA</span>
      </div>

      <form onSubmit={handleAccess} className={styles.actions}>
        <div className={styles.inputContainer}>
          <input
            id="mesa-input"
            type="number"
            inputMode="numeric"
            pattern="[0-9]*"
            min="1"
            max="20"
            placeholder="Número da mesa (1 a 20)"
            className={styles.mesaInput}
            value={mesaNum}
            onChange={(e) => setMesaNum(e.target.value)}
            required
          />
        </div>

        <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
          VER CARDÁPIO
        </button>
      </form>
    </main>
  );
}
