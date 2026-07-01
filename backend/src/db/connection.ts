import { Pool } from 'pg';

if (!process.env.DATABASE_URL) {
  console.warn('[db] DATABASE_URL não definida — banco desabilitado');
}

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production'
    ? { rejectUnauthorized: false }
    : false,
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
