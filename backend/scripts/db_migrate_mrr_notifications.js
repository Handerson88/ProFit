const db = require('../config/database');
const { v4: uuidv4 } = require('uuid');

async function runMigration() {
    try {
        console.log('Starting MRR and Notifications migration...');

        // 1. Subscriptions Table
        await db.query(`
            CREATE TABLE IF NOT EXISTS subscriptions (
                id UUID PRIMARY KEY,
                user_id UUID REFERENCES users(id) ON DELETE CASCADE,
                plan_name TEXT NOT NULL,
                plan_price NUMERIC NOT NULL,
                status TEXT DEFAULT 'active', -- active, cancelled, expired
                start_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                end_date TIMESTAMP,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('Table subscriptions created.');

        // 2. Payments Table
        await db.query(`
            CREATE TABLE IF NOT EXISTS payments (
                id UUID PRIMARY KEY,
                user_id UUID REFERENCES users(id) ON DELETE CASCADE,
                subscription_id UUID REFERENCES subscriptions(id) ON DELETE SET NULL,
                amount NUMERIC NOT NULL,
                currency TEXT DEFAULT 'MZN',
                status TEXT DEFAULT 'confirmed', -- pending, confirmed, failed
                payment_method TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('Table payments created.');

        // 3. Notifications Table
        await db.query(`
            CREATE TABLE IF NOT EXISTS notifications (
                id UUID PRIMARY KEY,
                title TEXT NOT NULL,
                message TEXT NOT NULL,
                type TEXT DEFAULT 'info', -- info, update, promotion
                user_id UUID REFERENCES users(id) ON DELETE CASCADE, -- null if sent to all
                sent_to_all BOOLEAN DEFAULT FALSE,
                read_status BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('Table notifications created.');

        // 4. Seed some dummy data for MRR testing if needed
        const checkUsers = await db.query('SELECT id FROM users LIMIT 5');
        if (checkUsers.rows.length > 0) {
            console.log('Seeding dummy subscriptions and payments for MRR testing...');
            for (const user of checkUsers.rows) {
                const subId = uuidv4();
                await db.query(
                    'INSERT INTO subscriptions (id, user_id, plan_name, plan_price, status) VALUES ($1, $2, $3, $4, $5) ON CONFLICT DO NOTHING',
                    [subId, user.id, 'Plano Mensal Pro', 300, 'active']
                );
                await db.query(
                    'INSERT INTO payments (id, user_id, subscription_id, amount, status) VALUES ($1, $2, $3, $4, $5) ON CONFLICT DO NOTHING',
                    [uuidv4(), user.id, subId, 300, 'confirmed']
                );
            }
            console.log('Dummy data seeded.');
        }

        console.log('Migration completed successfully.');
        process.exit(0);
    } catch (err) {
        console.error('Migration failed:', err);
        process.exit(1);
    }
}

runMigration();
