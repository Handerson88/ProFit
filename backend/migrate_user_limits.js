require('dotenv').config();
const db = require('./config/database');

async function migrate() {
  try {
    console.log('Starting migration for user limits and invitations...');
    
    // Add columns to users table
    await db.query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS scan_limit_per_day INTEGER DEFAULT 3,
      ADD COLUMN IF NOT EXISTS scans_used_today INTEGER DEFAULT 0,
      ADD COLUMN IF NOT EXISTS last_scan_date TIMESTAMP,
      ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active',
      ADD COLUMN IF NOT EXISTS invite_token VARCHAR(255);
    `);
    
    console.log('Columns added successfully.');

    // Ensure status can have 'pending_invite'
    console.log('Update existing users to active if status is null...');
    await db.query("UPDATE users SET status = 'active' WHERE status IS NULL;");

    console.log('Migration completed successfully!');
  } catch (err) {
    console.error('Migration failed:', err.message);
  } finally {
    process.exit();
  }
}

migrate();
