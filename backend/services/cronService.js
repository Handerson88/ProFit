const cron = require('node-cron');
const db = require('../config/database');
const { v4: uuidv4 } = require('uuid');
const notificationController = require('../controllers/notificationController');
const emailService = require('./emailService');
const { getMaputoNow } = require('../utils/dateUtils');

/**
 * Initializes all automated cron jobs for notifications
 */
exports.initCronJobs = (io) => {
    console.log('--- Initializing Automated Notification Cron Jobs (Africa/Maputo) ---');

    const MAPUTO_TZ = "Africa/Maputo";

    // 1. 08:00 – Café da manhã (Mata-bicho)
    cron.schedule('0 8 * * *', async () => {
        console.log('[Cron] Running Personalized Breakfast Reminder...');
        await sendSmartReminder(io, 'breakfast', [
            'Comece bem o seu dia ☀️ Registre seu mata-bicho agora!',
            'Pequenas escolhas de manhã fazem grandes resultados 💪 Registre sua refeição.',
            'Registre o seu mata-bicho e deixe nossa IA analisar sua refeição 💪'
        ], 'Bom dia! ☀️ Hora do mata-bicho');
    }, { scheduled: true, timezone: MAPUTO_TZ });

    // 2. 12:00 – Almoço
    cron.schedule('0 12 * * *', async () => {
        console.log('[Cron] Running Personalized Lunch Reminder...');
        await sendSmartReminder(io, 'lunch', [
            'Seu almoço define sua energia ⚡ Registre agora!',
            'Já almoçou? 🍽️ Não esqueça de registrar e melhorar sua dieta.',
            'Hora do almoço! 🍽️ Vamos analisar sua refeição e ajudar no seu equilíbrio.'
        ], 'Hora do almoço! 🍽️');
    }, { scheduled: true, timezone: MAPUTO_TZ });

    // 3. 15:00 – Hidratação (Sempre envia)
    cron.schedule('0 15 * * *', async () => {
        console.log('[Cron] Running Personalized Hydration Reminder...');
        await sendSmartReminder(io, 'water', [
            'Água = energia 💧 Beba agora!',
            'Seu corpo agradece 💙 Hora de hidratar.'
        ], 'Hora de beber água 💧', true);
    }, { scheduled: true, timezone: MAPUTO_TZ });

    // 4. 19:00 – Jantar
    cron.schedule('0 19 * * *', async () => {
        console.log('[Cron] Running Personalized Dinner Reminder...');
        await sendSmartReminder(io, 'dinner', [
            'Feche o dia com disciplina 🌙 Registre seu jantar',
            'Última refeição do dia 🍽️ Vamos manter o foco!'
        ], 'Hora do jantar 🍽️');
    }, { scheduled: true, timezone: MAPUTO_TZ });

    // 5. Automated Billing Reminders for Overdue Users (10:00 AM)
    cron.schedule('0 10 * * *', async () => {
        console.log('[Cron] Running Overdue Billing Check...');
        try {
            const result = await db.query(
                "SELECT id, name, email FROM users WHERE payment_status = 'overdue' AND subscription_active = false"
            );

            for (const user of result.rows) {
                const paymentLink = `${process.env.FRONTEND_URL || 'https://myprofittness.com'}/checkout?userId=${user.id}`;
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
            // A. Deactivate Expired Plans & Block Access (ETAPA 6 & 9)
            const expiredRes = await db.query(`
                UPDATE users 
                SET plano_status = 'inativo',
                    is_blocked = true,
                    funnel_step = 'EXPIRED'
                WHERE plano_status = 'ativo'
                  AND data_expiracao <= CURRENT_TIMESTAMP
                RETURNING id, name, email
            `);

            // Also update the subscription status in the subscriptions table
            if (expiredRes.rows.length > 0) {
                await db.query(`
                    UPDATE subscriptions 
                    SET status = 'expired'
                    WHERE status = 'active' 
                      AND end_date <= CURRENT_TIMESTAMP
                `);
            }

            for (const user of expiredRes.rows) {
                console.log(`[Cron] Subscription EXPIRED and user BLOCKED: ${user.email}`);
                // Send push
                await notificationController.sendPushToUser(user.id, {
                    title: 'Seu plano expirou 😢',
                    body: 'Seu acesso PRO expirou. Renove agora para continuar usando todas as funcionalidades sem interrupções 💪',
                    data: { type: 'subscription_expired', url: '/checkout' }
                }, io);
                // Send email
                await emailService.sendSubscriptionExpiredEmail(user);
                // Log notification in DB
                await db.query(
                    'INSERT INTO notifications (id, user_id, title, message, type) VALUES ($1, $2, $3, $4, $5)',
                    [uuidv4(), user.id, 'Plano Expirado', 'Seu plano PRO expirou. Acesso bloqueado até a renovação.', 'warning']
                );
            }

            // B. Reminders (3 days, 1 day) (ETAPA 7: ANTES DE EXPIRAR)
            const intervals = [3, 1];
            for (const days of intervals) {
                const intervalStr = `${days} days`;
                const reminderRes = await db.query(`
                    SELECT id, name, email, data_expiracao 
                    FROM users
                    WHERE plano_status = 'ativo' 
                      AND DATE(data_expiracao) = CURRENT_DATE + INTERVAL '${intervalStr}'
                `);

                for (const user of reminderRes.rows) {
                    const title = '⚠️ Sua assinatura está vencendo';
                    const body = `Seu plano ProFit expira em ${days} ${days === 1 ? 'dia' : 'dias'}. Renove agora para garantir que sua jornada não pare! 💪`;

                    console.log(`[Cron] Sending ${days}-day expiry reminder to: ${user.email}`);
                    
                    // Send push
                    await notificationController.sendPushToUser(user.id, {
                        title: title,
                        body: body,
                        data: { type: 'subscription_reminder', url: '/checkout' }
                    }, io);

                    // Send email
                    await emailService.sendSubscriptionReminderEmail(user, days, user.data_expiracao);

                    // Log in-app notification
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

    /**
     * Helper to send personalized reflections based on user state
     */
    async function sendSmartReminder(io, type, messages, defaultTitle, alwaysSend = false) {
        try {
            const users = await db.query("SELECT id, name, email FROM users WHERE notifications_enabled = true AND role = 'user' AND is_active = true");
            
            for (const user of users.rows) {
                // Skip if meal already logged today (only for food types)
                if (!alwaysSend) {
                    const mealCheck = await db.query(
                        "SELECT id FROM meals WHERE user_id = $1 AND meal_type = $2 AND (date AT TIME ZONE 'UTC' AT TIME ZONE 'Africa/Maputo')::date = CURRENT_DATE",
                        [user.id, type]
                    );
                    if (mealCheck.rows.length > 0) {
                        console.log(`[Cron] Skipping ${type} for ${user.email} (already logged)`);
                        continue;
                    }
                }

                const firstName = user.name ? user.name.split(' ')[0] : 'Campeão';
                const randomMsg = messages[Math.floor(Math.random() * messages.length)];
                const personalizedMsg = `${firstName}, ${randomMsg.charAt(0).toLowerCase() + randomMsg.slice(1)}`;
                const title = `${firstName}, ${defaultTitle.charAt(0).toLowerCase() + defaultTitle.slice(1)}`;

                // Send push
                await notificationController.sendPushToUser(user.id, {
                    title: title,
                    body: personalizedMsg,
                    data: { type: 'reminder', meal_type: type, url: '/add-meal' }
                }, io);

                // Send email
                await emailService.sendUsageReminderEmail(user);

                // Log in DB for history
                await db.query(
                    'INSERT INTO notifications (id, user_id, title, message, type) VALUES ($1, $2, $3, $4, $5)',
                    [uuidv4(), user.id, title, personalizedMsg, 'info']
                );
            }
        } catch (err) {
            console.error(`[Cron] Error in ${type} reminder:`, err);
        }
    }

    // 7. Unified Scheduled Communications Check (Every minute)
    cron.schedule('* * * * *', async () => {
        try {
            const now = getMaputoNow().toDate();
            const pendingComms = await db.query(
                "SELECT * FROM scheduled_communications WHERE status = 'pending' AND scheduled_at <= $1",
                [now]
            );

            for (const comm of pendingComms.rows) {
                console.log(`[Cron] Processing scheduled ${comm.type}: ${comm.title || 'No Title'}`);
                try {
                    // Update status to processing
                    await db.query("UPDATE scheduled_communications SET status = 'sending' WHERE id = $1", [comm.id]);

                    if (comm.type === 'push') {
                        // Send push via existing notificationController logic
                        const notificationController = require('../controllers/notificationController');
                        await notificationController.sendToRecipientType(io, {
                            title: comm.title,
                            message: comm.content,
                            type: 'info',
                            recipientType: comm.target,
                            userId: null
                        });
                    } else if (comm.type === 'email') {
                        // Send email via emailService
                        await emailService.sendGroupEmail(
                            comm.target, 
                            comm.title, 
                            comm.content, 
                            comm.button_text, 
                            comm.button_link
                        );
                    }

                    await db.query("UPDATE scheduled_communications SET status = 'sent' WHERE id = $1", [comm.id]);
                } catch (err) {
                    console.error(`[Cron] Failed to send scheduled ${comm.type} ${comm.id}:`, err);
                    await db.query("UPDATE scheduled_communications SET status = 'failed', details = $1 WHERE id = $1", [err.message, comm.id]);
                }
            }
        } catch (err) {
            console.error('[Cron] Scheduled Communications Check Error:', err);
        }
    }, { scheduled: true, timezone: MAPUTO_TZ });
};

/**
 * Reusable function to send push notifications and save to DB
 */
exports.sendPushNotification = async (io, payload) => {
    try {
        console.log(`[Push] Sending automated reach: "${payload.title}"`);
        
        const notificationId = uuidv4();
        await db.query(
            'INSERT INTO notifications (id, title, message, type, sent_to_all) VALUES ($1, $2, $3, $4, $5)',
            [notificationId, payload.title, payload.message, payload.type || 'info', true]
        );

        if (io) {
            io.emit('new_notification', {
                id: notificationId,
                title: payload.title,
                message: payload.message,
                type: payload.type || 'info',
                sent_to_all: true,
                created_at: getMaputoNow().toDate()
            });
        }

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
