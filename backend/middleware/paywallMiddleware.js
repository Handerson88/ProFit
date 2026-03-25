const db = require('../config/database');

module.exports = async (req, res, next) => {
  try {
    // 1. Skip check for admins
    if (req.user && req.user.role === 'admin') {
      return next();
    }

    // 2. Fetch current user plan status
    const userResult = await db.query('SELECT plan, subscription_status FROM users WHERE id = $1', [req.user.id]);
    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    const { plan, subscription_status } = userResult.rows[0];

    // 3. Strict Subscription Check
    if (subscription_status !== 'active') {
      return res.status(403).json({ 
        message: 'Assinatura Necessária', 
        error: 'SUBSCRIPTION_REQUIRED',
        code: 'PAYWALL_ACTIVE'
      });
    }

    // 4. Plan Type Check
    if (plan !== 'pro' && plan !== 'premium') {
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
