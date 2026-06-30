import Link from 'next/link';
import styles from './page.module.css';

export default function Home() {
  return (
    <main className={styles.main}>
      <div className={styles.hero}>
        <span className={styles.logo}>cardap<span className={styles.dot}>.</span>io</span>
        <h1 className={styles.headline}>PEÇA NA<br />MESA.</h1>
        <p className={styles.sub}>Escaneie o QR Code da sua mesa ou acesse diretamente.</p>
      </div>

      <div className={styles.actions}>
        <Link href="/mesa/1" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
          Demo — Mesa 1
        </Link>
        <Link href="/staff" className="btn btn-outline" style={{ width: '100%', justifyContent: 'center' }}>
          Painel do Staff
        </Link>
        <Link href="/qrcode" className="btn btn-ghost" style={{ width: '100%', justifyContent: 'center', fontSize: '0.85rem' }}>
          Ver QR Codes das Mesas →
        </Link>
      </div>
    </main>
  );
}
