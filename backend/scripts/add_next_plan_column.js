const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function migrate() {
  const client = await pool.connect();
  try {
    console.log('Adding next_plan_available_at column to workout_plans...');
    await client.query(`
      ALTER TABLE workout_plans 
      ADD COLUMN IF NOT EXISTS next_plan_available_at TIMESTAMP WITH TIME ZONE;
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
