const db = require('../config/database');
const emailService = require('../services/emailService');

exports.sendManualBillingEmail = async (req, res) => {
    const { userId } = req.body;

    if (!userId) {
        return res.status(400).json({ message: 'ID do usuário é obrigatório' });
    }

    try {
        const userResult = await db.query('SELECT id, name, email FROM users WHERE id = $1', [userId]);
        
        if (userResult.rows.length === 0) {
            return res.status(404).json({ message: 'Usuário não encontrado' });
        }

        const user = userResult.rows[0];
        const paymentLink = `${process.env.FRONTEND_URL || 'https://myprofittness.com'}/checkout?userId=${user.id}`;

        await emailService.sendBillingEmail(user, paymentLink);

        res.json({ message: 'E-mail de cobrança enviado com sucesso!' });
    } catch (err) {
        console.error('[Billing] Error sending manual email:', err);
        res.status(500).json({ message: 'Erro ao enviar e-mail de cobrança' });
    }
};

exports.getBillingStatus = async (req, res) => {
    try {
        const result = await db.query(`
            SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN payment_status = 'paid' THEN 1 ELSE 0 END) as paid,
                SUM(CASE WHEN payment_status = 'pending' THEN 1 ELSE 0 END) as pending,
                SUM(CASE WHEN payment_status = 'overdue' THEN 1 ELSE 0 END) as overdue
            FROM users
        `);
        res.json(result.rows[0]);
    } catch (err) {
        console.error('[Billing] Error fetching status:', err);
        res.status(500).json({ message: 'Erro ao buscar status de pagamentos' });
    }
};
