const db = require('../config/database');

const migrate = async () => {
    try {
        console.log('Adding status column to users table...');
        await db.query(`
            ALTER TABLE users 
            ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active'
        `);
        console.log('Status column added successfully.');
        process.exit(0);
    } catch (err) {
        console.error('Migration failed:', err);
        process.exit(1);
    }
};

migrate();
