const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function debug() {
  const email = 'handersonabreu4@gmail.com';
  try {
    console.log(`Searching for user: ${email}`);
    const userRes = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (userRes.rows.length === 0) {
      console.log('User not found.');
      return;
    }
    const user = userRes.rows[0];
    console.log('User found:', { id: user.id, email: user.email, name: user.name });

    console.log('\nChecking workout plans:');
    const plansRes = await pool.query('SELECT id, goal, level, created_at, structured_plan IS NOT NULL as has_structured FROM workout_plans WHERE user_id = $1 ORDER BY created_at DESC', [user.id]);
    console.table(plansRes.rows);

    if (plansRes.rows.length > 0) {
      console.log('\nSample Plan (latest):');
      const latestPlan = await pool.query('SELECT * FROM workout_plans WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1', [user.id]);
      console.log(JSON.stringify(latestPlan.rows[0], null, 2));
    }

  } catch (err) {
    console.error('Debug failed:', err);
  } finally {
    await pool.end();
  }
}

debug();
