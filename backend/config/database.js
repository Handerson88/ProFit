const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const connectionString = process.env.DATABASE_URL || process.env.URL_BANCO_DE_DADOS;

if (!connectionString) {
  console.error('CRITICAL: DATABASE_URL is not defined in environment variables.');
}

// Optimization for Vercel: Use a pool but keep connections alive
const pool = new Pool({
  connectionString,
  ssl: connectionString?.includes('supabase.co') || connectionString?.includes('pooler.supabase.com') 
    ? { rejectUnauthorized: false } 
    : false,
  connectionTimeoutMillis: 10000,
  query_timeout: 30000,          // 30s timeout for queries
  idleTimeoutMillis: 30000,      // 30s before closing idle connections
});

pool.on('connect', () => {
  console.log('Connected to Supabase PostgreSQL successfully.');
});

pool.on('error', (err) => {
  console.error('Database connection failed. Check Supabase DATABASE_URL.', err);
});

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool
};
