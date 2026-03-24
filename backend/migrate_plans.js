const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function migrate() {
  const sql = `
    ALTER TABLE users ADD COLUMN IF NOT EXISTS plan_status VARCHAR(20) DEFAULT 'inactive';
    ALTER TABLE users ADD COLUMN IF NOT EXISTS plan_expiration TIMESTAMP;
    ALTER TABLE users ALTER COLUMN plan_type SET DEFAULT 'free';

    -- Migração inicial: converter elite vitalício em pro mensal (temporário para teste)
    UPDATE users SET plan_type = 'pro', plan_status = 'active', plan_expiration = CURRENT_TIMESTAMP + INTERVAL '30 days' WHERE plan_type = 'elite';
    UPDATE users SET plan_type = 'pro', plan_status = 'active', plan_expiration = CURRENT_TIMESTAMP + INTERVAL '30 days' WHERE plan_type = 'admin' OR role = 'admin';
  `;
  try {
    console.log('Starting migration...');
    await pool.query(sql);
    console.log('Migration successful');
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

migrate();
