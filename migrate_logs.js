const { pool } = require('./backend/config/database');

async function run() {
    try {
        console.log('Running migrations...');
        
        // Ensure email_logs exists
        await pool.query(`
            CREATE TABLE IF NOT EXISTS email_logs (
                id SERIAL PRIMARY KEY,
                user_id UUID REFERENCES users(id) ON DELETE SET NULL,
                email_type VARCHAR(50),
                status VARCHAR(20),
                details TEXT,
                sent_at TIMESTAMP DEFAULT NOW()
            );
        `);
        console.log('Checked email_logs table.');

        // Create notification_logs if it doesn't exist
        await pool.query(`
            CREATE TABLE IF NOT EXISTS notification_logs (
                id SERIAL PRIMARY KEY,
                user_id UUID REFERENCES users(id) ON DELETE SET NULL,
                notification_type VARCHAR(50),
                title TEXT,
                message TEXT,
                status VARCHAR(20),
                details TEXT,
                sent_at TIMESTAMP DEFAULT NOW()
            );
        `);
        console.log('Checked notification_logs table.');

        process.exit(0);
    } catch (err) {
        console.error('Migration failed:', err);
        process.exit(1);
    }
}

run();
