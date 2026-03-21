const { pool } = require('./config/database');
const { v4: uuidv4 } = require('uuid');

async function migrate() {
  console.log('Starting Scanned Dishes Migration...');
  
  try {
    // 1. Create scanned_dishes table
    console.log('Creating scanned_dishes table...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS scanned_dishes (
        id UUID PRIMARY KEY,
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        dish_name TEXT NOT NULL,
        image_url TEXT,
        calories INTEGER,
        protein NUMERIC,
        carbs NUMERIC,
        fat NUMERIC,
        scan_source TEXT DEFAULT 'camera',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 2. Create index for performance
    console.log('Creating index on user_id and created_at...');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_scanned_dishes_user_date ON scanned_dishes(user_id, created_at);');

    console.log('Scanned Dishes Migration completed successfully.');
  } catch (err) {
    console.error('Migration failed:', err);
  } finally {
    process.exit(0);
  }
}

migrate();
