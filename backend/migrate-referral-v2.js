const db = require('./config/database');

async function migrate() {
    console.log('--- RELARIAL V2 MIGRATION START ---');
    try {
        // 1. Add has_paid to users
        await db.query(`
            ALTER TABLE users 
            ADD COLUMN IF NOT EXISTS has_paid BOOLEAN DEFAULT false
        `);
        console.log('[OK] Column has_paid added to users');

        // 2. Create discounts table
        await db.query(`
            CREATE TABLE IF NOT EXISTS discounts (
                id UUID PRIMARY KEY,
                user_id UUID REFERENCES users(id) ON DELETE CASCADE,
                percentage INTEGER DEFAULT 50,
                is_used BOOLEAN DEFAULT false,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('[OK] Table discounts created');

        // 3. Mark existing Elite users as having paid
        await db.query(`
            UPDATE users SET has_paid = true WHERE plan_type = 'elite'
        `);
        console.log('[OK] Existing Elite users marked as has_paid = true');

        console.log('--- MIGRATION FINISHED SUCCESSFULLY ---');
        process.exit(0);
    } catch (err) {
        console.error('--- MIGRATION FAILED ---', err);
        process.exit(1);
    }
}

migrate();
