const { Pool } = require('pg');
require('dotenv').config();

const connectionString = process.env.DATABASE_URL || process.env.URL_BANCO_DE_DADOS;

const pool = new Pool({
  connectionString,
  ssl: {
    rejectUnauthorized: false
  }
});

pool.on('connect', () => {
  console.log('Connected to Neon PostgreSQL successfully.');
});

pool.on('error', (err) => {
  console.error('Database connection failed. Check Neon DATABASE_URL.', err);
});

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool
};
