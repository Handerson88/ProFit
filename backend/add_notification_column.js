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
    
    // Add notifications_enabled column if it doesn't exist
    await client.query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS notifications_enabled BOOLEAN DEFAULT FALSE;
    `);
    
    // Also ensure initial state is syncable (handle nulls if any)
    await client.query(`
      UPDATE users SET notifications_enabled = FALSE WHERE notifications_enabled IS NULL;
    `);

    await client.query('COMMIT');
    console.log("Migration completed: 'notifications_enabled' column added to 'users' table.");
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Migration failed:', err);
  } finally {
    client.release();
    pool.end();
  }
}

migrate();
