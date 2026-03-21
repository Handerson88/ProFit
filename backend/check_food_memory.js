require('dotenv').config();
const db = require('./config/database');

async function check() {
  try {
    const res = await db.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'food_memory';
    `);
    console.log('Food Memory Table Columns:');
    res.rows.forEach(col => console.log(`- ${col.column_name}: ${col.data_type}`));
  } catch (err) {
    console.error('Check failed:', err.message);
  } finally {
    process.exit();
  }
}

check();
