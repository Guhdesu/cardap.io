'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from './page.module.css';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

export default function Home() {
  const [mesaNum, setMesaNum] = useState('');
  const router = useRouter();

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
        <p className={styles.demoSub}>Escaneie o QR Code abaixo com seu celular para pedir na Mesa 01:</p>
        
        <div className={styles.qrContainer}>
          <img
            src={`${API}/qrcode/1`}
            alt="QR Code Mesa 1"
            className={styles.qrImage}
          />
          <div className={`${styles.qrCorner} ${styles.topLeft}`}></div>
          <div className={`${styles.qrCorner} ${styles.topRight}`}></div>
          <div className={`${styles.qrCorner} ${styles.bottomLeft}`}></div>
          <div className={`${styles.qrCorner} ${styles.bottomRight}`}></div>
        </div>

        <button 
          onClick={() => router.push('/mesa/1')} 
          className="btn btn-primary"
          style={{ width: '100%', justifyContent: 'center' }}
        >
          PEDIR NA MESA 01
        </button>

        <button 
          onClick={() => {
            const randomNum = Math.floor(Math.random() * 8) + 1;
            router.push(`/mesa/${randomNum}`);
          }} 
          className="btn btn-outline"
          style={{ width: '100%', justifyContent: 'center', borderColor: 'var(--color-ink)' }}
        >
          IR PARA UMA MESA ALEATÓRIA
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
            max="8"
            placeholder="Número da mesa (ex: 2)"
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
