require('dotenv').config();
const db = require('./config/database');

async function migrate() {
  try {
    console.log('Starting migration: Add ingredients and observation to food_memory...');
    
    // Check if food_memory exists first (it should)
    await db.query('ALTER TABLE food_memory ADD COLUMN IF NOT EXISTS ingredients JSONB;');
    console.log('Column ingredients added successfully.');
    
    await db.query('ALTER TABLE food_memory ADD COLUMN IF NOT EXISTS nutrition_observation TEXT;');
    console.log('Column nutrition_observation added successfully.');
    
    console.log('Migration completed successfully.');
  } catch (err) {
    console.error('Migration failed:', err.message);
  } finally {
    process.exit();
  }
}

migrate();
