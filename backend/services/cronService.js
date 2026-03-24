const cron = require('node-cron');
const db = require('../config/database');
const { v4: uuidv4 } = require('uuid');
const notificationController = require('../controllers/notificationController');
const emailService = require('./emailService');

/**
 * Initializes all automated cron jobs for notifications
 */
exports.initCronJobs = (io) => {
    console.log('--- Initializing Automated Notification Cron Jobs (Africa/Maputo) ---');

    const MAPUTO_TZ = "Africa/Maputo";

    // 1. 08:00 – Pequeno-almoço (Matabicho)
    cron.schedule('0 8 * * *', async () => {
        console.log('[Cron] Running Breakfast Reminder (Matabicho)...');
        await this.sendPushNotification(io, {
            title: '🍽️ Hora do Matabicho!',
            message: 'Bom dia! 🌅 Não se esqueça de registrar o seu pequeno-almoço (matabicho) para que a IA possa analisar sua alimentação e ajudar a melhorar sua saúde.',
            type: 'info'
        });
    }, { scheduled: true, timezone: MAPUTO_TZ });

    // 2. 12:00 – Almoço
    cron.schedule('0 12 * * *', async () => {
        console.log('[Cron] Running Lunch Reminder...');
        await this.sendPushNotification(io, {
            title: '🍛 Hora do Almoço!',
            message: 'Já é hora do almoço! 😋 Registre a sua refeição agora e deixe a IA acompanhar sua dieta em tempo real.',
            type: 'info'
        });
    }, { scheduled: true, timezone: MAPUTO_TZ });

    // 3. 15:00 – Hidratação
    cron.schedule('0 15 * * *', async () => {
        console.log('[Cron] Running Hydration Reminder...');
        await this.sendPushNotification(io, {
            title: '💧 Hora de Beber Água!',
            message: 'Lembrete importante! 🚰 Beba água e mantenha-se hidratado. Seu corpo agradece!',
            type: 'info'
        });
    }, { scheduled: true, timezone: MAPUTO_TZ });

    // 4. 19:00 – Jantar
    cron.schedule('0 19 * * *', async () => {
        console.log('[Cron] Running Dinner Reminder...');
        await this.sendPushNotification(io, {
            title: '🍽️ Hora do Jantar!',
            message: 'Hora do jantar! 🌙 Registre sua refeição para manter seu acompanhamento alimentar completo com a IA.',
            type: 'info'
        });
    }, { scheduled: true, timezone: MAPUTO_TZ });

    // 5. Automated Billing Reminders for Overdue Users (10:00 AM)
    cron.schedule('0 10 * * *', async () => {
        console.log('[Cron] Running Overdue Billing Check...');
        try {
            const result = await db.query(
                "SELECT id, name, email FROM users WHERE payment_status = 'overdue' AND subscription_active = false"
            );

            for (const user of result.rows) {
                const paymentLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/checkout?userId=${user.id}`;
                await emailService.sendBillingEmail(user, paymentLink);
                console.log(`[Cron] Billing email sent to overdue user: ${user.email}`);
            }
        } catch (err) {
            console.error('[Cron] Billing Check Error:', err);
        }
    }, { scheduled: true, timezone: MAPUTO_TZ });

    // 6. Daily Subscription Expiration & Reminder Check (09:00 AM)
    cron.schedule('0 9 * * *', async () => {
        console.log('[Cron] Running Subscription Expiration & Reminders Check...');
        try {
            // A. Deactivate Expired Plans
            const expiredRes = await db.query(`
                UPDATE users 
                SET plan_status = 'inactive'
                WHERE plan_type = 'pro' 
                  AND plan_status = 'active' 
                  AND plan_expiration <= CURRENT_TIMESTAMP
                RETURNING id, name, email
            `);

            for (const user of expiredRes.rows) {
                console.log(`[Cron] Plan EXPIRED for user: ${user.email}`);
                // Send push
                await notificationController.sendPushToUser(user.id, {
                    title: 'Seu plano expirou 😢',
                    body: 'Seu acesso PRO expirou. Renove agora para continuar usando todas as funcionalidades sem interrupções 💪',
                    data: { type: 'subscription_expired', click_action: '/plans' }
                }, io);
                // Send email
                await emailService.sendSubscriptionExpiredEmail(user);
                // Log notification in DB
                await db.query(
                    'INSERT INTO notifications (id, user_id, title, message, type) VALUES ($1, $2, $3, $4, $5)',
                    [uuidv4(), user.id, 'Plano Expirado', 'Seu plano PRO expirou. Renove para continuar.', 'warning']
                );
            }

            // B. Reminders (3 days, 1 day, 0 days remaining)
            // Note: INTERVAL '0 days' would be users expiring today
            const intervals = [3, 1, 0];
            for (const days of intervals) {
                const intervalStr = days === 0 ? '0 days' : `${days} days`;
                const reminderRes = await db.query(`
                    SELECT id, name, email, plan_expiration 
                    FROM users 
                    WHERE plan_type = 'pro' 
                      AND plan_status = 'active'
                      AND DATE(plan_expiration) = CURRENT_DATE + INTERVAL '${intervalStr}'
                `);

                for (const user of reminderRes.rows) {
                    const title = days === 0 ? '⚠️ Seu plano expira HOJE' : '⚠️ Seu plano está expirando';
                    const body = days === 0 
                        ? 'Seu plano PRO expira hoje. Renove agora para manter seu acesso sem interrupções!'
                        : `Seu plano PRO expira em ${days} ${days === 1 ? 'dia' : 'dias'}. Renove agora para continuar treinando! 💪`;

                    console.log(`[Cron] Sending ${days}-day reminder to: ${user.email}`);
                    
                    // Send push
                    await notificationController.sendPushToUser(user.id, {
                        title: title,
                        body: body,
                        data: { type: 'subscription_reminder', click_action: '/plans' }
                    }, io);

                    // Send email
                    await emailService.sendSubscriptionReminderEmail(user, days, user.plan_expiration);

                    // Log in-app notification (avoid duplicates if multiple checks run)
                    await db.query(
                        'INSERT INTO notifications (id, user_id, title, message, type) VALUES ($1, $2, $3, $4, $5)',
                        [uuidv4(), user.id, title, body, 'info']
                    );
                }
            }

        } catch (err) {
            console.error('[Cron] Subscription Check Error:', err);
        }
    }, { scheduled: true, timezone: MAPUTO_TZ });
};

/**
 * Reusable function to send push notifications and save to DB
 * (Matches user's requested sendPushNotification structure)
 */
exports.sendPushNotification = async (io, payload) => {
    try {
        console.log(`[Push] Sending automated reach: "${payload.title}"`);
        
        // 1. Save to DB (Global record)
        const notificationId = uuidv4();
        await db.query(
            'INSERT INTO notifications (id, title, message, type, sent_to_all) VALUES ($1, $2, $3, $4, $5)',
            [notificationId, payload.title, payload.message, payload.type || 'info', true]
        );

        // 2. Emit via Socket.io to all online users
        if (io) {
            io.emit('new_notification', {
                id: notificationId,
                title: payload.title,
                message: payload.message,
                type: payload.type || 'info',
                sent_to_all: true,
                created_at: new Date()
            });
        }

        // 3. Send Push via FCM + Web Push (Fallback) to all users with tokens
        await notificationController.sendPushToAll({
            title: payload.title,
            body: payload.message,
            data: { 
                type: 'automated',
                click_action: '/'
            }
        });

        console.log(`[Push] Automated notification broadcasted successfully.`);
    } catch (err) {
        console.error('[Push] Automation Error:', err);
    }
};
