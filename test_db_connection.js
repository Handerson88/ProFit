const { Pool } = require('pg');
require('dotenv').config({ path: './backend/.env' });

const connectionString = process.env.URL_DO_BANCO_DE_DADOS || process.env.DATABASE_URL || process.env.URL_BANCO_DE_DADOS;

console.log('Testing connection to:', connectionString ? connectionString.replace(/:[^:@]+@/, ':****@') : 'MISSING');

const pool = new Pool({
  connectionString,
  ssl: { rejectUnauthorized: false },
  connectionTimeoutMillis: 10000
});

async function test() {
  const start = Date.now();
  console.log('Starting connection attempt...');
  try {
    const res = await pool.query('SELECT NOW()');
    console.log('Success! Database time:', res.rows[0].now);
  } catch (err) {
    console.error('Connection failed!');
    console.error('Error Name:', err.name);
    console.error('Error Message:', err.message);
    if (err.stack) console.error('Stack:', err.stack);
  } finally {
    await pool.end();
    console.log(`Test finished in ${Date.now() - start}ms`);
  }
}

test();
