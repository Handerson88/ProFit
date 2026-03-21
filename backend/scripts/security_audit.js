const db = require('../config/database');

async function runAudit() {
  console.log('--- STARTING SECURITY AUDIT ---');
  
  try {
    // 1. Check Tables for user_id
    const tables = ['meals', 'daily_calories', 'weight_logs', 'water_logs', 'notifications', 'workout_plans'];
    console.log('\nChecking Data Isolation (user_id column):');
    
    for (const table of tables) {
      const res = await db.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = $1 AND column_name = 'user_id'
      `, [table]);
      
      if (res.rows.length > 0) {
        console.log(`✅ Table '${table}' has user_id isolation.`);
      } else {
        console.error(`❌ Table '${table}' is MISSING user_id column!`);
      }
    }

    // 2. Check for unique constraints and indexes
    console.log('\nChecking Performance Indexes:');
    const indexes = await db.query(`
      SELECT indexname, indexdef 
      FROM pg_indexes 
      WHERE schemaname = 'public'
    `);
    
    const indexNames = indexes.rows.map(r => r.indexname);
    const criticalIndexes = [
        'idx_daily_calories_user_date',
        'idx_meals_user_date',
        'idx_weight_user_date'
    ];

    criticalIndexes.forEach(idx => {
        if (indexNames.includes(idx)) {
            console.log(`✅ Index '${idx}' is active.`);
        } else {
            console.warn(`⚠️ Warning: Index '${idx}' is missing.`);
        }
    });

    console.log('\n--- AUDIT COMPLETE ---');
    process.exit(0);
  } catch (err) {
    console.error('Audit failed:', err);
    process.exit(1);
  }
}

runAudit();
