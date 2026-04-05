const db = require('../config/database');

module.exports = async (req, res, next) => {
  try {
    // 1. Skip check for admins
    if (req.user && req.user.role === 'admin') {
      return next();
    }

    const userId = req.user.id;

    // 2. Fetch current user status
    const result = await db.query(
      'SELECT id, plan, subscription_status, is_blocked, created_at, is_early_adopter FROM users WHERE id = $1', 
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
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
        console.log(`[PaywallMiddleware] Usuário ${userId} liberado (Hard Early Adopter).`);
    } else if (totalRealUsers <= 20) {
        isPromoActive = true;
        console.log(`[PaywallMiddleware] Liberado via Early Access (Total usuários: ${totalRealUsers}).`);
    }
    // -------------------------------------------------------------------------------

    // 1. Check if blocked
    if (user.is_blocked) {
      return res.status(403).json({ message: 'Account blocked', code: 'ACCOUNT_BLOCKED' });
    }

    // Se a promoção estiver ativa para este usuário, bypass nos próximos checks
    if (isPromoActive) {
      return next();
    }

    // 3. Strict Subscription Check
    if (user.subscription_status !== 'ativo') {
      return res.status(403).json({ 
        message: 'Assinatura Necessária', 
        error: 'SUBSCRIPTION_REQUIRED',
        code: 'PAYWALL_ACTIVE'
      });
    }

    // 4. Plan Type Check (Admins and Influencers already bypassed above or in general flow)
    if (user.plan !== 'pro' && user.plan !== 'premium' && user.plan !== 'PRO' && user.plan !== 'PREMIUM') {
      return res.status(403).json({ 
        message: 'Recurso Premium', 
        error: 'PREMIUM_PLAN_REQUIRED',
        code: 'PAYWALL_ACTIVE'
      });
    }

    // 5. Otherwise allow
    next();
  } catch (err) {
    console.error('[PaywallMiddleware] Error:', err);
    res.status(500).json({ message: 'Internal server error during paywall check' });
  }
};

