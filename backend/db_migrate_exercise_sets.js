const { pool } = require('./config/database');

async function migrate() {
  console.log('Adding completed_sets column to user_workout_progress...');
  
  try {
    await pool.query(`
      ALTER TABLE user_workout_progress 
      ADD COLUMN IF NOT EXISTS completed_sets JSONB DEFAULT '[]';
    `);
    console.log('Migration completed successfully.');
  } catch (err) {
    console.error('Migration failed:', err);
  } finally {
    process.exit(0);
  }
}

migrate();
