const db = require('./config/database');

async function migrate() {
    try {
        console.log('Starting migration: Referral columns...');
        
        await db.query(`
            ALTER TABLE users 
            ADD COLUMN IF NOT EXISTS referral_code VARCHAR(10) UNIQUE,
            ADD COLUMN IF NOT EXISTS referred_by UUID REFERENCES users(id),
            ADD COLUMN IF NOT EXISTS total_referrals INTEGER DEFAULT 0,
            ADD COLUMN IF NOT EXISTS discount_earned BOOLEAN DEFAULT FALSE,
            ADD COLUMN IF NOT EXISTS discount_used BOOLEAN DEFAULT FALSE;
        `);
        
        // Generate referral codes for existing users (optional but good for consistency)
        const result = await db.query('SELECT id FROM users WHERE referral_code IS NULL');
        for (const row of result.rows) {
            const code = Math.random().toString(36).substring(2, 8).toUpperCase();
            await db.query('UPDATE users SET referral_code = $1 WHERE id = $2', [code, row.id]);
        }
        
        console.log('SUCCESS: Referral columns added.');
        process.exit(0);
    } catch (err) {
        console.error('Migration failed:', err);
        process.exit(1);
    }
}

migrate();
