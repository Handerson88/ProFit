const db = require('./config/database');
require('dotenv').config();

async function migrate() {
  try {
    console.log('Starting migration...');
    await db.query('ALTER TABLE meals ADD COLUMN IF NOT EXISTS meal_name TEXT;');
    await db.query('ALTER TABLE meals ADD COLUMN IF NOT EXISTS image_url TEXT;');
    console.log('Migration successful: meal_name and image_url columns added to meals table.');
    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  }
}

migrate();
