const db = require('../config/database');

async function fixSchema() {
  try {
    console.log('Fixing workout_plans schema...');
    
    console.log('Ensuring workout_plans table exists...');
    await db.query(`
      CREATE TABLE IF NOT EXISTS workout_plans (
        id UUID PRIMARY KEY,
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        goal TEXT,
        level TEXT,
        days_per_week TEXT,
        location TEXT,
        duration TEXT,
        plan_text TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('Table workout_plans is ready.');

    // Check for index
    await db.query('CREATE INDEX IF NOT EXISTS idx_workout_plans_user ON workout_plans(user_id)');
    console.log('Index verified/created.');

    console.log('Schema fix complete!');
    process.exit(0);
  } catch (err) {
    console.error('Schema fix error:', err);
    process.exit(1);
  }
}

fixSchema();
