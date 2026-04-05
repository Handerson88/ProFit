require('dotenv').config();
const db = new (require('pg').Pool)({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});
const { sendWebPushNotification, setupWebPush } = require('./services/webPushService');

async function testPush() {
    console.log('--- ProFit Native Push Test ---');
    
    const initialized = setupWebPush();
    if (!initialized) {
        console.error('❌ VAPID keys not configured in .env');
        process.exit(1);
    }

    try {
        // Get the latest registered device
        const result = await db.query(
            'SELECT u.name, d.subscription FROM user_devices d JOIN users u ON d.user_id = u.id ORDER BY d.created_at DESC LIMIT 1'
        );

        if (result.rows.length === 0) {
            console.error('❌ No registered devices found in user_devices table.');
            console.log('Please log in to the Dashboard and "Allow Notifications" first.');
            process.exit(1);
        }

        const { name, subscription } = result.rows[0];
        console.log(`🔔 Sending test push to: ${name}`);

        const payload = {
            title: 'Teste de Notificação Nativa! 🚀',
            body: `${name.split(' ')[0]}, isso é uma notificação do sistema ProFit, "como se já estivesse instalado".`,
            data: {
                url: '/dashboard',
                type: 'test'
            }
        };

        const success = await sendWebPushNotification(JSON.parse(subscription), payload);

        if (success) {
            console.log('✅ Push sent successfully! Check your phone.');
        } else {
            console.log('❌ Failed to send push. Check server logs.');
        }

    } catch (err) {
        console.error('❌ Error during push test:', err.message);
    } finally {
        process.exit(0);
    }
}

testPush();
