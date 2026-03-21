const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || process.env.URL_BANCO_DE_DADOS,
  ssl: { rejectUnauthorized: false }
});

async function fixAdmin() {
  const email = 'andersonsemana@gmail.com';
  const pass = 'admin123@';
  
  try {
    const hashed = await bcrypt.hash(pass, 10);
    const res = await pool.query("SELECT id FROM users WHERE email = $1", [email]);
    
    if (res.rows.length === 0) {
      console.log('User not found. Creating user as admin...');
      const { v4: uuidv4 } = require('uuid');
      const id = uuidv4();
      await pool.query(
        "INSERT INTO users (id, name, email, password_hash, role, status) VALUES ($1, $2, $3, $4, $5, $6)",
        [id, 'Anderson Semana', email, hashed, 'admin', 'active']
      );
      console.log('User created as admin.');
    } else {
      console.log('User found. Updating to admin and setting password...');
      await pool.query(
        "UPDATE users SET role = 'admin', password_hash = $1, status = 'active' WHERE email = $2",
        [hashed, email]
      );
      console.log('User updated to admin and password reset.');
    }
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await pool.end();
  }
}

fixAdmin();
