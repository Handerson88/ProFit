require('dotenv').config();
const db = require('./config/database');

async function debug() {
  try {
    const res = await db.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'users'
      ORDER BY ordinal_position;
    `);
    console.log("Users Table Schema:");
    console.table(res.rows);
  } catch (err) {
    console.error("Debug failed:", err);
  } finally {
    process.exit();
  }
}
debug();
