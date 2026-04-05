const paymentService = require('../services/paymentService');
const emailService = require('../services/emailService');
const fs = require('fs');
const path = require('path');
const db = require('../config/database');
const crypto = require('crypto');

exports.initiatePayment = async (req, res) => {
    try {
        const userId = req.user ? req.user.id : null;
        const { phone, method, couponCode, plan, email } = req.body;
        
        if (!phone || !method || !email) {
            return res.status(400).json({ message: 'Telefone, e-mail e método (M-Pesa/e-Mola) são obrigatórios.' });
        }

        // Base price based on plan
        let baseAmount = plan === 'anual' ? 2490 : 299;
        let amount = baseAmount;
        let couponId = null;

        // 1. Check if user already used a coupon before (Strict Section 6)
        let userHasUsed = false;
        if (userId) {
            const userRes = await db.query('SELECT has_used_coupon FROM users WHERE id = $1', [userId]);
            userHasUsed = userRes.rows.length > 0 && userRes.rows[0].has_used_coupon;
        } else {
            // Check by email for guests
            const emailRes = await db.query('SELECT has_used_coupon FROM users WHERE email = $1', [email.toLowerCase()]);
            userHasUsed = emailRes.rows.length > 0 && emailRes.rows[0].has_used_coupon;
        }

        // Apply coupon if provided
        if (couponCode) {
            // Block if already used ANY coupon
            if (userHasUsed) {
                return res.status(403).json({ 
                    message: 'Este cupom não é mais válido para sua conta ou e-mail. Você já utilizou um benefício promocional anteriormente.' 
                });
            }

            const couponRes = await db.query(
                'SELECT * FROM coupons WHERE code = $1 AND active = true',
                [couponCode.toUpperCase()]
            );

            if (couponRes.rows.length === 0) {
                return res.status(404).json({ message: 'Cupom inválido ou inativo.' });
            }

            const coupon = couponRes.rows[0];
            const now = new Date();
            
            // 3. Check expiration
            if (coupon.expires_at && new Date(coupon.expires_at) < now) {
                return res.status(400).json({ message: 'Este cupom expirou.' });
            }

            // 4. Check max uses
            if (coupon.max_uses && coupon.used_count >= coupon.max_uses) {
                return res.status(400).json({ message: 'Este cupom atingiu o limite de usos.' });
            }

            // 5. Check if user already used THIS specific coupon (extra safety)
            const usageCheck = await db.query(
                'SELECT * FROM coupon_usages WHERE coupon_id = $1 AND user_id = $2',
                [coupon.id, userId]
            );

            if (usageCheck.rows.length > 0) {
                return res.status(400).json({ 
                    message: 'Você já utilizou este cupom.' 
                });
            }

            couponId = coupon.id;
            if (coupon.discount_type === 'percent') {
                amount = Math.max(0, baseAmount * (1 - coupon.discount_value / 100));
            } else if (coupon.discount_type === 'fixed') {
                amount = Math.max(0, baseAmount - coupon.discount_value);
            }
            console.log(`[Payment] Cupom ${couponCode} aplicado ao plano ${plan || 'mensal'}. Novo valor: ${amount} MZN`);
        } else {
            console.log(`[Payment] Processando plano ${plan || 'mensal'} sem cupom. Valor: ${amount} MZN`);
        }
        
        // Iniciando pagamento
        const result = await paymentService.iniciarPagamento(userId, phone, method, amount, couponId);
        
        // MODO SIMULAÇÃO: Se ativo, confirma automaticamente após um curtíssimo atraso (Modo Teste)
        if (process.env.USE_PAYMENT_SIMULATION === 'true') {
            const delay = 500; // Quase instantâneo (0.5s)
            console.log(`[TEST MODE] Auto-confirmando pagamento para user: ${userId} em ${delay}ms...`);
            setTimeout(async () => {
                try {
                    await paymentService.confirmarPagamento(userId, amount, result.transactionId);
                    console.log(`[TEST MODE] ✅ Pagamento TESTE confirmado com sucesso para TX: ${result.transactionId}`);
                } catch (err) {
                    console.error('[TEST MODE] ❌ Erro na auto-confirmação:', err);
                }
            }, delay);
        }

        res.status(200).json(result);
    } catch (error) {
        console.error('Initiate Payment Error:', error);
        res.status(500).json({ message: 'Erro ao iniciar pagamento.', error: error.message });
    }
};

