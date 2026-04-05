process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const db = require('./config/database');
const { v4: uuidv4 } = require('uuid');

async function run() {
  try {
    const userRes = await db.query("SELECT id FROM users LIMIT 3");
    if (userRes.rows.length === 0) {
      console.log('No users found to create sessions for.');
      return;
    }

    const planRes = await db.query("SELECT id FROM workout_plans LIMIT 1");
    const planId = planRes.rows.length > 0 ? planRes.rows[0].id : null;

    const sessions = [
      { status: 'completed', type: 'IA', day: 'Segunda-feira', dur: 45, cal: 320, offset: '1 day' },
      { status: 'active', type: 'IA', day: 'Terça-feira', dur: 20, cal: 150, offset: '0 minutes' },
      { status: 'cancelled', type: 'Manual', day: 'Segunda-feira', dur: 5, cal: 10, offset: '2 days' },
      { status: 'completed', type: 'Manual', day: 'Domingo', dur: 60, cal: 450, offset: '3 days' }
    ];

    for (const [i, s] of sessions.entries()) {
      const userId = userRes.rows[i % userRes.rows.length].id;
      await db.query(`
        INSERT INTO workout_sessions (id, user_id, plan_id, status, start_time, workout_type, workout_day, duration, calories)
        VALUES ($1, $2, $3, $4, NOW() - INTERVAL '${s.offset}', $5, $6, $7, $8)
      `, [uuidv4(), userId, planId, s.status, s.type, s.day, s.dur, s.cal]);
    }

    console.log('Sample sessions created.');

  } catch (err) {
    console.error('Seed Error:', err);
  } finally {
    process.exit();
  }
}

run();
