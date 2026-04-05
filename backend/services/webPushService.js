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
      image: payload.image || null, // Optional big image
      tag: payload.tag || 'profit-alert',
      data: {
        url: payload.data?.url || payload.data?.click_action || payload.url || payload.click_action || '/',
        ...payload.data
      },
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

async function logNotification(userId, type, title, message, status, details = null) {
  const db = require('../config/database');
  try {
    await db.query(`
      INSERT INTO notification_logs (user_id, notification_type, title, message, status, details)
      VALUES ($1, $2, $3, $4, $5, $6)
    `, [userId || null, type, title, message, status, details]);
  } catch (err) {
    console.error('Failed to log notification:', err);
  }
}

/**
 * Replaces dynamic variables in text
 */
function parseMessage(text, user) {
  if (!text) return '';
  return text
    .replace(/{{nome}}/g, user.name || 'Usuário')
    .replace(/{{email}}/g, user.email || '')
    .replace(/{{pais}}/g, user.country || 'seu país');
}

async function sendGroupPush(target, title, body, data = {}, userId = null, userIds = []) {
  const db = require('../config/database');
  let query = `
    SELECT u.id, u.name, u.email, u.country, d.subscription 
    FROM users u 
    JOIN user_devices d ON u.id = d.user_id 
    WHERE u.is_active = true
  `;
  const params = [];

  if (userIds && userIds.length > 0) {
    query += ` AND u.id = ANY($1::uuid[])`;
    params.push(userIds);
  } else if (target === 'pro') {
    query += " AND u.plan_type = 'pro'";
  } else if (target === 'active') {
    query += " AND u.last_active_at > NOW() - INTERVAL '7 days'";
  } else if (target === 'inactive') {
    query += " AND (u.last_active_at IS NULL OR u.last_active_at < NOW() - INTERVAL '7 days')";
  } else if (target === 'specific' && userId) {
    query += " AND u.id = $1";
    params.push(userId);
  }

  const { rows: targets } = await db.query(query, params);
  console.log(`[WebPush] Sending group push to ${targets.length} devices (Target: ${userIds.length > 0 ? 'Specific List' : target})`);

  const results = { sent: 0, failed: 0 };
  
  for (const t of targets) {
    const finalTitle = parseMessage(title, t);
    const finalBody = parseMessage(body, t);
    try {
      const success = await sendWebPushNotification(t.subscription, { title: finalTitle, body: finalBody, data });
      if (success) {
        await logNotification(t.id, 'marketing_push', finalTitle, finalBody, 'sent', `Target: ${target}`);
        results.sent++;
      } else {
        await logNotification(t.id, 'marketing_push', finalTitle, finalBody, 'failed', 'Unknown failure');
        results.failed++;
      }
    } catch (err) {
      if (err.type === 'REPLACEMENT_REQUIRED') {
        // Clean up invalid subscription
        await db.query('DELETE FROM user_devices WHERE user_id = $1 AND subscription::text = $2::text', [t.id, JSON.stringify(t.subscription)]);
      }
      await logNotification(t.id, 'marketing_push', title, body, 'failed', err.message || JSON.stringify(err));
      results.failed++;
    }
  }

  return results;
}

module.exports = { setupWebPush, sendWebPushNotification, sendGroupPush, logNotification };
