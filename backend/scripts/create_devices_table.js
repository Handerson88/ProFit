const db = require('../config/database');

async function createDevicesTable() {
  try {
    console.log('Ensuring user_devices table exists...');
    await db.query(`
      CREATE TABLE IF NOT EXISTS user_devices (
        id UUID PRIMARY KEY,
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        subscription JSONB NOT NULL,
        device_type TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('Table user_devices is ready.');

    await db.query('CREATE INDEX IF NOT EXISTS idx_user_devices_user ON user_devices(user_id)');
    console.log('Index for user_devices created/verified.');

    process.exit(0);
  } catch (err) {
    console.error('Error creating devices table:', err);
    process.exit(1);
  }
}

createDevicesTable();
