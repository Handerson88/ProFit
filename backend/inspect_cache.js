require('dotenv').config();
const db = require('./config/database');

async function inspect() {
  try {
    const res = await db.query('SELECT * FROM food_memory LIMIT 10;');
    console.log('Food Memory Count:', res.rows.length);
    res.rows.forEach(row => {
      console.log(`- ID: ${row.id}, Name: ${row.food_name}`);
      console.log(`  Ingredients: ${row.ingredients}`);
      console.log(`  Observation: ${row.nutrition_observation}`);
    });
  } catch (err) {
    console.error('Inspect failed:', err.message);
  } finally {
    process.exit();
  }
}

inspect();
