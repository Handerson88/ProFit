const db = require('../config/database');

/**
 * Middleware strictly enforces active subscription status and block state.
 * Allows admins to bypass checks.
 */
const subscriptionMiddleware = async (req, res, next) => {
    try {
        // bypass if admin
        if (req.user && req.user.role === 'admin') {
            return next();
        }

        const userId = req.user.id;
        
        // Fetch current subscription and block status from DB to be 100% sure (backend security rule #12)
        const result = await db.query(
            'SELECT id, subscription_status, is_blocked, role, end_date, created_at, is_early_adopter FROM users WHERE id = $1',
            [userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Usuário não encontrado.' });
        }

        const user = result.rows[0];

        // 0. --- PROMOÇÃO: PRIMEIROS 20 USUÁRIOS (Lógica de liberação total temporária) ---
        // Verifica se o usuário faz parte dos primeiros 20 registros reais
        const userCountRes = await db.query("SELECT COUNT(*) FROM users WHERE role NOT IN ('admin', 'influencer')");
        const totalRealUsers = parseInt(userCountRes.rows[0].count);
        
        const accountCreatedAt = new Date(user.created_at || new Date());
        const daysSinceCreation = (new Date() - accountCreatedAt) / (1000 * 60 * 60 * 24);
        
        let isPromoActive = false;
        // Bypasses: Manual Early Adopter OR System-wide Early Access (First 20 users)
        if (user.is_early_adopter) {
            isPromoActive = true;
            console.log(`[SubscriptionMiddleware] Usuário ${userId} liberado (Hard Early Adopter).`);
        } else if (totalRealUsers <= 20) {
            isPromoActive = true;
            console.log(`[SubscriptionMiddleware] Liberado via Early Access (Total usuários: ${totalRealUsers}).`);
        }
        // -------------------------------------------------------------------------------

        // 1. Check if user is manually blocked
        if (user.is_blocked) {
            return res.status(403).json({ 
                message: 'Sua conta está bloqueada.', 
                code: 'ACCOUNT_BLOCKED' 
            });
        }

        // Se a promoção estiver ativa para este usuário, bypass nos próximos checks
        if (isPromoActive) {
            return next();
        }

        // 2. Check if subscription is active
        if (user.subscription_status !== 'ativo') {
            return res.status(403).json({ 
                message: 'Seu plano expirou ou não está ativo.', 
                code: 'SUBSCRIPTION_REQUIRED' 
            });
        }

        // 3. Check if subscription is expired by date
        if (user.end_date && new Date(user.end_date) < new Date()) {
            return res.status(403).json({ 
                message: 'Seu plano expirou.', 
                code: 'SUBSCRIPTION_EXPIRED' 
            });
        }

        // All checks passed
        next();
    } catch (error) {
        console.error('[SubscriptionMiddleware] Error:', error);
        res.status(500).json({ message: 'Erro ao verificar assinatura.' });
    }
};

module.exports = subscriptionMiddleware;
