process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const db = require('./config/database');

async function run() {
  try {
    console.log('--- MIGRATION: Workout Sessions ---');
    
    // 1. Create Table
    await db.query(`
      CREATE TABLE IF NOT EXISTS workout_sessions (
        id UUID PRIMARY KEY,
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        plan_id UUID,
        status TEXT DEFAULT 'active', -- active, completed, cancelled
        start_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        end_time TIMESTAMP,
        duration INTEGER DEFAULT 0, -- in minutes
        calories INTEGER DEFAULT 0,
        workout_type TEXT DEFAULT 'IA', -- IA, Manual
        workout_day TEXT, -- 'Segunda-feira', etc.
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('Table workout_sessions created.');

    // 2. Add indexes for performance
    await db.query('CREATE INDEX IF NOT EXISTS idx_workout_sessions_user ON workout_sessions(user_id)');
    await db.query('CREATE INDEX IF NOT EXISTS idx_workout_sessions_status ON workout_sessions(status)');
    await db.query('CREATE INDEX IF NOT EXISTS idx_workout_sessions_created ON workout_sessions(created_at)');
    console.log('Indexes created.');

    // Debug: Check current DB and schema
    const dbInfo = await db.query("SELECT current_database(), current_schema()");
    console.log('DB Info:', dbInfo.rows[0]);

    // Debug: Check if workout_progress exists
    const tableCheck = await db.query("SELECT count(*) FROM information_schema.tables WHERE table_name = 'workout_progress'");
    console.log('Workout Progress exists check:', tableCheck.rows[0].count);

    if (parseInt(tableCheck.rows[0].count) === 0) {
        console.log('WARNING: workout_progress table not found. Skipping data migration.');
        var progressRes = { rows: [] };
    } else {
        var progressRes = await db.query(`
          SELECT wp.*, w.type as workout_type
          FROM workout_progress wp
          LEFT JOIN workouts w ON wp.workout_plan_id = w.id
          WHERE wp.id NOT IN (SELECT id FROM workout_sessions)
        `);
    }

    for (const row of progressRes.rows) {
      await db.query(`
        INSERT INTO workout_sessions (id, user_id, plan_id, status, start_time, end_time, workout_type, workout_day, created_at)
        VALUES ($1, $2, $3, 'completed', $4, $4, $5, $6, $4)
        ON CONFLICT (id) DO NOTHING
      `, [
        row.id, row.user_id, row.workout_plan_id, row.completed_at, 
        row.workout_type || 'IA', row.day_of_week
      ]);
    }
    console.log(`Successfully migrated ${progressRes.rows.length} session records.`);

  } catch (err) {
    console.error('Migration Error:', err);
  } finally {
    await db.pool.end();
  }
}

run();
