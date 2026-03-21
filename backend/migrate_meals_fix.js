require('dotenv').config();
const db = require('./config/database');

async function migrate() {
  try {
    console.log('Starting migration: Add nutrition_observation to meals...');
    await db.query('ALTER TABLE meals ADD COLUMN IF NOT EXISTS nutrition_observation TEXT;');
    console.log('Column nutrition_observation added successfully (or already existed).');
    
    // Also check for created_at just in case
    console.log('Checking for created_at column...');
    await db.query('ALTER TABLE meals ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;');
    console.log('Column created_at added successfully (or already existed).');
    
  } catch (err) {
    console.error('Migration failed:', err.message);
  } finally {
    process.exit();
  }
}

migrate();
