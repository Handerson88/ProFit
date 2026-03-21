
const db = require('./config/database');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

async function masterReset() {
  console.log('--- MASTER RESET START ---');
  const tables = [
    'meals', 'workout_plans', 'admin_logs', 'admins', 'payments', 
    'settings', 'subscriptions', 'scanned_dishes', 'discounts', 'users'
  ];

  for (const table of tables) {
    try {
      console.log(`Truncating ${table}...`);
      await db.query(`TRUNCATE TABLE "${table}" CASCADE`);
    } catch (e) {
      console.warn(`Could not truncate ${table}: ${e.message}`);
    }
  }

  try {
    const hash = await bcrypt.hash('admin123', 10);
    const adminId = uuidv4();
    await db.query(
      'INSERT INTO users (id, name, email, password_hash, role, plan_type, status) VALUES ($1, $2, $3, $4, $5, $6, $7)', 
      [adminId, 'Admin Handerson', 'handersonchemane@gmail.com', hash, 'admin', 'pro', 'active']
    );
    console.log('--- MASTER RESET COMPLETE: Admin created with email handersonchemane@gmail.com and password admin123 ---');
  } catch (e) {
    console.error('Failed to create admin:', e);
  }
  process.exit(0);
}

masterReset();
