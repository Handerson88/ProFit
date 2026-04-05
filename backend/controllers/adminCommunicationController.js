const db = require('../config/database');
const emailService = require('../services/emailService');
const webPushService = require('../services/webPushService');

/**
 * Send manual communication (Immediate)
 * POST /api/admin/communication/send
 */
exports.sendManualCommunication = async (req, res) => {
    const { type, target, subject, content, buttonText, buttonLink, title, message, body, userId, userIds } = req.body;

    if (!type || !target) {
        return res.status(400).json({ message: 'Tipo e público são obrigatórios.' });
    }

    try {
        if (type === 'email') {
            // Robust Validation
            if (!subject || subject.trim() === '') {
                return res.status(400).json({ message: 'O assunto do e-mail é obrigatório.' });
            }
            if (!content || content.trim() === '') {
                return res.status(400).json({ message: 'O conteúdo (HTML) do e-mail é obrigatório.' });
            }

            const results = await emailService.sendGroupEmail(target, subject, content, buttonText, buttonLink, userIds);
            
            if (!results.success) {
                return res.status(400).json({ 
                    message: results.message || 'Falha ao enviar e-mails.',
                    details: results.errors 
                });
            }

            return res.json({ 
                message: `E-mails enviados com sucesso para ${results.sent} usuários.`,
                data: results 
            });
        } else if (type === 'push') {
            const finalTitle = title || subject;
            const finalMessage = message || body || content;

            if (!finalTitle || finalTitle.trim() === '') {
                return res.status(400).json({ message: 'O título da notificação é obrigatório.' });
            }
            if (!finalMessage || finalMessage.trim() === '') {
                return res.status(400).json({ message: 'A mensagem da notificação é obrigatória.' });
            }

            const results = await webPushService.sendGroupPush(target, finalTitle, finalMessage, {}, userId, userIds);
            return res.json({ 
                message: 'Notificações push enviadas com sucesso.',
                data: results 
            });
        }

        res.status(400).json({ message: 'Tipo de comunicação inválido.' });
    } catch (err) {
        console.error('[AdminCommunication] Error sending manual:', err);
        // Propagate Resend specific errors if they exist in err.message
        const errorMessage = err.message || 'Erro ao processar envio.';
        res.status(500).json({ message: errorMessage });
    }
};

/**
 * Schedule a communication
 * POST /api/admin/communication/schedule
 */
exports.scheduleCommunication = async (req, res) => {
    const { type, target, scheduledAt, title, body, subject, content, buttonText, buttonLink } = req.body;

    if (!type || !target || !scheduledAt) {
        return res.status(400).json({ message: 'Tipo, público e data são obrigatórios.' });
    }

    // Validation for schedules
    if (type === 'email') {
        if (!subject || subject.trim() === '') return res.status(400).json({ message: 'Assunto obrigatório.' });
        if (!content || content.trim() === '') return res.status(400).json({ message: 'Conteúdo obrigatório.' });
    } else {
        if (!title || title.trim() === '') return res.status(400).json({ message: 'Título obrigatório.' });
        if (!body || body.trim() === '') return res.status(400).json({ message: 'Mensagem obrigatória.' });
    }

    try {
        const finalTitle = type === 'email' ? subject : title;
        const finalContent = type === 'email' ? content : body;

        await db.query(`
            INSERT INTO scheduled_communications (type, target, title, content, button_text, button_link, scheduled_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
        `, [type, target, finalTitle, finalContent, buttonText || null, buttonLink || null, scheduledAt]);

        res.json({ message: 'Comunicação agendada com sucesso.' });
    } catch (err) {
        console.error('[AdminCommunication] Error scheduling:', err);
        res.status(500).json({ message: 'Erro ao agendar comunicação.' });
    }
};

/**
 * Get scheduled communications
 * GET /api/admin/communication/scheduled
 */
exports.getScheduledCommunications = async (req, res) => {
    try {
        const { rows } = await db.query(`
            SELECT * FROM scheduled_communications 
            WHERE status = 'pending' 
            ORDER BY scheduled_at ASC
        `);
        res.json(rows);
    } catch (err) {
        console.error('[AdminCommunication] Error fetching scheduled:', err);
        res.status(500).json({ message: 'Erro ao carregar agendamentos.' });
    }
};

/**
 * Delete a scheduled communication
 * DELETE /api/admin/communication/scheduled/:id
 */
exports.deleteScheduledCommunication = async (req, res) => {
    const { id } = req.params;
    try {
        await db.query("DELETE FROM scheduled_communications WHERE id = $1", [id]);
        res.json({ message: 'Agendamento removido.' });
    } catch (err) {
        console.error('[AdminCommunication] Error deleting scheduled:', err);
        res.status(500).json({ message: 'Erro ao remover agendamento.' });
    }
};

/**
 * Get communication history
 * GET /api/admin/communication/history
 */
exports.getHistory = async (req, res) => {
    try {
        // Fetch last 50 emails
        const { rows: emailHistory } = await db.query(`
            SELECT 'email' as type, email_type as sub_type, status, details, created_at as sent_at, u.name as user_name, email_type as title
            FROM email_logs el
            LEFT JOIN users u ON el.user_id = u.id
            ORDER BY created_at DESC LIMIT 50
        `);

        // Fetch last 50 push notifications
        const { rows: notificationHistory } = await db.query(`
            SELECT 'push' as type, notification_type as sub_type, status, details, sent_at, u.name as user_name, title, message
            FROM notification_logs nl
            LEFT JOIN users u ON nl.user_id = u.id
            ORDER BY sent_at DESC LIMIT 50
        `);

        // Fetch last 50 executed schedules
        const { rows: scheduledHistory } = await db.query(`
            SELECT type, 'scheduled' as sub_type, status, 'Agendamento Executado' as details, scheduled_at as sent_at, 'Múltiplos' as user_name, title, content as message
            FROM scheduled_communications
            WHERE status != 'pending'
            ORDER BY scheduled_at DESC LIMIT 50
        `);

        // Merge, sort, and slice
        const combined = [...emailHistory, ...notificationHistory, ...scheduledHistory]
            .sort((a, b) => new Date(b.sent_at) - new Date(a.sent_at))
            .slice(0, 100);

        res.json(combined);
    } catch (err) {
        console.error('[AdminCommunication] Error fetching history:', err);
        res.status(500).json({ message: 'Erro ao buscar histórico.' });
    }
};
