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

    let isNewDevice = false;
    if (checkResult.rows.length === 0) {
      // Save subscription
      await db.query(
        `INSERT INTO user_devices (id, user_id, subscription, device_type) VALUES ($1, $2, $3, $4)`,
        [uuidv4(), userId, JSON.stringify(subscription), device_type || 'web']
      );
      isNewDevice = true;
    }

    // Always update users table to ensure notifications are marked as active
    await db.query('UPDATE users SET notifications_enabled = true WHERE id = $1', [userId]);

    // Send welcome notification ONLY for genuinely NEW devices to avoid duplication
    if (isNewDevice) {
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
    }

    res.status(isNewDevice ? 201 : 200).json({ 
      success: true, 
      message: isNewDevice ? 'Dispositivo registrado e notificações ativadas.' : 'Notificações reativadas.' 
    });
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
// ============================================================
// Send to specific recipient type (Logic moved from Admin)
// ============================================================
exports.sendToRecipientType = async (io, { title, message, type, recipientType, userId }) => {
    let notificationsCount = 0;

    if (recipientType === 'all') {
        const newNotifId = uuidv4();
        await db.query(
            'INSERT INTO notifications (id, title, message, type, sent_to_all) VALUES ($1, $2, $3, $4, $5)',
            [newNotifId, title, message, type, true]
        );
        io.emit('new_notification', { id: newNotifId, title, message, type, sent_to_all: true });
        await exports.sendPushToAll({ title, body: message, data: { type } });
        notificationsCount = 1;

    } else if (recipientType === 'active_subscribers') {
        const subscribers = await db.query("SELECT DISTINCT user_id FROM user_devices");
        for (const sub of subscribers.rows) {
            const newNotifId = uuidv4();
            await db.query(
                'INSERT INTO notifications (id, title, message, type, user_id) VALUES ($1, $2, $3, $4, $5)',
                [newNotifId, title, message, type, sub.user_id]
            );
            io.to(sub.user_id).emit('new_notification', { id: newNotifId, title, message, type, user_id: sub.user_id });
            await exports.sendPushToUser(sub.user_id, { title, body: message, data: { type } });
            notificationsCount++;
        }
    } else if (recipientType === 'pro_users') {
        const pros = await db.query("SELECT id FROM users WHERE role = 'user' AND plan_type = 'pro'");
        for (const user of pros.rows) {
            const newNotifId = uuidv4();
            await db.query('INSERT INTO notifications (id, title, message, type, user_id) VALUES ($1, $2, $3, $4, $5)', [newNotifId, title, message, type, user.id]);
            io.to(user.id).emit('new_notification', { id: newNotifId, title, message, type, user_id: user.id });
            await exports.sendPushToUser(user.id, { title, body: message, data: { type } }, io);
            notificationsCount++;
        }
    } else if (recipientType === 'inactive_users') {
        const inactives = await db.query("SELECT id FROM users WHERE role = 'user' AND (last_active_at < NOW() - INTERVAL '7 days' OR last_active_at IS NULL)");
        for (const user of inactives.rows) {
            const newNotifId = uuidv4();
            await db.query('INSERT INTO notifications (id, title, message, type, user_id) VALUES ($1, $2, $3, $4, $5)', [newNotifId, title, message, type, user.id]);
            io.to(user.id).emit('new_notification', { id: newNotifId, title, message, type, user_id: user.id });
            await exports.sendPushToUser(user.id, { title, body: message, data: { type } }, io);
            notificationsCount++;
        }
    } else if (recipientType === 'specific' && userId) {
        const newNotifId = uuidv4();
        await db.query(
            'INSERT INTO notifications (id, title, message, type, user_id) VALUES ($1, $2, $3, $4, $5)',
            [newNotifId, title, message, type, userId]
        );
        io.to(userId).emit('new_notification', { id: newNotifId, title, message, type, user_id: userId });
        await exports.sendPushToUser(userId, { title, body: message, data: { type } });
        notificationsCount = 1;
    }

    return notificationsCount;
};
