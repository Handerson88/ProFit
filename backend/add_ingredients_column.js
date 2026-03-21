require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

async function migrate() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    // Add ingredients column to meals table
    await client.query(`
      ALTER TABLE meals 
      ADD COLUMN IF NOT EXISTS ingredients JSONB;
    `);

    await client.query('COMMIT');
    console.log("Migration completed: 'ingredients' column added to 'meals' table.");
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Migration failed:', err);
  } finally {
    client.release();
    pool.end();
  }
}

migrate();
