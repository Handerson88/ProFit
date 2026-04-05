const db = require('./backend/config/database');

async function migrate() {
    try {
        console.log('--- Migrating to Unified Scheduled Communications ---');

        // 1. Create the new unified table
        await db.query(`
            CREATE TABLE IF NOT EXISTS scheduled_communications (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                type TEXT NOT NULL, -- 'push' or 'email'
                target TEXT NOT NULL, -- 'all', 'pro', 'active', 'inactive'
                title TEXT, -- subject for email, title for push
                content TEXT, -- message body
                button_text TEXT,
                button_link TEXT,
                scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,
                status TEXT DEFAULT 'pending', -- 'pending', 'sent', 'failed'
                details TEXT,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // 2. Migrate existing pending/failed notifications to the new table
        const { rows: existing } = await db.query("SELECT * FROM scheduled_notifications WHERE status != 'sent'");
        
        for (const notif of existing) {
            await db.query(`
                INSERT INTO scheduled_communications (type, target, title, content, scheduled_at, status, created_at)
                VALUES ($1, $2, $3, $4, $5, $6, $7)
            `, [
                'push', 
                notif.recipient_type || 'all', 
                notif.title, 
                notif.message, 
                notif.scheduled_at, 
                notif.status, 
                notif.created_at
            ]);
        }

        console.log(`Migrated ${existing.length} records.`);
        console.log('Migration completed successfully.');
        process.exit(0);
    } catch (err) {
        console.error('Migration failed:', err);
        process.exit(1);
    }
}

migrate();
