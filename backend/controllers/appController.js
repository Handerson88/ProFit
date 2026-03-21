const db = require('../config/database');

exports.getAppStatus = async (req, res) => {
  try {
    const userCountResult = await db.query('SELECT COUNT(*) FROM users');
    const totalUsers = parseInt(userCountResult.rows[0].count);
    
    // Monetization is enabled if totalUsers >= 20
    const monetizationEnabled = totalUsers >= 20;
    
    res.json({
      totalUsers,
      monetizationEnabled,
      premiumThreshold: 20
    });
  } catch (error) {
    console.error('Error fetching app status:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
