const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function run() {
  try {
    const res = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'payments'
    `);
    console.log('Payments Columns:', res.rows.map(r => `${r.column_name} (${r.data_type})`).join(', '));
    
    // Also check coupons table we just created
    const res2 = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'coupons'
    `);
    console.log('Coupons Columns:', res2.rows.map(r => `${r.column_name} (${r.data_type})`).join(', '));
    
    // Check users
    const res3 = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'users'
    `);
    console.log('Users Columns:', res3.rows.map(r => `${r.column_name} (${r.data_type})`).join(', '));
    
    // Check subscriptions
    const res4 = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'subscriptions'
    `);
    console.log('Subscriptions Columns:', res4.rows.map(r => `${r.column_name} (${r.data_type})`).join(', '));
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await pool.end();
  }
}

run();
