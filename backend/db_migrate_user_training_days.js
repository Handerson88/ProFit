const { pool } = require('./config/database');

async function migrate() {
  console.log('Adding user_training_days column to users table...');
  
  try {
    // 1. Add column as JSONB to store the array of days
    await pool.query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS user_training_days JSONB DEFAULT '[]'::jsonb;
    `);

    console.log('Migration completed successfully.');
  } catch (err) {
    console.error('Migration failed:', err);
  } finally {
    process.exit(0);
  }
}

migrate();
