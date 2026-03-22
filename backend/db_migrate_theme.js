const { pool } = require('./config/database');

async function migrateTheme() {
  console.log('Starting theme preference migration...');
  try {
    // Add theme_preference to users table
    await pool.query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS theme_preference VARCHAR(20) DEFAULT 'system';
    `);
    
    // Optional: Migrate data from user_preferences table if it exists
    const tableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'user_preferences'
      );
    `);
    
    if (tableCheck.rows[0].exists) {
      console.log('Migrating existing theme preferences from user_preferences table...');
      await pool.query(`
        UPDATE users u
        SET theme_preference = CASE 
          WHEN up.theme_mode = 'auto' THEN 'system'
          ELSE up.theme_mode
        END
        FROM user_preferences up
        WHERE u.id = up.user_id;
      `);
      console.log('Data migration complete.');
    }

    console.log('Theme preference column added to users table.');
  } catch (err) {
    console.error('Migration failed:', err);
  } finally {
    process.exit(0);
  }
}

migrateTheme();
