const { Pool } = require('pg');
const path = require('path');

const getConnectionString = () => {
  try {
    require('dotenv').config({ path: path.join(__dirname, '../.env') });
  } catch (e) {}

  let str = process.env.DATABASE_URL || process.env.URL_DO_BANCO_DE_DADOS || process.env.URL_BANCO_DE_DADOS;
  if (!str) return null;
  
  // Clean string (remove potential spaces or quotes from Vercel dash)
  str = str.trim().replace(/^['"]|['"]$/g, '');

  if ((str.includes('supabase.co') || str.includes('pooler.supabase.com')) && !str.includes('sslmode=')) {
    str += (str.includes('?') ? '&' : '?') + 'sslmode=require';
  }
  
  return str;
};

const connStr = getConnectionString();

const pool = new Pool({
  connectionString: connStr,
  ssl: { rejectUnauthorized: false }, // Force SSL for Supabase
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

pool.on('error', (err) => {
  console.error('[DB] Erro crítico no Pool:', err.message);
});

module.exports = {
  query: async (text, params) => {
    try {
      return await pool.query(text, params);
    } catch (err) {
      console.error('[DB] Falha na Query:', err.message);
      throw err;
    }
  },
  pool
};
