const webpush = require('web-push');
const db = require('../config/database');
const { sendPushToUser } = require('../controllers/notificationController');
require('dotenv').config();

// Re-configure in case the controller haven't loaded from server.js context
webpush.setVapidDetails(
  'mailto:support@profit.app',
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

async function testPush() {
  try {
    // Get the first user with a registered device
    const result = await db.query('SELECT user_id FROM user_devices LIMIT 1');
    if (result.rows.length === 0) {
      console.log('No registered devices found. Please register a device in the app first.');
      process.exit(0);
    }

    const userId = result.rows[0].user_id;
    console.log(`Sending test notification to user: ${userId}`);

    await sendPushToUser(userId, {
      title: '🚀 Teste de Notificação',
      body: 'Se você está vendo isso, as notificações push reais estão funcionando! 🦾🏆'
    });

    console.log('Test notification sent successfully!');
    process.exit(0);
  } catch (err) {
    console.error('Test Push Error:', err);
    process.exit(1);
  }
}

testPush();
