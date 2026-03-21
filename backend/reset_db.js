const db = require('./config/database');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

async function resetAndSeed() {
  try {
    console.log('--- Database Reset & Seed Starting ---');
    console.log('DB URL check:', process.env.DATABASE_URL ? 'Found' : 'Missing');

    // Test connection
    const now = await db.query('SELECT NOW()');
    console.log('Connection test successful:', now.rows[0].now);
    console.log('Deleting all existing users...');
    await db.query('DELETE FROM users');
    await db.query('DELETE FROM admins'); // Clear legacy admin table too

    // 2. Seed the new mandatory admin
    const adminEmail = 'handersonchemane@gmail.com';
    const adminPassword = 'Handerson88@';
    const hashedPassword = await bcrypt.hash(adminPassword, 10);
    const adminId = uuidv4();

    console.log(`Seeding new admin: ${adminEmail}`);
    await db.query(
      'INSERT INTO users (id, name, email, password_hash, role, status) VALUES ($1, $2, $3, $4, $5, $6)',
      [adminId, 'Handerson Chemane', adminEmail, hashedPassword, 'admin', 'active']
    );

    // Also seed in legacy admins table for full compatibility during transition
    await db.query(
      'INSERT INTO admins (id, email, password_hash, role) VALUES ($1, $2, $3, $4)',
      [adminId, adminEmail, hashedPassword, 'admin']
    );

    console.log('--- Reset & Seed Completed Successfully ---');
    process.exit(0);
  } catch (err) {
    console.error('Error during reset & seed:', err);
    process.exit(1);
  }
}

resetAndSeed();
