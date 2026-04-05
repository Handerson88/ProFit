process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const db = require('./config/database');

async function migrate() {
  try {
    console.log('Adding primary_objective column...');
    await db.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS primary_objective VARCHAR(255)`);
    console.log('Migration completed successfully.');
    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  }
}

migrate();
