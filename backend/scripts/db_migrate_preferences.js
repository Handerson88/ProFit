require('dotenv').config();
const db = require('../config/database');

async function migrate() {
    console.log('Starting User Preferences migration...');
    try {
        // Create Table
        await db.query(`
            CREATE TABLE IF NOT EXISTS user_preferences (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                theme_mode TEXT NOT NULL DEFAULT 'auto' CHECK (theme_mode IN ('light', 'dark', 'auto')),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(user_id)
            )
        `);
        console.log('Table user_preferences verified/created.');

        // Function/Trigger to update updated_at
        await db.query(`
            CREATE OR REPLACE FUNCTION update_preferences_timestamp()
            RETURNS TRIGGER AS $$
            BEGIN
                NEW.updated_at = CURRENT_TIMESTAMP;
                RETURN NEW;
            END;
            $$ language 'plpgsql';
        `);

        await db.query(`
            DROP TRIGGER IF EXISTS trigger_update_preferences_timestamp ON user_preferences;
            CREATE TRIGGER trigger_update_preferences_timestamp
            BEFORE UPDATE ON user_preferences
            FOR EACH ROW
            EXECUTE FUNCTION update_preferences_timestamp();
        `);

        console.log('Migration completed successfully.');
        process.exit(0);
    } catch (err) {
        console.error('Migration failed:', err);
        process.exit(1);
    }
}

migrate();
