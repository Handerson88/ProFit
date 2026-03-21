const db = require('../config/database');

module.exports = async (req, res, next) => {
  try {
    // 1. Skip check for admins
    if (req.user && req.user.role === 'admin') {
      return next();
    }

    // 2. Fetch current user plan
    const userResult = await db.query('SELECT plan_type FROM users WHERE id = $1', [req.user.id]);
    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    const { plan_type } = userResult.rows[0];

    // 3. If user is PRO, always allow
    if (plan_type === 'pro') {
      return next();
    }

    // 4. Check total user count (excluding admins)
    const countResult = await db.query("SELECT COUNT(*) FROM users WHERE role = 'user'");
    const totalUsers = parseInt(countResult.rows[0].count);

    // 5. If limit reached (20) and user is FREE, block
    if (totalUsers > 20) {
      return res.status(402).json({ 
        message: 'Free limit reached', 
        error: 'PAYWALL_ACTIVE',
        total_users: totalUsers
      });
    }

    // 6. Otherwise allow
    next();
  } catch (err) {
    console.error('[PaywallMiddleware] Error:', err);
    res.status(500).json({ message: 'Internal server error during paywall check' });
  }
};