exports.webhook = async (req, res) => {
    console.log('[Webhook Pagamento] Dados recebidos:', JSON.stringify(req.body));
    
    try {
        // 1. Signature Validation (Security)
        const signature = req.headers['x-debito-signature'];
        const webhookSecret = process.env.DEBITO_WEBHOOK_SECRET;

        if (webhookSecret && signature) {
            const hmac = crypto.createHmac('sha256', webhookSecret);
            const digest = hmac.update(JSON.stringify(req.body)).digest('hex');
            
            if (signature !== digest) {
                console.error('[Webhook] Assinatura inválida detectada.');
                return res.status(401).json({ message: 'Invalid signature' });
            }
        }

        // 2. Extract Data (Debito.co.mz format)
        // payload: { status: "COMPLETED", external_id: "TX-...", amount: 299, ... }
        const { status, external_id, amount } = req.body;

        if (!external_id || !status) {
            console.error('[Webhook] Payload incompleto:', req.body);
            return res.status(400).json({ message: 'Faltam dados obrigatórios no webhook.' });
        }

        // 3. Find User by Transaction ID
        const paymentCheck = await db.query('SELECT user_id FROM payments WHERE transaction_id = $1', [external_id]);
        if (paymentCheck.rows.length === 0) {
            console.error('[Webhook] Transação não encontrada no banco:', external_id);
            return res.status(404).json({ message: 'Transação não encontrada.' });
        }

        const userId = paymentCheck.rows[0].user_id;

        if (status === 'COMPLETED' || status === 'SUCCESS') {
            console.log(`[Webhook] Processando sucesso para TX: ${external_id}, User: ${userId}`);
            const result = await paymentService.confirmarPagamento(userId, amount, external_id);
            
            if (result.success) {
                // Additional update (funnel)
                await db.query("UPDATE users SET funnel_step = 'PAID' WHERE id = $1", [userId]);
                return res.status(200).json({ message: 'OK' });
            } else {
                return res.status(500).json({ message: 'Erro ao confirmar no service.' });
            }
        } else {
            // Status different from SUCCESS (FAILED, CANCELLED)
            console.log(`[Webhook] Pagamento não concluído. Status: ${status} para TX: ${external_id}`);
            await db.query("UPDATE payments SET status = $1, updated_at = NOW() WHERE transaction_id = $2", [status, external_id]);
            
            const userRes = await db.query('SELECT email, name FROM users WHERE id = $1', [userId]);
            if (userRes.rows.length > 0) {
                await sendFailureEmail(userRes.rows[0].email, userRes.rows[0].name);
            }
            
            return res.status(200).json({ message: 'Falha processada.' });
        }
    } catch (error) {
        console.error('[Webhook] Falha crítica no processamento:', error);
        return res.status(500).json({ message: 'Erro interno.', error: error.message });
    }
};

exports.getStatus = async (req, res) => {
    const { transactionId } = req.params;
    try {
        // We remove the user_id check here to allow polling from guest checkout sessions
        const result = await db.query(
            'SELECT status FROM payments WHERE transaction_id = $1',
            [transactionId]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Transação não encontrada.' });
        }
        
        res.json({ status: result.rows[0].status });
    } catch (error) {
        console.error('Get status error:', error);
        res.status(500).json({ message: 'Erro ao verificar status.' });
    }
};

async function sendSuccessEmail(email, name) {
    try {
        const templatePath = path.join(__dirname, '../templates/emails/payment-success.html');
        let html = fs.readFileSync(templatePath, 'utf8');
        html = html.replace('{{name}}', name || 'Usuário');
        
        await emailService.sendEmail({
            to: email,
            subject: 'Pagamento confirmado com sucesso',
            html: html
        });
    } catch (error) {
        console.error('Failed to send success email:', error);
    }
}

async function sendFailureEmail(email, name) {
    try {
        const templatePath = path.join(__dirname, '../templates/emails/payment-failed.html');
        let html = fs.readFileSync(templatePath, 'utf8');
        html = html.replace('{{name}}', name || 'Usuário');
        
        await emailService.sendEmail({
            to: email,
            subject: 'Não conseguimos confirmar seu pagamento',
            html: html
        });
    } catch (error) {
        console.error('Failed to send failure email:', error);
    }
}
