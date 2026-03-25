const db = require('../config/database');
const { sendWebPushNotification } = require('../services/webPushService');
const { v4: uuidv4 } = require('uuid');

// ============================================================
// Register Web Push device subscription
// ============================================================
exports.registerDevice = async (req, res) => {
  try {
    const userId = req.user.id;
    const { subscription, device_type } = req.body;

    if (!subscription) {
      return res.status(400).json({ error: 'Subscription is required.' });
    }

    // Check if subscription already exists for this user
    const checkResult = await db.query(
      'SELECT id FROM user_devices WHERE user_id = $1 AND subscription::text = $2::text',
      [userId, JSON.stringify(subscription)]
    );

    if (checkResult.rows.length > 0) {
      return res.status(200).json({ message: 'Device already registered.' });
    }

    // Save subscription
    await db.query(
      `INSERT INTO user_devices (id, user_id, subscription, device_type) VALUES ($1, $2, $3, $4)`,
      [uuidv4(), userId, JSON.stringify(subscription), device_type || 'web']
    );

    // Update users table to mark notifications as enabled
    await db.query('UPDATE users SET notifications_enabled = true WHERE id = $1', [userId]);

    // Send welcome notification
    try {
      const welcomeTitle = 'Notificações Ativadas 🔔';
      const welcomeBody = 'Agora você receberá alertas inteligentes do aplicativo ProFit!';
      
      // 1. Persist to DB for in-app history
      await db.query(
        `INSERT INTO notifications (id, user_id, title, message, type) VALUES ($1, $2, $3, $4, $5)`,
        [uuidv4(), userId, welcomeTitle, welcomeBody, 'success']
      );

      // 2. Send Push
      await sendWebPushNotification(subscription, {
        title: welcomeTitle,
        body: welcomeBody,
        data: { type: 'welcome' }
      });
    } catch (e) {
      console.warn('[WebPush] Welcome notification flow failed:', e.message);
    }

    res.status(201).json({ success: true, message: 'Dispositivo registrado e notificações ativadas.' });
  } catch (error) {
    console.error('registerDevice error:', error);
    res.status(500).json({ error: 'Erro ao registrar dispositivo.' });
  }
};

// Deprecated: FCM token handler (redirects to registerDevice context if ever called)
exports.saveFCMToken = async (req, res) => {
  res.status(410).json({ error: 'FCM is deprecated. Please use /register-device with Web Push subscription.' });
};

// ============================================================
// Send push to a single user
// ============================================================
exports.sendPushToUser = async (userId, payload, io = null) => {
  try {
    // 1. Socket.io real-time event
    if (io) {
      io.to(`user_${userId}`).emit('new_notification', payload);
    }

    // 2. Web Push
    const devicesResult = await db.query(
      'SELECT subscription FROM user_devices WHERE user_id = $1',
      [userId]
    );

    for (const row of devicesResult.rows) {
      const subscription = typeof row.subscription === 'string'
        ? JSON.parse(row.subscription)
        : row.subscription;
      try {
        await sendWebPushNotification(subscription, payload);
      } catch (err) {
        if (err.type === 'REPLACEMENT_REQUIRED') {
          await db.query('DELETE FROM user_devices WHERE subscription::text = $1::text', [JSON.stringify(subscription)]);
          console.log(`[WebPush] Removed invalid subscription for user ${userId}`);
        }
      }
    }
  } catch (error) {
    console.error('sendPushToUser error:', error);
  }
};

// ============================================================
// Broadcast to ALL users
// ============================================================
exports.sendPushToAll = async (payload) => {
  try {
    const webPushResult = await db.query('SELECT user_id, subscription FROM user_devices');
    for (const row of webPushResult.rows) {
      const subscription = typeof row.subscription === 'string'
        ? JSON.parse(row.subscription)
        : row.subscription;
      try {
        await sendWebPushNotification(subscription, payload);
      } catch (err) {
        if (err.type === 'REPLACEMENT_REQUIRED') {
          await db.query('DELETE FROM user_devices WHERE subscription::text = $1::text', [JSON.stringify(subscription)]);
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
