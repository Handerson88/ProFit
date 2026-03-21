const { pool } = require('./config/database');

async function runMigrations() {
  console.log('Starting schema migration...');
  
  try {
    // 1. ALTER existing tables safely
    console.log('Adding missing columns to users...');
    await pool.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS gender TEXT;');
    await pool.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS daily_calorie_target INTEGER;');
    await pool.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_photo TEXT;');

    console.log('Adding missing columns to foods...');
    await pool.query('ALTER TABLE foods ADD COLUMN IF NOT EXISTS source TEXT;');

    console.log('Adding missing columns to meals...');
    await pool.query('ALTER TABLE meals ADD COLUMN IF NOT EXISTS food_id UUID REFERENCES foods(id) ON DELETE SET NULL;');
    await pool.query('ALTER TABLE meals ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;');

    // 2. CREATE new tables
    console.log('Creating weight_logs table...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS weight_logs (
          id UUID PRIMARY KEY,
          user_id UUID REFERENCES users(id) ON DELETE CASCADE,
          weight NUMERIC,
          date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log('Creating water_logs table...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS water_logs (
          id UUID PRIMARY KEY,
          user_id UUID REFERENCES users(id) ON DELETE CASCADE,
          glasses INTEGER,
          date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log('Creating steps_logs table...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS steps_logs (
          id UUID PRIMARY KEY,
          user_id UUID REFERENCES users(id) ON DELETE CASCADE,
          steps INTEGER,
          date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log('Creating goals table...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS goals (
          id UUID PRIMARY KEY,
          user_id UUID REFERENCES users(id) ON DELETE CASCADE,
          goal_type TEXT,
          target_weight NUMERIC,
          target_calories INTEGER,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 3. CREATE indexes for performance
    console.log('Creating performance indexes...');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_meals_user_date ON meals(user_id, date);');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_weight_user_date ON weight_logs(user_id, date);');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_water_user_date ON water_logs(user_id, date);');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_steps_user_date ON steps_logs(user_id, date);');

    console.log('Schema migration completed successfully.');
  } catch (err) {
    console.error('Migration failed:', err);
  } finally {
    process.exit(0);
  }
}

runMigrations();
