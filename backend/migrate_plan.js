require('dotenv').config();
const db = require('./config/database');

async function migrate() {
  try {
    console.log("Adding missing columns to users table...");
    await db.query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS plan TEXT DEFAULT 'free',
      ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'inactive';
    `);
    console.log("Migration successful!");
    
    // Check if columns are now there
    const res = await db.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'users' AND column_name IN ('plan', 'subscription_status');
    `);
    console.table(res.rows);
  } catch (err) {
    console.error("Migration failed:", err);
  } finally {
    process.exit();
  }
}
migrate();
