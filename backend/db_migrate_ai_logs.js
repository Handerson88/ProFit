const db = require('./config/database');

async function migrate() {
  console.log('Starting migration: AI Error Logs...');
  
  try {
    // 1. Create ai_error_logs table
    await db.query(`
      CREATE TABLE IF NOT EXISTS ai_error_logs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id),
        error_message TEXT NOT NULL,
        stack_trace TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('Table ai_error_logs created/verified.');

    // 2. Ensure ai_messages has a default for created_at if it doesn't
    await db.query(`
      ALTER TABLE ai_messages 
      ALTER COLUMN created_at SET DEFAULT CURRENT_TIMESTAMP
    `);
    console.log('Updated ai_messages defaults.');

    console.log('Migration completed successfully!');
    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  }
}

migrate();
nodeserv
