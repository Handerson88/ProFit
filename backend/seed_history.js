const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const db = require('./config/database');
const { v4: uuidv4 } = require('uuid');

async function seedHistory() {
  try {
    const userRes = await db.query('SELECT id FROM users LIMIT 1');
    if (userRes.rows.length === 0) {
      console.log('No users found to seed history.');
      return;
    }
    const userId = userRes.rows[0].id;
    const today = new Date();
    
    for (let i = 1; i <= 3; i++) {
        const date = new Date(today);
        date.setDate(today.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        const calories = Math.floor(Math.random() * (2200 - 1500 + 1)) + 1500;
        
        await db.query(
            `INSERT INTO daily_calories (id, user_id, date, calories)
             VALUES ($1, $2, $3, $4)
             ON CONFLICT (user_id, date) DO NOTHING`,
            [uuidv4(), userId, dateStr, calories]
        );
        console.log(`Seeded ${calories} kcal for ${dateStr}`);
    }
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

seedHistory();
