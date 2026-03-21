const { Pool } = require('pg');
const pool = new Pool({
  connectionString: "postgresql://neondb_owner:npg_7avdzkQ5jSPG@ep-empty-shadow-ab4zlr84-pooler.eu-west-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require",
});

async function check() {
  try {
    const res = await pool.query('SELECT dish_name, calories, created_at FROM scanned_dishes ORDER BY created_at DESC LIMIT 10');
    console.log('Latest 10 Scans:', JSON.stringify(res.rows, null, 2));
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

check();
