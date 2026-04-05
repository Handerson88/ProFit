const { Pool } = require('pg');
require('dotenv').config();
const fs = require('fs');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function run() {
  try {
    const res = await pool.query("SELECT table_schema, table_name FROM information_schema.tables WHERE table_name LIKE '%workout%'");
    const output = res.rows.map(r => `${r.table_schema}.${r.table_name}`).join('\n');
    fs.writeFileSync('workout_tables.txt', output);
    console.log('Workout Related Tables recorded in workout_tables.txt');
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await pool.end();
  }
}

run();
