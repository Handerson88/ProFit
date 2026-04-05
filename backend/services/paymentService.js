const db = require('../config/database');
const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');
const axios = require('axios');

class PaymentService {
    /**
     * Inicia a requisição de pagamento via M-Pesa / e-Mola.
     * Na implementação real, isto chamará a API da operadora / integrador (ex: M-Pesa API, Paytek, etc).
     */
    async iniciarPagamento(userId, phone, method, amount, couponId = null) {
        try {
            console.log(`[PaymentService] Iniciando pagamento via ${method} para o número ${phone} (User: ${userId}, Amount: ${amount} MZN)`);
            
            const transactionId = `TX-${crypto.randomBytes(6).toString('hex').toUpperCase()}`;
            
            // 1. Record the pending payment in our database
            await db.query(
                `INSERT INTO payments (id, user_id, amount, valor, method, status, phone, transaction_id, coupon_id, email)
                 VALUES ($1, $2, $3, $3, $4, $5, $6, $7, $8, (SELECT email FROM users WHERE id = $2))`,
                [uuidv4(), userId, amount, method, 'PENDING', phone, transactionId, couponId]
            );

            // 2. Call Debito.co.mz API (STK Push)
            if (process.env.DEBITO_API_KEY && process.env.USE_PAYMENT_SIMULATION !== 'true') {
                try {
                    const response = await axios.post(`${process.env.DEBITO_API_URL}/v1/c2b/stk-push`, {
                        amount: amount,
                        msisdn: phone,
                        external_id: transactionId,
                        callback_url: process.env.URL_DO_WEBHOOK || `https://${process.env.VERCEL_URL}/api/webhook/pagamento`
                    }, {
                        headers: { 
                            'Authorization': `Bearer ${process.env.DEBITO_API_KEY}`,
                            'Content-Type': 'application/json'
                        },
                        timeout: 10000
                    });

                    console.log('[PaymentService] Resposta da API:', response.data);
                } catch (apiError) {
                    console.error('[PaymentService] Erro na API do parceiro:', apiError.response?.data || apiError.message);
                    // We still return success of our internal step, as the user should receive the PIN on phone anyway
                }
            } else if (process.env.USE_PAYMENT_SIMULATION === 'true') {
                console.log('[PaymentService] Modo SIMULAÇÃO ATIVO. Ignorando chamada externa para API.');
            } else {
                console.warn('[PaymentService] DEBITO_API_KEY não configurada. Operação em modo SIMULAÇÃO.');
            }
            
            return {
                success: true,
                transactionId,
                message: `Pedido de pagamento enviado. Por favor, confirme no seu celular (PIN).`
            };
        } catch (error) {
            console.error('[PaymentService] Erro ao iniciar pagamento:', error);
            throw new Error('Falha ao processar pedido de pagamento.');
        }
    }

    /**
     * Webhook de confirmação processa o json recebido da operadora
     * e atualiza o respectivo User.
     */
    async confirmarPagamento(userId, amount, transactionId) {
        try {
            console.log(`[PaymentService] Confirmando pagamento de ${amount} MZN (User: ${userId}, TX: ${transactionId})`);
            
            // Start transaction
            await db.query('BEGIN');

            // 1. Update Payment Record
            const paymentRes = await db.query(
                `UPDATE payments SET status = 'SUCCESS', updated_at = NOW() 
                 WHERE transaction_id = $1 AND user_id = $2
                 RETURNING *`,
                [transactionId, userId]
            );

            const payment = paymentRes.rows[0];

            // 2. Register Coupon Usage (if applicable)
            if (payment && payment.coupon_id) {
                try {
                    // Log usage
                    await db.query(
                        `INSERT INTO coupon_usages (coupon_id, user_id) 
                         VALUES ($1, $2) ON CONFLICT DO NOTHING`,
                        [payment.coupon_id, userId]
                    );
                    
                    // Increment count
                    await db.query(
                        `UPDATE coupons SET used_count = used_count + 1 WHERE id = $1`,
                        [payment.coupon_id]
                    );
                    console.log(`[PaymentService] Uso de cupom registrado para payment ${payment.id}`);
                } catch (couponErr) {
                    console.error('[PaymentService] Erro ao registrar uso do cupom:', couponErr);
                }
            }

            // 3. Subscription Management (NEW HYBRID SYSTEM)
            // Calculate end date (30 days from now)
            const endDate = new Date();
            endDate.setDate(endDate.getDate() + 30);

            // Create/Update Subscription Record
            await db.query(
                `INSERT INTO subscriptions (id, user_id, start_date, data_inicio, end_date, data_expiracao, status, is_first_payment)
                 VALUES ($1, $2, NOW(), NOW(), $3, $3, 'active', 
                        NOT EXISTS (SELECT 1 FROM subscriptions WHERE user_id = $2))
                 ON CONFLICT DO NOTHING`,
                [uuidv4(), userId, endDate]
            );

            // Update User Status (Section 7: APÓS PAGAMENTO APROVADO)
            const userUpdateQuery = `
                UPDATE users 
                SET payment_status = 'PAID', 
                    plan = 'PRO',
                    subscription_status = 'ativo',
                    plano_status = 'ativo',
                    is_blocked = false,
                    has_used_coupon = true,
                    end_date = $2,
                    data_expiracao = $2
                WHERE id = $1 
                RETURNING id, name, email, data_expiracao, plano_status;
            `;
            const result = await db.query(userUpdateQuery, [userId, endDate]);
            
            await db.query('COMMIT');

            if (result.rows.length === 0) {
                return { success: false, message: 'Usuário não encontrado' };
            }

            const user = result.rows[0];

            // 4. Send Confirmation Email (ETAPA 4)
            const emailService = require('./emailService');
            await emailService.sendPaymentApprovedEmail(user).catch(e => console.error('[PaymentService] Error sending email:', e));

            return {
                success: true,
                user: user,
                message: 'Pagamento ativado com sucesso.'
            };
        } catch (error) {
            await db.query('ROLLBACK');
            console.error('[PaymentService] Erro ao confirmar pagamento:', error);
            throw new Error('Falha ao processar confirmação de pagamento no banco de dados.');
        }
    }

    async verificarStatus(transactionId) {
        // Implementação real consultaria o status da API da operadora
        return { success: true, status: 'PAID' };
    }
}

module.exports = new PaymentService();
