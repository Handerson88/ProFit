const db = require('./config/database');

async function migrate() {
  try {
    console.log('Adding avatar_url to users table...');
    await db.query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS avatar_url TEXT;
    `);
    
    // Fallback: Copy profile_photo to avatar_url for existing users
    await db.query(`
      UPDATE users 
      SET avatar_url = profile_photo 
      WHERE avatar_url IS NULL AND profile_photo IS NOT NULL;
    `);
    
    console.log('Migration completed successfully.');
    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  }
}

migrate();
