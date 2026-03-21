const { pool } = require('./config/database');

async function migrate() {
  console.log('Adding plan_start_date and plan_renewal_date columns to workout_plans...');
  
  try {
    // 1. Add columns
    await pool.query(`
      ALTER TABLE workout_plans 
      ADD COLUMN IF NOT EXISTS plan_start_date TIMESTAMP WITH TIME ZONE,
      ADD COLUMN IF NOT EXISTS plan_renewal_date TIMESTAMP WITH TIME ZONE;
    `);

    // 2. Backfill existing rows
    console.log('Backfilling existing plan dates...');
    await pool.query(`
      UPDATE workout_plans 
      SET 
        plan_start_date = created_at,
        plan_renewal_date = created_at + INTERVAL '30 days'
      WHERE plan_start_date IS NULL;
    `);

    console.log('Migration completed successfully.');
  } catch (err) {
    console.error('Migration failed:', err);
  } finally {
    process.exit(0);
  }
}

migrate();
