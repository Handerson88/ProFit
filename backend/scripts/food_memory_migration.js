const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function migrate() {
  const client = await pool.connect();
  try {
    console.log('Starting Food Memory migration...');

    // Create food_memory table
    await client.query(`
      CREATE TABLE IF NOT EXISTS food_memory (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        image_hash TEXT UNIQUE NOT NULL,
        food_name TEXT NOT NULL,
        calories INTEGER NOT NULL,
        protein FLOAT NOT NULL,
        carbs FLOAT NOT NULL,
        fat FLOAT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('Table food_memory created or already exists.');

    // Add food_memory_id to meals table if it doesn't exist
    await client.query(`
      ALTER TABLE meals ADD COLUMN IF NOT EXISTS food_memory_id UUID REFERENCES food_memory(id);
    `);
    console.log('Meals table updated with food_memory_id.');

    console.log('Migration completed successfully.');
  } catch (err) {
    console.error('Migration failed:', err);
  } finally {
    client.release();
    await pool.end();
  }
}

migrate();
