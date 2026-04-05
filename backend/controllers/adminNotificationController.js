const db = require('../config/database');
const { v4: uuidv4 } = require('uuid');
const notificationController = require('./notificationController');

exports.sendNotification = async (req, res) => {
    const { title, message, type, recipientType, userId } = req.body;
    const io = req.app.get('socketio');

    try {
        const count = await notificationController.sendToRecipientType(io, {
            title,
            message,
            type,
            recipientType,
            userId
        });

        res.status(201).json({ message: 'Notificação enviada com sucesso', count });
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

// Schedule a notification for later
exports.scheduleNotification = async (req, res) => {
    const { title, message, type, recipientType, userId, scheduledAt } = req.body;

    if (!scheduledAt) {
        return res.status(400).json({ message: 'Data e hora de agendamento são obrigatórias' });
    }

    try {
        const id = uuidv4();
        await db.query(
            `INSERT INTO scheduled_notifications (id, title, message, type, recipient_type, user_id, scheduled_at, status)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
            [id, title, message, type, recipientType, recipientType === 'specific' ? userId : null, scheduledAt, 'pending']
        );

        res.status(201).json({ message: 'Notificação agendada com sucesso', id });
    } catch (err) {
        console.error('Error scheduling notification:', err);
        res.status(500).json({ message: 'Erro ao agendar notificação' });
    }
};

// Get pending scheduled notifications
exports.getScheduledNotifications = async (req, res) => {
    try {
        const result = await db.query(`
            SELECT s.*, u.name as user_name 
            FROM scheduled_notifications s 
            LEFT JOIN users u ON s.user_id = u.id 
            WHERE s.status = 'pending'
            ORDER BY s.scheduled_at ASC
        `);
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching scheduled notifications:', err);
        res.status(500).json({ message: 'Erro ao buscar notificações agendadas' });
    }
};

// Delete/Cancel a scheduled notification
exports.deleteScheduledNotification = async (req, res) => {
    const { id } = req.params;
    try {
        const result = await db.query('DELETE FROM scheduled_notifications WHERE id = $1 AND status = $2 RETURNING *', [id, 'pending']);
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Agendamento não encontrado ou já processado' });
        }
        res.json({ message: 'Agendamento cancelado com sucesso' });
    } catch (err) {
        console.error('Error deleting scheduled notification:', err);
        res.status(500).json({ message: 'Erro ao cancelar agendamento' });
    }
};

// Test automated notification trigger
exports.testAutomatedPush = async (req, res) => {
    const { title, message } = req.body;
    const io = req.app.get('socketio');
    const cronService = require('../services/cronService');

    try {
        await cronService.sendPushNotification(io, {
            title: title || 'Teste Automático',
            message: message || 'Esta é uma notificação de teste do sistema.',
            type: 'info'
        });
        res.json({ success: true, message: 'Notificação automatizada disparada com sucesso.' });
    } catch (err) {
        console.error('Test automated push error:', err);
        res.status(500).json({ error: 'Erro ao disparar teste.' });
    }
};
