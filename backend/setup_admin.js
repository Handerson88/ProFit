require('dotenv').config();
const db = require('./config/database');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

async function setupAdmin() {
    try {
        console.log('Creating admin tables...');
        
        // Admins table
        await db.query(`
            CREATE TABLE IF NOT EXISTS admins (
                id UUID PRIMARY KEY,
                email TEXT UNIQUE NOT NULL,
                password_hash TEXT NOT NULL,
                role TEXT DEFAULT 'admin',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Admin logs table
        await db.query(`
            CREATE TABLE IF NOT EXISTS admin_logs (
                id UUID PRIMARY KEY,
                admin_id UUID REFERENCES admins(id) ON DELETE CASCADE,
                action TEXT NOT NULL,
                target_type TEXT,
                target_id TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        console.log('Database tables created successfully.');

        // Seed initial admin
        const adminEmail = 'admin@profit.com';
        const adminPassword = 'adminpassword123'; // User should change this later
        const hashedPassword = await bcrypt.hash(adminPassword, 10);

        const checkAdmin = await db.query('SELECT * FROM admins WHERE email = $1', [adminEmail]);
        if (checkAdmin.rows.length === 0) {
            await db.query(
                'INSERT INTO admins (id, email, password_hash, role) VALUES ($1, $2, $3, $4)',
                [uuidv4(), adminEmail, hashedPassword, 'admin']
            );
            console.log(`Initial admin user created: ${adminEmail}`);
            console.log(`Password: ${adminPassword}`);
        } else {
            console.log('Admin user already exists.');
        }

        process.exit(0);
    } catch (err) {
        console.error('Error setting up admin database:', err);
        process.exit(1);
    }
}

setupAdmin();
