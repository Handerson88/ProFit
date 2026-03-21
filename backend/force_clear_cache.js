require('dotenv').config();
const db = require('./config/database');

async function clearCache() {
  try {
    console.log('Truncating food_memory table...');
    await db.query('TRUNCATE TABLE food_memory;');
    console.log('Table food_memory truncated successfully.');
    
    // Double check count
    const res = await db.query('SELECT COUNT(*) FROM food_memory;');
    console.log('Current count:', res.rows[0].count);
  } catch (err) {
    console.error('Truncate failed:', err.message);
  } finally {
    process.exit();
  }
}

clearCache();
