process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
const db = require('./config/database');

async function run() {
  try {
    console.log("Adding column...");
    await db.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS funnel_step VARCHAR(50) DEFAULT 'REGISTERED'`);
    console.log("Column added successfully.");
    process.exit(0);
  } catch (e) {
    console.error("Migration Failed: ", e);
    process.exit(1);
  }
}
run();
