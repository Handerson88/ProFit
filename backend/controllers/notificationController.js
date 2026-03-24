const db = require('../config/database');
const { sendFCMNotification } = require('../services/firebaseAdmin');
const webpush = require('web-push'); // keep for legacy Web Push fallback
const { v4: uuidv4 } = require('uuid');

// Configure web-push as fallback
if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    'mailto:support@profit.app',
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
}

// ============================================================
// Save FCM token from frontend
// ============================================================
exports.saveFCMToken = async (req, res) => {
  try {
    const userId = req.user.id;
    const { fcm_token } = req.body;

    if (!fcm_token) {
      return res.status(400).json({ error: 'fcm_token is required.' });
    }

    // Save token on user row
    await db.query(
      'UPDATE users SET fcm_token = $1, notifications_enabled = true WHERE id = $2',
      [fcm_token, userId]
    );

    // Send welcome notification (Push + In-app)
    try {
      const welcomeTitle = 'Notificações Ativadas 🔔';
      const welcomeBody = 'Agora você receberá alertas inteligentes do aplicativo ProFit!';
      
      // 1. Persist to DB for in-app history
      await db.query(
        `INSERT INTO notifications (id, user_id, title, message, type) VALUES ($1, $2, $3, $4, $5)`,
        [uuidv4(), userId, welcomeTitle, welcomeBody, 'success']
      );

      // 2. Send Push via FCM
      await sendFCMNotification([fcm_token], {
        title: welcomeTitle,
        body: welcomeBody,
        data: { type: 'welcome' }
      });
    } catch (e) {
      console.warn('[FCM] Welcome notification flow failed:', e.message);
    }

    res.json({ success: true, message: 'FCM token salvo e notificações ativadas.' });
  } catch (error) {
    console.error('saveFCMToken error:', error);
    res.status(500).json({ error: 'Erro ao salvar token FCM.' });
  }
};

// ============================================================
// Legacy: Register Web Push device subscription (kept for compatibility)
// ============================================================
exports.registerDevice = async (req, res) => {
  try {
    const userId = req.user.id;
    const { subscription, device_type } = req.body;

    if (!subscription) {
      return res.status(400).json({ error: 'Subscription is required.' });
    }

    const checkResult = await db.query(
      'SELECT id FROM user_devices WHERE user_id = $1 AND subscription = $2',
      [userId, JSON.stringify(subscription)]
    );

    if (checkResult.rows.length > 0) {
      return res.status(200).json({ message: 'Device already registered.' });
    }

    await db.query(
      `INSERT INTO user_devices (id, user_id, subscription, device_type) VALUES ($1, $2, $3, $4)`,
      [uuidv4(), userId, JSON.stringify(subscription), device_type || 'web']
    );

    res.status(201).json({ message: 'Device registered successfully.' });
  } catch (error) {
    console.error('registerDevice error:', error);
    res.status(500).json({ error: 'Erro ao registrar dispositivo.' });
  }
};

// ============================================================
// Send push to a single user — FCM primary, Web Push fallback
// ============================================================
exports.sendPushToUser = async (userId, payload, io = null) => {
  try {
    // 1. Socket.io real-time event
    if (io) {
      io.to(`user_${userId}`).emit('new_notification', payload);
    }

    // 2. FCM push (primary)
    const userResult = await db.query(
      'SELECT fcm_token FROM users WHERE id = $1 AND fcm_token IS NOT NULL',
      [userId]
    );

    if (userResult.rows.length > 0) {
      const token = userResult.rows[0].fcm_token;
      const { invalidTokens } = await sendFCMNotification([token], payload);
      // Clean up invalid token
      if (invalidTokens.length > 0) {
        await db.query('UPDATE users SET fcm_token = NULL WHERE id = $1', [userId]);
        console.log(`[FCM] Cleared invalid token for user ${userId}`);
      }
    }

    // 3. Legacy Web Push fallback
    const devicesResult = await db.query(
      'SELECT subscription FROM user_devices WHERE user_id = $1',
      [userId]
    );

    for (const row of devicesResult.rows) {
      const subscription = typeof row.subscription === 'string'
        ? JSON.parse(row.subscription)
        : row.subscription;
      try {
        await webpush.sendNotification(subscription, JSON.stringify(payload));
      } catch (err) {
        if (err.statusCode === 404 || err.statusCode === 410) {
          await db.query('DELETE FROM user_devices WHERE subscription = $1', [JSON.stringify(row.subscription)]);
        }
      }
    }
  } catch (error) {
    console.error('sendPushToUser error:', error);
  }
};

// ============================================================
// Broadcast to ALL users — FCM multicast + Web Push fallback
// ============================================================
exports.sendPushToAll = async (payload) => {
  try {
    // 1. FCM multicast (send to all users with fcm_token)
    const fcmResult = await db.query(
      'SELECT fcm_token FROM users WHERE fcm_token IS NOT NULL AND fcm_token != \'\''
    );
    const tokens = fcmResult.rows.map(r => r.fcm_token);

    if (tokens.length > 0) {
      const { invalidTokens } = await sendFCMNotification(tokens, payload);
      // Clean up expired tokens
      if (invalidTokens.length > 0) {
        await db.query(
          'UPDATE users SET fcm_token = NULL WHERE fcm_token = ANY($1)',
          [invalidTokens]
        );
      }
    }

    // 2. Legacy Web Push fallback
    const webPushResult = await db.query('SELECT subscription FROM user_devices');
    for (const row of webPushResult.rows) {
      const subscription = row.subscription;
      try {
        await webpush.sendNotification(subscription, JSON.stringify(payload));
      } catch (err) {
        if (err.statusCode === 404 || err.statusCode === 410) {
          await db.query('DELETE FROM user_devices WHERE subscription = $1', [JSON.stringify(subscription)]);
        }
      }
    }
  } catch (error) {
    console.error('sendPushToAll error:', error);
  }
};

// ============================================================
// Standard in-app notification endpoints
// ============================================================
exports.getNotifications = async (req, res) => {
  try {
    const userId = req.user.id;
    const result = await db.query(
      `SELECT * FROM notifications WHERE user_id = $1 OR sent_to_all = true ORDER BY created_at DESC LIMIT 50`,
      [userId]
    );

    const unreadCountResult = await db.query(
      `SELECT COUNT(*) FROM notifications WHERE (user_id = $1 OR sent_to_all = true) AND is_read = false`,
      [userId]
    );

    res.json({
      notifications: result.rows,
      unreadCount: parseInt(unreadCountResult.rows[0].count)
    });
  } catch (error) {
    console.error('getNotifications error:', error);
    res.status(500).json({ error: 'Erro ao buscar notificações.' });
  }
};

exports.markAsRead = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const result = await db.query(
      `UPDATE notifications SET is_read = true WHERE id = $1 AND user_id = $2 RETURNING *`,
      [id, userId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Notificação não encontrada.' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('markAsRead error:', error);
    res.status(500).json({ error: 'Erro ao atualizar notificação.' });
  }
};

exports.markAllAsRead = async (req, res) => {
  try {
    const userId = req.user.id;
    await db.query(
      `UPDATE notifications SET is_read = true WHERE user_id = $1 AND is_read = false`,
      [userId]
    );
    res.json({ success: true, message: 'Todas as notificações foram marcadas como lidas.' });
  } catch (error) {
    console.error('markAllAsRead error:', error);
    res.status(500).json({ error: 'Erro ao atualizar notificações.' });
  }
};
