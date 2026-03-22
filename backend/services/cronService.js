const cron = require('node-cron');
const db = require('../config/database');
const { v4: uuidv4 } = require('uuid');
const notificationController = require('../controllers/notificationController');

/**
 * Initializes all automated cron jobs for notifications
 */
exports.initCronJobs = (io) => {
    console.log('--- Initializing Notification Cron Jobs ---');

    // 1. Daily Meal Reminder (Example: 12:00 PM)
    cron.schedule('0 12 * * *', async () => {
        console.log('[Cron] Running Lunch Reminder...');
        await broadcastAutomatedNotification(io, {
            title: 'Hora do Almoço! 🍽️',
            message: 'Que tal registrar sua refeição agora para manter o foco na meta?',
            type: 'info'
        });
    });

    // 2. Evening Check-in (Example: 7:00 PM)
    cron.schedule('0 19 * * *', async () => {
        console.log('[Cron] Running Dinner Reminder...');
        await broadcastAutomatedNotification(io, {
            title: 'Como foi seu dia? 💪',
            message: 'Não esqueça de registrar seu jantar e ver como estão seus macros.',
            type: 'info'
        });
    });

    // 3. Dynamic Scheduled Notifications from Database
    // Check every minute for any scheduled single-shot notifications
    cron.schedule('* * * * *', async () => {
        try {
            const now = new Date();
            const currentTime = now.toTimeString().split(' ')[0]; // HH:MM:SS
            
            const scheduled = await db.query(
                'SELECT * FROM scheduled_notifications WHERE is_active = true AND time <= $1',
                [currentTime]
            );

            // Note: This logic for DB-scheduled tasks is a placeholder. 
            // In a real production environment, you'd need tracking to avoid double-firing.
        } catch (err) {
            console.error('[Cron] DB Scheduled Error:', err);
        }
    });
};

/**
 * Helper to broadcast an automated notification to all users
 */
async function broadcastAutomatedNotification(io, payload) {
    try {
        // 1. Save to DB for all users (This can be expensive, real apps often use a 'global' notification type)
        // For simplicity in this MVP, we save a record that marks it as global
        const notificationId = uuidv4();
        await db.query(
            'INSERT INTO notifications (id, title, message, type, sent_to_all) VALUES ($1, $2, $3, $4, $5)',
            [notificationId, payload.title, payload.message, payload.type, true]
        );

        // 2. Emit via Socket.io to all connected users
        io.emit('new_notification', {
            id: notificationId,
            ...payload,
            sent_to_all: true,
            created_at: new Date()
        });

        // 3. Send Push to all registered devices
        await notificationController.sendPushToAll({
            title: payload.title,
            body: payload.message,
            data: { type: 'automated' }
        });

    } catch (err) {
        console.error('[Cron] Broadcast Error:', err);
    }
}
