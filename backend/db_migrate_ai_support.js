const { pool } = require('./config/database');

async function migrate() {
  console.log('Creating AI support tables...');
  
  try {
    // 1. ai_conversations table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS ai_conversations (
          id UUID PRIMARY KEY,
          user_id UUID REFERENCES users(id) ON DELETE CASCADE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 2. ai_messages table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS ai_messages (
          id UUID PRIMARY KEY,
          conversation_id UUID REFERENCES ai_conversations(id) ON DELETE CASCADE,
          sender TEXT NOT NULL CHECK (sender IN ('user', 'ai', 'admin')),
          message TEXT NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log('Migration completed successfully.');
  } catch (err) {
    console.error('Migration failed:', err);
  } finally {
    process.exit(0);
  }
}

migrate();
