const db = require('./config/database');
const bcrypt = require('bcryptjs');

async function testActivity() {
    try {
        console.log('Testing activity tracking...');
        
        // 1. Simulate Login (Update last_login_at)
        await db.query('UPDATE users SET last_login_at = NOW() WHERE email = $1', ['handersonsilva2014@gmail.com']);
        console.log('last_login_at updated');
        
        // 2. Simulate Activity (Middleware logic manually)
        await db.query(`
            UPDATE users 
            SET last_active_at = NOW() 
            WHERE email = $1 
            AND (last_active_at IS NULL OR last_active_at < NOW() - INTERVAL '30 seconds')
        `, ['handersonsilva2014@gmail.com']);
        console.log('last_active_at updated');
        
        // 3. Verify
        const result = await db.query('SELECT name, last_login_at, last_active_at FROM users WHERE email = $1', ['handersonsilva2014@gmail.com']);
        console.log('Verification result:', JSON.stringify(result.rows[0]));
        
        process.exit(0);
    } catch (e) {
        console.error('Test failed:', e);
        process.exit(1);
    }
}

testActivity();
