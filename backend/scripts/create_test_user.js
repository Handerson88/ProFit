const { Client } = require('pg');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

dotenv.config({ path: path.join(__dirname, '../.env') });

const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function createTestUser() {
  try {
    await client.connect();
    const email = 'test_quiz@example.com';
    const password = await bcrypt.hash('Password123!', 10);
    const name = 'Quiz Tester';
    const id = uuidv4();

    // Delete existing test user if any
    await client.query('DELETE FROM users WHERE email = $1', [email]);

    const res = await client.query(
      'INSERT INTO users (id, name, email, password_hash, onboarding_completed) VALUES ($1, $2, $3, $4, $5) RETURNING id',
      [id, name, email, password, false]
    );

    console.log(`Test user created with ID: ${res.rows[0].id}`);
  } catch (err) {
    console.error('Error creating test user:', err);
  } finally {
    await client.end();
  }
}

createTestUser();

