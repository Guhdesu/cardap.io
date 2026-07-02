import { Pool } from 'pg';

if (!process.env.DATABASE_URL) {
  console.warn('[db] DATABASE_URL não definida — banco desabilitado');
}

const needsSSL = process.env.DATABASE_URL && 
                 !process.env.DATABASE_URL.includes('localhost') && 
                 !process.env.DATABASE_URL.includes('127.0.0.1');

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: needsSSL ? { rejectUnauthorized: false } : false,
});

// Testa a conexão na inicialização
export async function testConnection(): Promise<boolean> {
  if (!process.env.DATABASE_URL) return false;
  try {
    const client = await pool.connect();
    await client.query('SELECT 1');
    client.release();
    console.log('[db] ✅ Conexão com PostgreSQL estabelecida');
    return true;
  } catch (err) {
    console.error('[db] ❌ Falha ao conectar com PostgreSQL:', err);
    return false;
  }
}
