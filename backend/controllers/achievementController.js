const db = require('../config/database');

exports.checkAchievements = async (userId, criteriaType) => {
  try {
    // 1. Get all achievements for this criteria
    const achievements = await db.query(
      'SELECT * FROM achievements WHERE criteria_type = $1',
      [criteriaType]
    );

    // 2. Get user earned achievements
    const earned = await db.query(
      'SELECT achievement_id FROM user_achievements WHERE user_id = $1',
      [userId]
    );
    const earnedIds = new Set(earned.rows.map(r => r.achievement_id));

    for (const ach of achievements.rows) {
      if (earnedIds.has(ach.id)) continue;

      let awarded = false;
      const val = ach.criteria_value;

      if (criteriaType === 'scan_count') {
        const result = await db.query('SELECT COUNT(*) FROM meals WHERE user_id = $1', [userId]);
        if (parseInt(result.rows[0].count) >= val) awarded = true;
      } 
      else if (criteriaType === 'streak_days') {
        // Simple streak check: check if user has meals in the last X days
        const result = await db.query(`
          WITH daily_scan AS (
            SELECT DISTINCT date::date as scan_date
            FROM daily_calories
            WHERE user_id = $1
            ORDER BY scan_date DESC
          )
          SELECT count(*) FROM daily_scan
          WHERE scan_date > CURRENT_DATE - INTERVAL '1 day' * $2
        `, [userId, val + 1]); // Allowing 1 day gap roughly
        
        if (parseInt(result.rows[0].count) >= val) awarded = true;
      }

      if (awarded) {
        await db.query(
          'INSERT INTO user_achievements (user_id, achievement_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
          [userId, ach.id]
        );
        console.log(`Achievement awarded to ${userId}: ${ach.name}`);
        // Optional: Trigger socket notification
      }
    }
  } catch (err) {
    console.error('Error checking achievements:', err);
  }
};

exports.getUserAchievements = async (req, res) => {
  const userId = req.user.id;
  try {
    const result = await db.query(`
      SELECT a.*, ua.earned_at
      FROM achievements a
      JOIN user_achievements ua ON a.id = ua.achievement_id
      WHERE ua.user_id = $1
      ORDER BY ua.earned_at DESC
    `, [userId]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch achievements' });
  }
};

exports.getAllAchievements = async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM achievements ORDER BY criteria_value ASC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch achievements list' });
  }
};
