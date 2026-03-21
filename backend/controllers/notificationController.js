const db = require('../config/database');
const webpush = require('web-push');
const { v4: uuidv4 } = require('uuid');

// Configure web-push with VAPID keys from .env
webpush.setVapidDetails(
  'mailto:support@profit.app',
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

exports.registerDevice = async (req, res) => {
  try {
    const userId = req.user.id;
    const { subscription, device_type } = req.body;

    if (!subscription) {
      return res.status(400).json({ error: 'Subscription is required.' });
    }

    // Check if subscription already exists for this user to avoid duplicates
    const checkResult = await db.query(
      'SELECT id FROM user_devices WHERE user_id = $1 AND subscription = $2',
      [userId, JSON.stringify(subscription)]
    );

    if (checkResult.rows.length > 0) {
      return res.status(200).json({ message: 'Device already registered.' });
    }

    // Save new device
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

/**
 * Utility function to send push notifications to all devices of a user
 */
exports.sendPushToUser = async (userId, payload) => {
  try {
    const result = await db.query(
      'SELECT subscription FROM user_devices WHERE user_id = $1',
      [userId]
    );

    const notifications = result.rows.map(row => {
      const subscription = row.subscription;
      return webpush.sendNotification(subscription, JSON.stringify(payload))
        .catch(async (err) => {
          if (err.statusCode === 404 || err.statusCode === 410) {
            console.log('Push subscription has expired or is no longer valid. Deleting...');
            await db.query('DELETE FROM user_devices WHERE subscription = $1', [JSON.stringify(subscription)]);
          } else {
            console.error('Push notification error:', err);
          }
        });
    });

    await Promise.all(notifications);
  } catch (error) {
    console.error('sendPushToUser error:', error);
  }
};

exports.getNotifications = async (req, res) => {
  try {
    const userId = req.user.id;
    const result = await db.query(
      `SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50`,
      [userId]
    );

    // Get unread count
    const unreadCountResult = await db.query(
      `SELECT COUNT(*) FROM notifications WHERE user_id = $1 AND is_read = false`,
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
