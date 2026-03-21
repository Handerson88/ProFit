const db = require('../config/database');

async function migrate() {
  try {
    console.log('Starting migration...');

    // 1. Add structured_plan column to workout_plans if it doesn't exist
    await db.query(`
      ALTER TABLE workout_plans 
      ADD COLUMN IF NOT EXISTS structured_plan JSONB
    `);
    console.log('Column structured_plan added to workout_plans.');

    // 2. Create workout_sessions table
    await db.query(`
      CREATE TABLE IF NOT EXISTS workout_sessions (
        id UUID PRIMARY KEY,
        user_id UUID NOT NULL,
        workout_plan_id UUID REFERENCES workout_plans(id) ON DELETE CASCADE,
        day_of_week VARCHAR(20) NOT NULL,
        completed BOOLEAN DEFAULT FALSE,
        completed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('Table workout_sessions created.');

    console.log('Migration completed successfully!');
    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  }
}

migrate();
