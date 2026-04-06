const { Pool } = require('pg');
const path = require('path');

const getConnectionString = () => {
  try {
    require('dotenv').config({ path: path.join(__dirname, '../.env') });
  } catch (e) {}
  let str = process.env.DATABASE_URL || process.env.URL_DO_BANCO_DE_DADOS || process.env.URL_BANCO_DE_DADOS;
  if (!str) return null;
  str = str.trim().replace(/^['"]|['"]$/g, '');
  if ((str.includes('supabase.co') || str.includes('pooler.supabase.com')) && !str.includes('sslmode=')) {
    str += (str.includes('?') ? '&' : '?') + 'sslmode=require';
  }
  return str;
};

// Lazy pool creation to prevent early crash
let pool = null;
const getPool = () => {
    if (pool) return pool;
    const connStr = getConnectionString();
    if (!connStr) {
        console.error('[DB] FATAL: Nenhuma string de conexão encontrada.');
        return null;
    }
    pool = new Pool({
        connectionString: connStr,
        ssl: { rejectUnauthorized: false },
        max: 10,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 10000,
    });
    pool.on('error', (err) => console.error('[DB] Pool Error:', err.message));
    return pool;
};

module.exports = {
  query: async (text, params) => {
    const p = getPool();
    if (!p) throw new Error('Criação do pool de banco de dados falhou (DATABASE_URL pode estar ausente)');
    try {
      return await p.query(text, params);
    } catch (err) {
      console.error('[DB] Query Error:', err.message);
      throw err;
    }
  },
  getPool
};
