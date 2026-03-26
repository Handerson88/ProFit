const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

// Robust connection string resolver
const getConnectionString = () => {
  let str = process.env.URL_DO_BANCO_DE_DADOS || process.env.DATABASE_URL || process.env.URL_BANCO_DE_DADOS;
  if (!str) return null;
  
  // Ensure sslmode=require if it's a Supabase/Cloud host
  if ((str.includes('supabase.co') || str.includes('pooler.supabase.com')) && !str.includes('sslmode=')) {
    str += (str.includes('?') ? '&' : '?') + 'sslmode=require';
  }
  
  return str;
};

const connStr = getConnectionString();

if (!connStr) {
  console.error('CRITICAL: No database connection string found in environment variables.');
}

// Optimization for Vercel: Small pool, robust connection
const pool = new Pool({
  connectionString: connStr,
  ssl: connStr?.includes('supabase.co') || connStr?.includes('pooler.supabase.com') || connStr?.includes('localhost') === false
    ? { rejectUnauthorized: false } 
    : false,
  max: 10,                         // Limit connections for serverless
  connectionTimeoutMillis: 15000, 
  query_timeout: 45000,          
  idleTimeoutMillis: 30000,      
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
