'use client';

import { useEffect, useState } from 'react';
import styles from './page.module.css';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

interface MesaQR {
  mesa_id: number;
  mesa_numero: number;
  qrcode_url: string;
  mesa_url: string;
}

export default function QRCodePage() {
  const [mesas, setMesas] = useState<MesaQR[]>([]);

  useEffect(() => {
    fetch(`${API}/qrcode`).then((r) => r.json()).then(setMesas);
  }, []);

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <span className={styles.logo}>cardap<span className={styles.dot}>.</span>io</span>
          <h1 className={styles.title}>QR CODES</h1>
          <p className={styles.sub}>Imprima e posicione em cada mesa.</p>
        </div>
        <button className="btn btn-outline" onClick={() => window.print()}>
          IMPRIMIR TODOS
        </button>
      </header>

      <main className={styles.main}>
        <div className={styles.grid}>
          {mesas.map((mesa) => (
            <div key={mesa.mesa_id} className={styles.card}>
              <div className={styles.mesaLabel}>MESA {String(mesa.mesa_numero).padStart(2, '0')}</div>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={mesa.qrcode_url}
                alt={`QR Code Mesa ${mesa.mesa_numero}`}
                className={styles.qr}
              />
              <a href={mesa.mesa_url} className={styles.url} target="_blank" rel="noreferrer">
                {mesa.mesa_url}
              </a>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
