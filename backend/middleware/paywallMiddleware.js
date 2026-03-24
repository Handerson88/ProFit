const db = require('../config/database');

module.exports = async (req, res, next) => {
  try {
    // 1. Skip check for admins
    if (req.user && req.user.role === 'admin') {
      return next();
    }

    // 2. Fetch current user plan status
    const userResult = await db.query('SELECT plan_type, plan_status FROM users WHERE id = $1', [req.user.id]);
    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    const { plan_type, plan_status } = userResult.rows[0];

    // 3. Strict Subscription Check
    // If user is PRO but status is NOT active, block access
    if (plan_type === 'pro' && plan_status !== 'active') {
      return res.status(402).json({ 
        message: 'Subscription expired', 
        error: 'SUBSCRIPTION_EXPIRED'
      });
    }

    // 4. If user is FREE (or any other non-pro type), block premium features
    // (Assuming this middleware is only applied to premium routes)
    if (plan_type !== 'pro') {
      return res.status(402).json({ 
        message: 'Premium feature requires PRO plan', 
        error: 'PAYWALL_ACTIVE'
      });
    }

    // 5. Otherwise allow
    next();
  } catch (err) {
    console.error('[PaywallMiddleware] Error:', err);
    res.status(500).json({ message: 'Internal server error during paywall check' });
  }
};
