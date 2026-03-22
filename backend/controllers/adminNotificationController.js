const db = require('../config/database');
const { v4: uuidv4 } = require('uuid');
const notificationController = require('./notificationController');

exports.sendNotification = async (req, res) => {
    const { title, message, type, recipientType, userId } = req.body;
    const io = req.app.get('socketio');

    try {
        let notifications = [];

        if (recipientType === 'all') {
            const newNotif = {
                id: uuidv4(),
                title,
                message,
                type,
                sent_to_all: true,
                user_id: null
            };
            await db.query(
                'INSERT INTO notifications (id, title, message, type, sent_to_all) VALUES ($1, $2, $3, $4, $5)',
                [newNotif.id, newNotif.title, newNotif.message, newNotif.type, true]
            );
            // Broadcast to all connected users
            io.emit('new_notification', newNotif);
            
            // Push notification to all devices
            console.log(`[Admin] Sending broadcast push: "${newNotif.title}"`);
            await notificationController.sendPushToAll({
                title: newNotif.title,
                body: newNotif.message,
                data: { type: newNotif.type }
            });

            notifications.push(newNotif);

        } else if (recipientType === 'active_subscribers') {
            const subscribers = await db.query("SELECT user_id FROM subscriptions WHERE status = 'active'");
            for (const sub of subscribers.rows) {
                const newNotif = {
                    id: uuidv4(),
                    title,
                    message,
                    type,
                    user_id: sub.user_id
                };
                await db.query(
                    'INSERT INTO notifications (id, title, message, type, user_id) VALUES ($1, $2, $3, $4, $5)',
                    [newNotif.id, newNotif.title, newNotif.message, newNotif.type, newNotif.user_id]
                );
                // Send to specific user room
                io.to(sub.user_id).emit('new_notification', newNotif);

                // Push notification to this specific user
                await notificationController.sendPushToUser(sub.user_id, {
                    title: newNotif.title,
                    body: newNotif.message,
                    data: { type: newNotif.type }
                });

                notifications.push(newNotif);
            }
        } else if (recipientType === 'specific' && userId) {
            const newNotif = {
                id: uuidv4(),
                title,
                message,
                type,
                user_id: userId
            };
            await db.query(
                'INSERT INTO notifications (id, title, message, type, user_id) VALUES ($1, $2, $3, $4, $5)',
                [newNotif.id, newNotif.title, newNotif.message, newNotif.type, newNotif.user_id]
            );
            // Send to specific user room
            io.to(userId).emit('new_notification', newNotif);

            // Push notification to this specific user
            console.log(`[Admin] Sending targeted push to user ${userId}: "${newNotif.title}"`);
            await notificationController.sendPushToUser(userId, {
                title: newNotif.title,
                body: newNotif.message,
                data: { type: newNotif.type }
            });

            notifications.push(newNotif);
        }

        res.status(201).json({ message: 'Notificação enviada com sucesso', count: notifications.length });
    } catch (err) {
        console.error('Error sending notification:', err);
        res.status(500).json({ message: 'Erro ao enviar notificação' });
    }
};

// Get all notification templates
exports.getTemplates = async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM notification_templates ORDER BY created_at DESC');
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching templates:', err);
        res.status(500).json({ message: 'Erro ao buscar templates' });
    }
};

// Get all sent notifications for history
exports.getNotifications = async (req, res) => {
    try {
        const result = await db.query(`
            SELECT n.*, u.name as user_name 
            FROM notifications n 
            LEFT JOIN users u ON n.user_id = u.id 
            ORDER BY n.created_at DESC 
            LIMIT 50
        `);
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching notifications:', err);
        res.status(500).json({ message: 'Erro ao buscar histórico de notificações' });
    }
};
