/**
 * Script de migração — aplica o schema.sql no banco.
 * Uso: npm run migrate
 */
import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { pool } from './connection';

async function migrate() {
  const schemaPath = path.join(__dirname, 'schema.sql');
  const sql = fs.readFileSync(schemaPath, 'utf-8');

  console.log('[migrate] Aplicando schema.sql...');
  const client = await pool.connect();
  try {
    await client.query(sql);
    console.log('[migrate] ✅ Schema aplicado com sucesso.');
  } finally {
    client.release();
    await pool.end();
  }
}

migrate().catch((err) => {
  console.error('[migrate] ❌ Erro:', err);
  process.exit(1);
});
