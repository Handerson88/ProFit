const db = require('../config/database');
const { v4: uuidv4 } = require('uuid');
const emailService = require('../services/emailService');

/**
 * ProFit Elite - Payment Controller
 * Suporta M-Pesa e e-Mola (Moçambique)
 */

exports.createPayment = async (req, res) => {
  try {
    const userId = req.user.id;
    const { amount, method, phone } = req.body;

    // Verificar desconto de indicação (Referral)
    const userRes = await db.query('SELECT discount_earned, discount_used FROM users WHERE id = $1', [userId]);
    const user = userRes.rows[0];
    let finalAmount = Number(amount);
    let appliedDiscount = false;

    if (user && user.discount_earned && !user.discount_used) {
        finalAmount = Number(amount) * 0.7; // 30% de desconto
        appliedDiscount = true;
        console.log(`[PAYMENT] Desconto de 30% aplicado para o usuário ${userId}. Valor original: ${amount}, Novo valor: ${finalAmount}`);
    }


    if (!amount || !method || !phone) {
      return res.status(400).json({ message: 'Amount, method and phone are required' });
    }

    const paymentId = uuidv4();
    const transactionId = 'TX' + Math.random().toString(36).substring(2, 10).toUpperCase();

    // 1. Registrar intenção de pagamento no banco
    await db.query(`
      INSERT INTO payments (id, user_id, amount, method, phone, transaction_id, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
    `, [paymentId, userId, finalAmount, method, phone, transactionId, 'pending']);

    const useSimulation = process.env.USE_PAYMENT_SIMULATION === 'true';

    if (useSimulation) {
        console.log(`[PAYMENT SIMULATION] Iniciando cobrança de ${finalAmount} via ${method} para ${phone}`);
        
        // Simulação: Aprovado automaticamente após 10 segundos
        setTimeout(async () => {
            try {
                await db.query(
                    "UPDATE payments SET status = 'approved', updated_at = CURRENT_TIMESTAMP WHERE id = $1",
                    [paymentId]
                );
                // Atualizar plano para elite
                await db.query(
                    "UPDATE users SET plan_type = 'elite' WHERE id = $1",
                    [userId]
                );

                // Marcar usuário como tendo pago (has_paid = true) para bônus de indicação
                await db.query("UPDATE users SET has_paid = true WHERE id = $1", [userId]);

                // Marcar desconto como usado se foi aplicado (fluxo antigo de 30%)
                if (appliedDiscount) {
                    await db.query("UPDATE users SET discount_used = true WHERE id = $1", [userId]);
                    // Tentar marcar na nova tabela de descontos também
                    await db.query("UPDATE discounts SET is_used = true WHERE user_id = $1 AND is_used = false LIMIT 1", [userId]);
                }

                // 🏅 LÓGICA DE INDICAÇÃO v2 (50% OFF por 10 pagantes)
                const currentUserRes = await db.query("SELECT referred_by FROM users WHERE id = $1", [userId]);
                const referrerId = currentUserRes.rows[0].referred_by;

                if (referrerId) {
                    const countRes = await db.query(
                        "SELECT COUNT(*) FROM users WHERE referred_by = $1 AND has_paid = true", 
                        [referrerId]
                    );
                    const payingReferrals = parseInt(countRes.rows[0].count);

                    // Se atingiu 10 pagantes, concede 50% de desconto
                    if (payingReferrals >= 10) {
                        const discountCheck = await db.query(
                            "SELECT id FROM discounts WHERE user_id = $1 AND percentage = 50 AND is_used = false",
                            [referrerId]
                        );
                        
                        if (discountCheck.rows.length === 0) {
                            await db.query(
                                "INSERT INTO discounts (id, user_id, percentage) VALUES ($1, $2, $3)",
                                [uuidv4(), referrerId, 50]
                            );
                            
                            // Enviar email de bônus real!
                            const referrerUserRes = await db.query("SELECT id, name, email FROM users WHERE id = $1", [referrerId]);
                            if (referrerUserRes.rows.length > 0) {
                                // Usamos a função de milestone de email atualizada para o novo bônus
                                emailService.sendReferralMilestoneEmail(referrerUserRes.rows[0], 50).catch(e => console.error('[PAYMENT] Erro email bonus:', e));
                            }
                        }
                    }
                }


                // Enviar email de sucesso
                const userEmailRes = await db.query('SELECT name, email FROM users WHERE id = $1', [userId]);
                if (userEmailRes.rows.length > 0) {
                    await emailService.sendPaymentApprovedEmail(userEmailRes.rows[0], finalAmount);
                }
                
                console.log(`[PAYMENT] Pagamento ${paymentId} aprovado via SIMULAÇÃO.`);
            } catch (e) {
                console.error('Erro na aprovação simulada:', e);
                // Em caso de erro real de processamento
                const userRes = await db.query('SELECT name, email FROM users WHERE id = $1', [userId]);
                if (userRes.rows.length > 0) {
                    await emailService.sendPaymentFailedEmail(userRes.rows[0], "Erro técnico no processamento do pagamento.");
                }
            }
        }, 10000);

    } else {
        // --- INTEGRAÇÃO REAL AQUI ---
        // Exemplo para M-Pesa ou e-Mola
        console.log(`[PAYMENT LIVE] Enviando requisição real para ${method}...`);
        
        if (method === 'mpesa') {
            // Aqui você faria o POST para a API do M-Pesa usando:
            // process.env.MPESA_API_KEY
            // process.env.MPESA_SERVICE_PROVIDER_CODE
            // etc...
        } else if (method === 'emola') {
            // Aqui você faria o POST para a API do e-Mola usando:
            // process.env.EMOLA_CLIENT_ID
            // etc...
        }
    }

    res.status(201).json({ 
      id: paymentId, 
      status: 'pending',
      transaction_id: transactionId,
      message: useSimulation ? 'Aguardando (Simulação ativa - 10s)...' : 'Aguardando confirmação no telemóvel...'
    });

  } catch (error) {
    console.error('Error creating payment:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

exports.getPaymentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.query('SELECT * FROM payments WHERE id = $1', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Payment not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching payment status:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
