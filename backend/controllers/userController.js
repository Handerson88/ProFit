const db = require('../config/database');
const bcrypt = require('bcryptjs');
const emailService = require('../services/emailService');
const fs = require('fs');
const path = require('path');
const { getTodayString } = require('../utils/dateUtils');

exports.getProfile = async (req, res) => {
  const user_id = req.user.id;
  try {
    const userResult = await db.query('SELECT * FROM users WHERE id = $1', [user_id]);
    if (userResult.rows.length === 0) return res.status(404).json({ message: 'User not found' });
    
    const user = userResult.rows[0];
    
    // --- REGRA DE ACESSO INTELIGENTE (20 USUÁRIOS / 30 DIAS) ---
    const userCountResGlobal = await db.query("SELECT COUNT(*) FROM users WHERE role NOT IN ('admin', 'influencer')");
    const totalUsersCount = parseInt(userCountResGlobal.rows[0].count);
    
    // Calcular idade da conta
    const accountCreatedAt = new Date(user.created_at || new Date());
    const daysSinceCreation = (new Date() - accountCreatedAt) / (1000 * 60 * 60 * 24);

    if (totalUsersCount <= 20 && daysSinceCreation <= 30) {
        user.subscription_status = 'ativo';
        user.end_date = null;
        user.data_expiracao = null;
        user.plan_expiration = null;
    }
    // ---------------------------------------------------------
    
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
  const { name, email, age, weight, height, goal, gender, daily_calorie_target, plan_type, theme_preference, ai_language, password, phone, country } = req.body;
  
  // 0. Gender Validation
  if (gender && gender !== 'male' && gender !== 'female' && gender !== 'other') {
    return res.status(400).json({ message: 'Gênero inválido.' });
  }

  // Optional: Password Validation
  if (password && password.length < 6) {
    return res.status(400).json({ message: 'A senha deve ter pelo menos 6 caracteres.' });
  }

  try {
    let passwordQuerySegment = '';
    const queryParams = [name, email, age, weight, height, goal, gender, daily_calorie_target, plan_type, req.body.onboarding_completed, theme_preference, ai_language, phone, country, user_id];
    
    // Hash password se fornecido
    if (password) {
        const hashedPassword = await bcrypt.hash(password, 10);
        queryParams.push(hashedPassword);
        passwordQuerySegment = `, password_hash = $${queryParams.length}`;
    }

    await db.query(
      `UPDATE users SET 
        name = $1, 
        email = $2,
        age = $3, 
        weight = $4, 
        height = $5, 
        goal = $6,
        gender = COALESCE($7, gender),
        daily_calorie_target = $8,
        plan_type = COALESCE($9, plan_type),
        onboarding_completed = COALESCE($10, onboarding_completed),
        theme_preference = COALESCE($11, theme_preference),
        ai_language = COALESCE($12, ai_language),
        phone = COALESCE($13, phone),
        country = COALESCE($14, country)
        ${passwordQuerySegment}
       WHERE id = $15`,
      queryParams
    );
    res.json({ message: 'Profile updated successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Update failed' });
  }
};

exports.submitQuiz = async (req, res) => {
  const user_id = req.user.id;
  const { age, gender, height, current_weight, goal, activity_level, target_weight, daily_calorie_target, blockers, understands_calories, primary_objective } = req.body;

  // 0. Strict Gender Validation
  if (gender !== 'male' && gender !== 'female' && gender !== 'other') {
    return res.status(400).json({ message: 'Gênero inválido. Selecione Masculino, Feminino ou Outro.' });
  }
  
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
        daily_calorie_target = $8,
        blockers = $9,
        primary_objective = $10,
        understands_calories = $11,
        onboarding_completed = true,
        funnel_step = 'QUIZ_COMPLETED'
       WHERE id = $12`,
      [parsedAge, gender, parsedHeight, parsedWeight, goal, activity_level, parsedTargetWeight, final_calorie_target, JSON.stringify(blockers || []), req.body.primary_objective, understands_calories, user_id]
    );

    // Business Logic: First 20 users are FREE
    const userCountRes = await db.query("SELECT COUNT(*) FROM users WHERE role = 'user'");
    const userCount = parseInt(userCountRes.rows[0].count);
    
    let isFreeTier = userCount <= 20;
    
    if (isFreeTier) {
        // Auto-activate for the first 20 users
        await db.query(
            "UPDATE users SET has_paid = true, subscription_status = 'active', plan = 'pro', payment_status = 'PAID', funnel_step = 'PAID' WHERE id = $1",
            [user_id]
        );
    } else {
        // Paywall logic: send funnel email for activation
        try {
            const userRes = await db.query("SELECT email, name FROM users WHERE id = $1", [user_id]);
            if (userRes.rows.length > 0) {
                const html = `<div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
                  <h2>Olá ${userRes.rows[0].name},</h2>
                  <p>Você está a <b>1 passo</b> de acessar o app.</p>
                  <p>Finalize sua ativação do plano <b>ProFit PRO (299 MZN)</b> para continuar seu progresso conosco.</p>
                  <a href="${process.env.FRONTEND_URL || 'https://myprofittness.com'}/plans" style="display:inline-block; padding:10px 20px; background-color:#56AB2F; color:#fff; text-decoration:none; border-radius:5px; margin-top:10px;">Ativar Agora</a>
                </div>`;
                await emailService.sendEmail({
                    to: userRes.rows[0].email,
                    subject: '🚀 Você está quase lá! Finalize sua ativação no ProFit',
                    html: html
                });
            }
        } catch (err) {
            console.error('Falha ao enviar e-mail de ativação do funil:', err);
        }
    }

    res.json({ 
        message: 'Quiz completed', 
        daily_calorie_target: final_calorie_target,
        is_free_tier: isFreeTier 
    });
  } catch (err) {
    console.error('[Quiz] Error saving data:', err);
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
      paywall_active: false, // Removido: agora baseado em assinatura mensal
      limit: 0
    });
  } catch (err) {
    console.error('[UserController] getAppStatus error:', err);
    res.status(500).json({ message: 'Failed to fetch app status' });
  }
};
exports.getDashboardBootstrap = async (req, res) => {
  const user_id = req.user.id;
  const dateStr = req.query.date || getTodayString();

  console.log(`[DashboardBootstrap] Fetching data for user ${user_id} on date ${dateStr}`);
  try {
    console.log('[DashboardBootstrap] Executing parallel queries...');
    const [
      profileRes,
      notificationsCountRes,
      recentMealsRes,
      weeklyStatsRes,
      dailySummaryRes,
      dailyTotalsRes,
      mealsRes,
      workoutPlanRes
    ] = await Promise.all([
      // 1. Profile
      db.query('SELECT * FROM users WHERE id = $1', [user_id]),
      // 2. Unread notifications count
      db.query('SELECT COUNT(*) FROM notifications WHERE user_id = $1 AND is_read = false', [user_id]),
      // 3. Recent meals (always fetch global recent regardless of date for the recent list)
      db.query('SELECT * FROM meals WHERE user_id = $1 ORDER BY created_at DESC LIMIT 5', [user_id]),
      // 4. Weekly Statistics (last 7 days) from daily_logs
      db.query(`
        SELECT TO_CHAR(date AT TIME ZONE 'UTC' AT TIME ZONE 'Africa/Maputo', 'Dy') as day, 
               SUM(COALESCE(calories, 0)) as calories, 
               SUM(COALESCE(protein, 0)) as protein, 
               SUM(COALESCE(carbs, 0)) as carbs, 
               SUM(COALESCE(fat, 0)) as fat, 
               (date AT TIME ZONE 'UTC' AT TIME ZONE 'Africa/Maputo')::date as full_date
        FROM meals 
        WHERE user_id = $1 
        AND (date AT TIME ZONE 'UTC' AT TIME ZONE 'Africa/Maputo')::date >= ((now() AT TIME ZONE 'UTC' AT TIME ZONE 'Africa/Maputo')::date - INTERVAL '6 days')
        GROUP BY day, full_date
        ORDER BY full_date ASC
      `, [user_id]),
      // 5. Daily Summary (by meal type)
      db.query(`
        SELECT meal_type, SUM(COALESCE(calories, 0)) as calories, SUM(COALESCE(protein, 0)) as protein, 
               SUM(COALESCE(carbs, 0)) as carbs, SUM(COALESCE(fat, 0)) as fat
        FROM meals WHERE user_id = $1 AND (date AT TIME ZONE 'UTC' AT TIME ZONE 'Africa/Maputo')::date = $2::date GROUP BY meal_type
      `, [user_id, dateStr]),
      // 6. Daily Totals
      db.query(`
        SELECT SUM(COALESCE(calories, 0)) as calories, SUM(COALESCE(protein, 0)) as protein, 
               SUM(COALESCE(carbs, 0)) as carbs, SUM(COALESCE(fat, 0)) as fat
        FROM meals WHERE user_id = $1 AND (date AT TIME ZONE 'UTC' AT TIME ZONE 'Africa/Maputo')::date = $2::date
      `, [user_id, dateStr]),
      // 7. Meals for the specific day
      db.query("SELECT * FROM meals WHERE user_id = $1 AND (date AT TIME ZONE 'UTC' AT TIME ZONE 'Africa/Maputo')::date = $2::date ORDER BY created_at DESC", [user_id, dateStr]),
      // 8. Active Workout Plan
      db.query('SELECT * FROM workout_plans WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1', [user_id]),
      db.query('SELECT * FROM workout_plans WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1', [user_id])
    ]);
    console.log('[DashboardBootstrap] All queries completed successfully.');

    const user = profileRes.rows[0];
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Referral logic enrichment (kept from getProfile)
    const referralCountRes = await db.query('SELECT COUNT(*) FROM users WHERE referred_by = $1 AND has_paid = true', [user_id]);
    user.paying_referrals_count = parseInt(referralCountRes.rows[0].count);
    
    const discountsRes = await db.query('SELECT * FROM discounts WHERE user_id = $1 AND is_used = false ORDER BY percentage DESC', [user_id]);
    user.active_discounts = discountsRes.rows;
    
    // Use end_date directly from user table
    user.plan_expiration = user.end_date;

    const activeWorkout = workoutPlanRes.rows[0];

    res.json({
      profile: user,
      unreadNotificationsCount: parseInt(notificationsCountRes.rows[0].count),
      recentMeals: recentMealsRes.rows,
      weeklyStats: weeklyStatsRes.rows,
      activeWorkout: activeWorkout,
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
    console.error(`[DashboardBootstrap] ERROR for user ${user_id}:`, err);
    res.status(500).json({ message: 'Failed to bootstrap dashboard data: ' + err.message });
  }
};

exports.updateFunnelStep = async (req, res) => {
    const { step } = req.body;
    try {
        await db.query("UPDATE users SET funnel_step = $1 WHERE id = $2 AND funnel_step != 'PAID'", [step, req.user.id]);
        res.json({ message: 'Funnel step updated globally' });
    } catch(err) {
        console.error('Error updating funnel step:', err);
        res.status(500).json({ message: 'Error updating funnel step' });
    }
};
