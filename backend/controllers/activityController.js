const db = require('../config/database');
const { v4: uuidv4 } = require('uuid');

exports.logActivity = async (req, res) => {
  try {
    const userId = req.user.id;
    const { action, details } = req.body;

    if (!action) {
      return res.status(400).json({ message: 'Action is required' });
    }

    await db.query(`
      INSERT INTO user_activity_logs (id, user_id, action, details)
      VALUES ($1, $2, $3, $4)
    `, [uuidv4(), userId, action, details ? JSON.stringify(details) : null]);

    // Send a 201 Created but don't strictly require the frontend to wait on this for UI updates
    res.status(201).json({ message: 'Activity logged' });
  } catch (error) {
    console.error('Error logging activity:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
