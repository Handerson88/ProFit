const db = require('./config/database');

async function readLogs() {
  console.log('Reading AI Error Logs...');
  try {
    const result = await db.query('SELECT * FROM ai_error_logs ORDER BY created_at DESC LIMIT 5');
    console.log('Latest Logs:', JSON.stringify(result.rows, null, 2));
  } catch (err) {
    console.error('Error reading logs:', err);
  } finally {
    process.exit();
  }
}

readLogs();
