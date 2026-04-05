const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function run() {
  try {
    console.log('Updating payments table...');
    await pool.query(`
      ALTER TABLE payments 
      ADD COLUMN IF NOT EXISTS coupon_id UUID REFERENCES coupons(id) ON DELETE SET NULL;
    `);
    console.log('Update successful.');
  } catch (err) {
    console.error('Update failed:', err);
  } finally {
    await pool.end();
  }
}

run();
