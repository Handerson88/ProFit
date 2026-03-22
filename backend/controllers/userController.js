const db = require('../config/database');
const fs = require('fs');
const path = require('path');

exports.getProfile = async (req, res) => {
  const user_id = req.user.id;
  try {
    const userResult = await db.query('SELECT * FROM users WHERE id = $1', [user_id]);
    if (userResult.rows.length === 0) return res.status(404).json({ message: 'User not found' });
    
    const user = userResult.rows[0];
    
    // Contagem de referências que pagaram (Lógica Referral v2)
    const referralCountRes = await db.query(
        'SELECT COUNT(*) FROM users WHERE referred_by = $1 AND has_paid = true',
        [user_id]
    );
    user.paying_referrals_count = parseInt(referralCountRes.rows[0].count);
    
    // Buscar descontos ativos (Lógica Referral v2)
    const discountsRes = await db.query(
        'SELECT * FROM discounts WHERE user_id = $1 AND is_used = false ORDER BY percentage DESC',
        [user_id]
    );
    user.active_discounts = discountsRes.rows;
    
    res.json(user);
  } catch (err) {
    console.error('[UserController] Fetch profile error:', err);
    res.status(500).json({ message: 'Failed to fetch profile' });
  }
};

exports.updateProfile = async (req, res) => {
  const user_id = req.user.id;
  const { name, email, age, weight, height, goal, daily_calorie_target, plan_type } = req.body;
  try {
    await db.query(
      `UPDATE users SET 
        name = $1, 
        email = $2,
        age = $3, 
        weight = $4, 
        height = $5, 
        goal = $6,
        daily_calorie_target = $7,
        plan_type = COALESCE($8, plan_type)
       WHERE id = $9`,
      [name, email, age, weight, height, goal, daily_calorie_target, plan_type, user_id]
    );
    res.json({ message: 'Profile updated successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Update failed' });
  }
};

exports.submitQuiz = async (req, res) => {
  const user_id = req.user.id;
  const { age, gender, height, current_weight, goal, activity_level, target_weight, daily_calorie_target } = req.body;
  
  try {
    // Sanitização e formatação rigorosa para evitar "invalid input syntax for type integer/numeric"
    let parsedAge = Math.round(Number(age)) || 0;
    
    // Tratamento realista para altura (Se o usuário digitar 1.78 ou 1,78 -> converte para 178 cm)
    let parsedHeight = Number(String(height).replace(',', '.'));
    if (parsedHeight > 0 && parsedHeight <= 3) {
       parsedHeight = parsedHeight * 100;
    }
    parsedHeight = Math.round(parsedHeight) || 0; // Garante que seja um Integer limpo
    
    // Arredonda pesos caso o banco de dados esteja como INTEGER em versões antigas
    let parsedWeight = Math.round(Number(String(current_weight).replace(',', '.'))) || 0;
    let parsedTargetWeight = Math.round(Number(String(target_weight).replace(',', '.'))) || 0;

    let final_calorie_target = Math.round(Number(daily_calorie_target));
    if (!final_calorie_target || final_calorie_target < 1200) {
        final_calorie_target = 1200;
    }

    await db.query(
      `UPDATE users SET 
        age = $1, 
        gender = $2, 
        height = $3, 
        weight = $4, 
        goal = $5, 
        activity_level = $6, 
        target_weight = $7, 
        daily_calorie_target = $8 
       WHERE id = $9`,
      [parsedAge, gender, parsedHeight, parsedWeight, goal, activity_level, parsedTargetWeight, final_calorie_target, user_id]
    );

    res.json({ message: 'Quiz completed', daily_calorie_target: final_calorie_target });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to save quiz data: ' + err.message });
  }
};

exports.updateProfilePhoto = async (req, res) => {
  const user_id = req.user.id;
  
  if (!req.file) {
    return res.status(400).json({ message: 'No file uploaded' });
  }

  try {
    // For Vercel, store as Base64 in DB for persistence
    const base64Photo = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
    
    await db.query(
      'UPDATE users SET profile_photo = $1 WHERE id = $2',
      [base64Photo, user_id]
    );

    res.json({ 
      message: 'Foto de perfil atualizada!',
      profile_photo: base64Photo
    });
  } catch (err) {
    console.error('[UserController] Photo upload error:', err);
    res.status(500).json({ message: 'Falha ao atualizar foto de perfil' });
  }
};

