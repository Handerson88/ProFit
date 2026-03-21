require('dotenv').config();
const db = require('../config/database');
const { v4: uuidv4 } = require('uuid');

async function migrate() {
  try {
    console.log("Creating user_workout_progress table...");
    await db.query(`
      CREATE TABLE IF NOT EXISTS user_workout_progress (
        id UUID PRIMARY KEY,
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        workout_plan_id UUID REFERENCES workout_plans(id) ON DELETE CASCADE,
        exercise_name TEXT NOT NULL,
        workout_day TEXT NOT NULL,
        completed BOOLEAN DEFAULT true,
        completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log("Table created successfully.");

    console.log("Adding workout_completed column to workout_progress...");
    await db.query(`
      ALTER TABLE workout_progress 
      ADD COLUMN IF NOT EXISTS workout_completed BOOLEAN DEFAULT false;
    `);
    console.log("Migration completed.");
  } catch (err) {
    console.error("Migration failed:", err.message);
  } finally {
    process.exit();
  }
}

migrate();
