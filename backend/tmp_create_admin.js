const db = require('./config/database');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

async function createAdmin() {
    try {
        const hashedPassword = await bcrypt.hash('123456', 10);
        const userId = uuidv4();
        const referralCode = 'ADMIN777';
        
        // Delete if already exists to avoid conflict
        await db.query('DELETE FROM users WHERE email = $1', ['handersonsilva2014@gmail.com']);
        
        await db.query(
            'INSERT INTO users (id, name, email, password_hash, referral_code, role, plan_type) VALUES ($1, $2, $3, $4, $5, $6, $7)',
            [userId, 'Administrador', 'handersonsilva2014@gmail.com', hashedPassword, referralCode, 'admin', 'pro']
        );
        
        console.log('Admin user created/restored successfully');
        process.exit(0);
    } catch (e) {
        console.error('Error creating admin:', e);
        process.exit(1);
    }
}

createAdmin();
