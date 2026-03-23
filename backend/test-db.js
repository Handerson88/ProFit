const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  connectionTimeoutMillis: 5000
});

async function run() {
  console.log('Testing connection to:', process.env.DATABASE_URL ? 'URL IS SET' : 'URL IS MISSING');
  try {
    const start = Date.now();
    const res = await pool.query('SELECT NOW()');
    console.log('SUCCESS:', res.rows[0]);
    
    const tables = ['users', 'notifications', 'meals', 'daily_logs', 'workout_plans', 'discounts'];
    for (const table of tables) {
      try {
        const tStart = Date.now();
        const tRes = await pool.query(`SELECT COUNT(*) FROM ${table}`);
        console.log(`Table ${table}: ${tRes.rows[0].count} rows (${Date.now() - tStart}ms)`);
      } catch (e) {
        console.error(`Table ${table}: MISSING or ERROR - ${e.message}`);
      }
    }
    
    console.log('Total time taken:', (Date.now() - start), 'ms');
  } catch (err) {
    console.error('ERROR:', err.message);
  } finally {
    console.log('Exiting...');
    await pool.end();
    process.exit();
  }
}

run();
