process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const db = require('./config/database');
const { v4: uuidv4 } = require('uuid');

async function run() {
  try {
    console.log('--- REPAIR: Missing Workout Tables ---');
    
    // 1. workout_progress
    await db.query(`
      CREATE TABLE IF NOT EXISTS workout_progress (
        id UUID PRIMARY KEY,
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        workout_plan_id UUID REFERENCES workout_plans(id) ON DELETE CASCADE,
        day_of_week TEXT,
        completed BOOLEAN DEFAULT TRUE,
        completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('Table workout_progress created/verified.');

    // 2. user_workout_progress
    await db.query(`
      CREATE TABLE IF NOT EXISTS user_workout_progress (
        id UUID PRIMARY KEY,
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        workout_plan_id UUID REFERENCES workout_plans(id) ON DELETE CASCADE,
        exercise_name TEXT,
        workout_day TEXT,
        completed BOOLEAN DEFAULT FALSE,
        completed_sets JSONB DEFAULT '[]',
        completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('Table user_workout_progress created/verified.');

    // 3. workout_sessions (The core of my new refactor)
    await db.query(`
      CREATE TABLE IF NOT EXISTS workout_sessions (
        id UUID PRIMARY KEY,
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        plan_id UUID REFERENCES workout_plans(id) ON DELETE CASCADE,
        status TEXT DEFAULT 'active', -- active, completed, cancelled
        start_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        end_time TIMESTAMP,
        duration INTEGER DEFAULT 0,
        calories INTEGER DEFAULT 0,
        workout_type TEXT DEFAULT 'IA',
        workout_day TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('Table workout_sessions created/verified.');

  } catch (err) {
    console.error('Repair Error:', err);
  } finally {
    process.exit();
  }
}

run();
