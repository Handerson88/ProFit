const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function migrate() {
  const client = await pool.connect();
  try {
    console.log('Adding title column to workout_plans...');
    await client.query(`
      ALTER TABLE workout_plans 
      ADD COLUMN IF NOT EXISTS title TEXT;
    `);
    console.log('Column added successfully.');
  } catch (err) {
    console.error('Migration failed:', err);
  } finally {
    client.release();
    await pool.end();
  }
}

migrate();
