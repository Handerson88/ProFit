const { pool } = require('./config/database');

async function migrateCreatedAt() {
  console.log('Adding created_at column to users...');
  try {
    // 1. Add column if not exists
    await pool.query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;
    `);
    
    // 2. Ensure existing users have a timestamp
    await pool.query(`
      UPDATE users SET created_at = CURRENT_TIMESTAMP WHERE created_at IS NULL;
    `);

    console.log('Migration completed successfully.');
  } catch (err) {
    console.error('Migration failed:', err);
  } finally {
    process.exit(0);
  }
}

migrateCreatedAt();
