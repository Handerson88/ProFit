const { Client } = require('pg');
require('dotenv').config();

const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function check() {
  await client.connect();
  
  console.log('\n--- MEALS TABLE COLUMNS ---');
  const mealsCols = await client.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'meals'");
  console.table(mealsCols.rows);

  console.log('\n--- DAILY_CALORIES TABLE COLUMNS ---');
  const dailyCols = await client.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'daily_calories'");
  console.table(dailyCols.rows);

  await client.end();
}

check().catch(console.error);
