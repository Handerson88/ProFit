const { pool } = require('./config/database');

async function migrateAuth() {
  console.log('Starting auth schema migration...');
  try {
    // Check if password_hash exists
    const checkUserCols = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name='users'
    `);
    
    const columns = checkUserCols.rows.map(r => r.column_name);

    if (!columns.includes('password_hash') && columns.includes('password')) {
      console.log('Renaming password to password_hash...');
      await pool.query('ALTER TABLE users RENAME COLUMN password TO password_hash;');
    } else if (!columns.includes('password_hash')) {
      console.log('Adding password_hash column...');
      await pool.query('ALTER TABLE users ADD COLUMN password_hash TEXT;');
    }

    if (!columns.includes('name')) {
      console.log('Adding name column and migrating data...');
      await pool.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS name TEXT;');
      if (columns.includes('first_name') && columns.includes('last_name')) {
        await pool.query("UPDATE users SET name = COALESCE(first_name, '') || ' ' || COALESCE(last_name, '') WHERE name IS NULL;");
        await pool.query('ALTER TABLE users DROP COLUMN first_name;');
        await pool.query('ALTER TABLE users DROP COLUMN last_name;');
      }
    }

    if (!columns.includes('goal')) {
        console.log('Adding goal column...');
        await pool.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS goal TEXT;');
    }

    console.log('Auth migration completed successfully.');
  } catch (err) {
    console.error('Migration failed:', err);
  } finally {
    process.exit(0);
  }
}

migrateAuth();
