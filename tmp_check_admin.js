const { Pool } = require('pg');
require('dotenv').config({ path: './backend/.env' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || process.env.URL_BANCO_DE_DADOS,
  ssl: { rejectUnauthorized: false }
});

async function checkAdmin() {
  try {
    const res = await pool.query("SELECT id, name, email, role, status FROM users WHERE email = 'andersonsemana@gmail.com'");
    console.log('User found:', JSON.stringify(res.rows[0], null, 2));
    
    if (res.rows.length === 0) {
      console.log('User NOT FOUND. Creating it as admin...');
      // If not found, we might want to create it, but let's just check first.
    } else if (res.rows[0].role !== 'admin') {
      console.log('User is NOT admin. Updating to admin...');
      await pool.query("UPDATE users SET role = 'admin' WHERE email = 'andersonsemana@gmail.com'");
      console.log('User updated to ADMIN.');
    }
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await pool.end();
  }
}

checkAdmin();
