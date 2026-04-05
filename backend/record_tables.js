const { Pool } = require('pg');
require('dotenv').config();
const fs = require('fs');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function run() {
  try {
    const info = await pool.query("SELECT current_database(), current_schema()");
    const res = await pool.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'");
    const tables = res.rows.map(r => r.table_name).join(', ');
    const output = `DB Info: ${JSON.stringify(info.rows[0])}\nTables: ${tables}`;
    fs.writeFileSync('tables_list.txt', output);
    console.log('Tables and DB Info recorded in tables_list.txt');
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await pool.end();
  }
}

run();
