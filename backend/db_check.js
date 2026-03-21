const { Pool } = require('pg');
const pool = new Pool({
  connectionString: "postgresql://neondb_owner:npg_7avdzkQ5jSPG@ep-empty-shadow-ab4zlr84-pooler.eu-west-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require",
});

async function check() {
  try {
    const res = await pool.query('SELECT * FROM scanned_dishes ORDER BY created_at DESC LIMIT 1');
    console.log('Last Scanned Dish:', JSON.stringify(res.rows[0], null, 2));
    
    // Also check for any recent dishes with 0 calories
    const zeros = await pool.query('SELECT * FROM scanned_dishes WHERE calories = 0 ORDER BY created_at DESC LIMIT 5');
    console.log('Recent 0 Calorie Dishes:', JSON.stringify(zeros.rows, null, 2));
    
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

check();
