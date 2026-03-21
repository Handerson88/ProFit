require('dotenv').config();
const db = require('../config/database');

async function checkSchema() {
  try {
    console.log("Checking Schema for workout_plans...");
    const res = await db.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'workout_plans';
    `);
    console.table(res.rows);

    console.log("\nChecking if workout_sessions exists...");
    const tableRes = await db.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'workout_sessions'
      );
    `);
    console.log("workout_sessions exists:", tableRes.rows[0].exists);

  } catch (err) {
    console.error("Database check failed:", err.message);
  } finally {
    process.exit();
  }
}

checkSchema();
