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
    
    console.log("Ensuring 'meals' table columns...");
    
    // Add ingredients column
    await client.query(`
      ALTER TABLE meals 
      ADD COLUMN IF NOT EXISTS ingredients JSONB DEFAULT '[]'::jsonb;
    `);

    // Add nutrition_observation column
    await client.query(`
      ALTER TABLE meals 
      ADD COLUMN IF NOT EXISTS nutrition_observation TEXT;
    `);

    // Add image_url column
    await client.query(`
      ALTER TABLE meals 
      ADD COLUMN IF NOT EXISTS image_url TEXT;
    `);

    // Add meal_name column
    await client.query(`
      ALTER TABLE meals 
      ADD COLUMN IF NOT EXISTS meal_name TEXT;
    `);

    // Fix protein/carbs/fat to be numeric if they aren't
    await client.query(`
      ALTER TABLE meals 
      ALTER COLUMN protein TYPE NUMERIC USING protein::numeric,
      ALTER COLUMN carbs TYPE NUMERIC USING carbs::numeric,
      ALTER COLUMN fat TYPE NUMERIC USING fat::numeric;
    `);

    await client.query('COMMIT');
    console.log("Migration completed successfully.");
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Migration failed:', err);
    process.exit(1);
  } finally {
    client.release();
    pool.end();
  }
}

migrate();
