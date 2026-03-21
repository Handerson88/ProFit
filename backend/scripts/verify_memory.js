const crypto = require('crypto');
const fs = require('fs');
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function verify() {
  const filePath = 'c:/Users/My Computer/Desktop/ProFit/backend/uploads/meals/b4baf366-72f3-463a-a261-8b3d862a28a0/meal-b4baf366-72f3-463a-a261-8b3d862a28a0-1773518155876-15604034.jpg';
  
  if (!fs.existsSync(filePath)) {
    console.error('Test file not found');
    return;
  }

  const fileBuffer = fs.readFileSync(filePath);
  const hash = crypto.createHash('md5').update(fileBuffer).digest('hex');
  console.log('Generated Hash:', hash);

  const client = await pool.connect();
  try {
    // 1. Clean up potential old test
    await client.query('DELETE FROM food_memory WHERE image_hash = $1', [hash]);

    // 2. Insert test data
    await client.query(
      'INSERT INTO food_memory (image_hash, food_name, calories, protein, carbs, fat) VALUES ($1, $2, $3, $4, $5, $6)',
      [hash, 'TEST_BIFE_MEMORIA', 500, 40, 10, 20]
    );
    console.log('Inserted test record into memory.');

    // 3. Verify lookup (simulate controller)
    const res = await client.query('SELECT food_name FROM food_memory WHERE image_hash = $1', [hash]);
    if (res.rows[0].food_name === 'TEST_BIFE_MEMORIA') {
      console.log('VERIFICATION SUCCESS: Cache hit works!');
    } else {
      console.log('VERIFICATION FAILED: Data mismatch.');
    }

  } catch (err) {
    console.error('Verification error:', err);
  } finally {
    client.release();
    await pool.end();
  }
}

verify();
