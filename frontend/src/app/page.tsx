'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from './page.module.css';

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
        <p className={styles.sub}>Informe o número da sua mesa para ver o cardápio e fazer o seu pedido.</p>
      </div>

      <form onSubmit={handleAccess} className={styles.actions}>
        <div className={styles.inputContainer}>
          <label htmlFor="mesa-input" className={styles.label}>NÚMERO DA MESA</label>
          <input
            id="mesa-input"
            type="number"
            inputMode="numeric"
            pattern="[0-9]*"
            min="1"
            max="99"
            placeholder="00"
            className={styles.mesaInput}
            value={mesaNum}
            onChange={(e) => setMesaNum(e.target.value)}
            required
            autoFocus
          />
        </div>

        <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
          VER CARDÁPIO
        </button>
      </form>
    </main>
  );
}
