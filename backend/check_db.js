const { Client } = require('pg');
require('dotenv').config();

const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function check() {
  await client.connect();
  console.log('--- USERS ---');
  const users = await client.query('SELECT id, name, email, scans_used_today, last_scan_date FROM users ORDER BY last_scan_date DESC LIMIT 5');
  console.table(users.rows);

  console.log('\n--- RECENT MEALS ---');
  const meals = await client.query('SELECT id, user_id, meal_name, calories, date, created_at FROM meals ORDER BY created_at DESC LIMIT 10');
  console.table(meals.rows);

  console.log('\n--- SCANNED DISHES ---');
  const scanned = await client.query('SELECT id, user_id, dish_name, calories, created_at FROM scanned_dishes ORDER BY created_at DESC LIMIT 10');
  console.table(scanned.rows);

  console.log('\n--- SERVER TIME ---');
  const time = await client.query('SELECT NOW(), CURRENT_DATE');
  console.table(time.rows);

  await client.end();
}

check().catch(console.error);
