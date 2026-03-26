const webpush = require('web-push');

/**
 * Configure web-push with VAPID keys
 */
function setupWebPush() {
  const publicKey = process.env.VAPID_PUBLIC_KEY || process.env.VAPID_CHAVE_PUBLICA;
  const privateKey = process.env.VAPID_PRIVATE_KEY || process.env.VAPID_CHAVE_PRIVADA;
  const subject = process.env.VAPID_SUBJECT || 'mailto:support@myprofittness.com';

  if (!publicKey || !privateKey) {
    console.warn('[WebPush] ⚠️ VAPID keys not configured. Push notifications are disabled.');
    return false;
  }

  try {
    webpush.setVapidDetails(subject, publicKey, privateKey);
    console.log('[WebPush] ✅ Web Push service initialized successfully');
    return true;
  } catch (error) {
    console.error('[WebPush] ❌ Failed to initialize Web Push:', error.message);
    return false;
  }
}

/**
 * Send Web Push notification to a subscription
 * @param {object} subscription - The push subscription object
 * @param {object} payload - { title, body, data }
 * @returns {Promise<boolean>} - Success or failure
 */
async function sendWebPushNotification(subscription, payload) {
  try {
    const pushPayload = JSON.stringify({
      title: payload.title || 'ProFit',
      body: payload.body || '',
      icon: '/faviconnovo.png',
      badge: '/faviconnovo.png',
      data: payload.data || {},
      ...payload
    });

    await webpush.sendNotification(subscription, pushPayload);
    return true;
  } catch (error) {
    if (error.statusCode === 404 || error.statusCode === 410) {
      console.warn('[WebPush] Subscription has expired or is no longer valid.');
      throw { type: 'REPLACEMENT_REQUIRED', error };
    }
    console.error('[WebPush] Error sending notification:', error.message);
    return false;
  }
}

module.exports = { setupWebPush, sendWebPushNotification };
