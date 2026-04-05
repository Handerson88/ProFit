const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

async function migrate() {
  try {
    console.log('Starting migration for scheduled_notifications table...');
    
    // Drop if exists to ensure clean slate (safe as this is a new feature)
    await pool.query('DROP TABLE IF EXISTS scheduled_notifications CASCADE');

    // Create scheduled_notifications table
    await pool.query(`
      CREATE TABLE scheduled_notifications (
        id UUID PRIMARY KEY,
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        type VARCHAR(50) NOT NULL,
        recipient_type VARCHAR(50) NOT NULL,
        scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,
        status VARCHAR(20) DEFAULT 'pending',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    // Create index for faster polling
    await pool.query(`
      CREATE INDEX idx_scheduled_notifications_status_date 
      ON scheduled_notifications(status, scheduled_at);
    `);

    console.log("Migration completed successfully: 'scheduled_notifications' table created.");
    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  }
}

migrate();
