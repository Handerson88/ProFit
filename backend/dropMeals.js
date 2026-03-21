const { pool } = require('./config/database');

async function dropMeals() {
  try {
    await pool.query('DROP TABLE IF EXISTS meals');
    console.log('Meals table dropped');
  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
}

dropMeals();