exports.updateNotificationSettings = async (req, res) => {
  const user_id = req.user.id;
  const { notifications_enabled } = req.body;
  try {
    await db.query(
      'UPDATE users SET notifications_enabled = $1 WHERE id = $2',
      [notifications_enabled, user_id]
    );
    res.json({ message: 'Notification settings updated' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to update notification settings' });
  }
};

exports.getReferralStats = async (req, res) => {
  const user_id = req.user.id;
  try {
    const result = await db.query(
      'SELECT COUNT(*) FROM users WHERE referred_by = $1 AND has_paid = true',
      [user_id]
    );
    const count = parseInt(result.rows[0].count);
    res.json({ 
      count,
      target: 10,
      is_eligible: count >= 10
    });
  } catch (err) {
    console.error('[UserController] getReferralStats error:', err);
    res.status(500).json({ message: 'Failed to fetch referral stats' });
  }
};

exports.getAppStatus = async (req, res) => {
  try {
    const result = await db.query("SELECT COUNT(*) FROM users WHERE role = 'user'");
    const total_users = parseInt(result.rows[0].count);
    res.json({ 
      total_users,
      paywall_active: total_users > 20,
      limit: 20
    });
  } catch (err) {
    console.error('[UserController] getAppStatus error:', err);
    res.status(500).json({ message: 'Failed to fetch app status' });
  }
};
exports.getDashboardBootstrap = async (req, res) => {
  const user_id = req.user.id;
  const dateStr = req.query.date || new Date().toISOString().split('T')[0];

  try {
    const [
      profileRes,
      notificationsCountRes,
      recentMealsRes,
      weeklyStatsRes,
      dailySummaryRes,
      dailyTotalsRes,
      mealsRes
    ] = await Promise.all([
      // 1. Profile
      db.query('SELECT * FROM users WHERE id = $1', [user_id]),
      // 2. Unread notifications count
      db.query('SELECT COUNT(*) FROM notifications WHERE user_id = $1 AND is_read = false', [user_id]),
      // 3. Recent meals (always fetch global recent regardless of date for the recent list)
      db.query('SELECT * FROM meals WHERE user_id = $1 ORDER BY created_at DESC LIMIT 5', [user_id]),
      // 4. Weekly stats
      db.query(`
        SELECT TO_CHAR(date, 'Dy') as day, SUM(calories) as calories
        FROM meals 
        WHERE user_id = $1 AND date >= CURRENT_DATE - INTERVAL '6 days'
        GROUP BY day, DATE(date)
        ORDER BY DATE(date) ASC
      `, [user_id]),
      // 5. Daily Summary (by meal type)
      db.query(`
        SELECT meal_type, SUM(COALESCE(calories, 0)) as calories, SUM(COALESCE(protein, 0)) as protein, 
               SUM(COALESCE(carbs, 0)) as carbs, SUM(COALESCE(fat, 0)) as fat
        FROM meals WHERE user_id = $1 AND date::date = $2 GROUP BY meal_type
      `, [user_id, dateStr]),
      // 6. Daily Totals
      db.query(`
        SELECT SUM(COALESCE(calories, 0)) as calories, SUM(COALESCE(protein, 0)) as protein, 
               SUM(COALESCE(carbs, 0)) as carbs, SUM(COALESCE(fat, 0)) as fat
        FROM meals WHERE user_id = $1 AND date::date = $2
      `, [user_id, dateStr]),
      // 7. Meals for the specific day
      db.query('SELECT * FROM meals WHERE user_id = $1 AND date::date = $2 ORDER BY created_at DESC', [user_id, dateStr])
    ]);

    const user = profileRes.rows[0];
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Referral logic enrichment (kept from getProfile)
    const referralCountRes = await db.query('SELECT COUNT(*) FROM users WHERE referred_by = $1 AND has_paid = true', [user_id]);
    user.paying_referrals_count = parseInt(referralCountRes.rows[0].count);
    
    const discountsRes = await db.query('SELECT * FROM discounts WHERE user_id = $1 AND is_used = false ORDER BY percentage DESC', [user_id]);
    user.active_discounts = discountsRes.rows;

    res.json({
      profile: user,
      unreadNotificationsCount: parseInt(notificationsCountRes.rows[0].count),
      recentMeals: recentMealsRes.rows,
      weeklyStats: weeklyStatsRes.rows,
      dailySummary: {
        summary: dailySummaryRes.rows,
        totals: {
          calories: Number(dailyTotalsRes.rows[0]?.calories || 0),
          protein: Number(dailyTotalsRes.rows[0]?.protein || 0),
          carbs: Number(dailyTotalsRes.rows[0]?.carbs || 0),
          fat: Number(dailyTotalsRes.rows[0]?.fat || 0)
        },
        meals: mealsRes.rows,
        steps: 0, // Placeholder for future integration
        water: 0  // Placeholder for future integration
      }
    });

  } catch (err) {
    console.error('[UserController] Bootstrap error:', err);
    res.status(500).json({ message: 'Failed to bootstrap dashboard data' });
  }
};
