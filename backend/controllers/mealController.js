const { analyzeFoodImage } = require('../services/openaiService');
const db = require('../config/database');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { getTodayString, formatDate, getMaputoNow } = require('../utils/dateUtils');

/**
 * Normalizes and upserts food names into AI detected memory
 * @param {string[]} ingredients 
 */
async function upsertAIDetectedFoods(ingredients) {
  if (!ingredients || !Array.isArray(ingredients) || ingredients.length === 0) return;

  console.log('--- AI MEMORY: Upserting detected foods ---');
  for (const ingredient of ingredients) {
    try {
      const normalized = ingredient.trim().toLowerCase();
      if (!normalized) continue;

      // PostgreSQL Upsert (Insert or Update on Conflict)
      await db.query(`
        INSERT INTO ai_detected_foods (name, count, last_detected_at)
        VALUES ($1, 1, CURRENT_TIMESTAMP)
        ON CONFLICT (name) 
        DO UPDATE SET 
          count = ai_detected_foods.count + 1,
          last_detected_at = CURRENT_TIMESTAMP
      `, [normalized]);
      
      console.log(`AI MEMORY: Updated "${normalized}"`);
    } catch (err) {
      console.error(`AI MEMORY ERROR: Failed to upsert "${ingredient}":`, err.message);
    }
  }
}

/**
 * Re-calculates and synchronizes daily_logs for a specific user and date
 * @param {string} user_id 
 * @param {string} date YYYY-MM-DD
 */
async function syncDailyLog(user_id, date) {
  try {
    console.log(`--- SYNC DAILY LOG: user ${user_id} on ${date} ---`);
    
    // 1. Sum all meals for this user on this date
    const result = await db.query(
      `SELECT 
        SUM(calories) as total_calories,
        SUM(protein) as total_protein,
        SUM(carbs) as total_carbs,
        SUM(fat) as total_fat
       FROM meals 
       WHERE user_id = $1 AND (date AT TIME ZONE 'UTC' AT TIME ZONE 'Africa/Maputo')::date = $2::date`,
      [user_id, date]
    );

    const totals = result.rows[0];
    const calories = Math.round(parseFloat(totals.total_calories || 0));
    const protein = Math.round(parseFloat(totals.total_protein || 0));
    const carbs = Math.round(parseFloat(totals.total_carbs || 0));
    const fat = Math.round(parseFloat(totals.total_fat || 0));

    // 2. Upsert into daily_logs
    await db.query(`
      INSERT INTO daily_logs (user_id, date, calories, protein, carbs, fat, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)
      ON CONFLICT (user_id, date)
      DO UPDATE SET
        calories = EXCLUDED.calories,
        protein = EXCLUDED.protein,
        carbs = EXCLUDED.carbs,
        fat = EXCLUDED.fat,
        updated_at = EXCLUDED.updated_at
    `, [user_id, date, calories, protein, carbs, fat]);

    console.log(`SYNC DAILY LOG SUCCESS: Cal=${calories}, P=${protein}, C=${carbs}, F=${fat}`);
  } catch (err) {
    console.error('SYNC DAILY LOG ERROR:', err.message);
  }
}

exports.scanMeal = async (req, res) => {
  const user_id = req.user.id;
  
  if (!req.file) {
    return res.status(400).json({ message: 'No image uploaded' });
  }

  try {
    const imageBuffer = req.file.buffer;
    
    // Generate unique filename and save to uploads
    const filename = `meal_${Date.now()}_${uuidv4().substring(0, 8)}.jpg`;
    const uploadPath = path.join(__dirname, '..', 'uploads', filename);
    
    // Ensure directory exists (redundant if already checked, but safe)
    if (!fs.existsSync(path.join(__dirname, '..', 'uploads'))) {
      fs.mkdirSync(path.join(__dirname, '..', 'uploads'), { recursive: true });
    }
    
    await fs.promises.writeFile(uploadPath, imageBuffer);
    const imageUrl = `/uploads/${filename}`;
    
    console.log('--- START MEAL SCAN ---', { user_id, size: req.file.size, savedAs: imageUrl });
    
    // 1. Fetch user scan limits and current usage
    const userRes = await db.query(
      'SELECT daily_calorie_target, scan_limit_per_day, scans_used_today, last_scan_date, plan, subscription_status FROM users WHERE id = $1', 
      [user_id]
    );
    const user = userRes.rows[0];
    const goal = user?.daily_calorie_target || 2000;
    const plan = user?.plan || 'free';
    const subscription_status = user?.subscription_status || 'inactive';
    let scanLimit = user?.scan_limit_per_day || 1; 
    let scansUsedToday = user?.scans_used_today || 0;
    const lastScanDate = user?.last_scan_date;
    
    // Automatic Reset Logic
    const todayStr = getTodayString();
    const lastScanDateStr = lastScanDate ? formatDate(lastScanDate) : null;

    if (lastScanDateStr !== todayStr) {
      scansUsedToday = 0;
      await db.query(
        'UPDATE users SET scans_used_today = 0, last_scan_date = $2 WHERE id = $1',
        [user_id, getMaputoNow().toDate()]
      );
    }

    // Check if limit reached
    const isPremiumUser = subscription_status === 'active' && (plan === 'pro' || plan === 'premium');
    if (!isPremiumUser && scansUsedToday >= scanLimit) {
      return res.status(403).json({ 
        status: 'LIMIT_REACHED',
        message: 'Você atingiu o limite diário de scans do plano gratuito.',
        limit: scanLimit,
        used: scansUsedToday
      });
    }

    // 2. Fetch today's total calories consumed
    const today = getTodayString();
    const dailyRes = await db.query(
      'SELECT calories FROM daily_calories WHERE user_id = $1 AND date = $2',
      [user_id, today]
    );
    const currentTotal = Number(dailyRes.rows[0]?.calories || 0);

    // 3. Analyze with OpenAI
    const imageHash = crypto.createHash('md5').update(imageBuffer).digest('hex');
    const memoryRes = await db.query(
      'SELECT * FROM food_memory WHERE image_hash = $1 LIMIT 1',
      [imageHash]
    );

    let analysis;
    let isFromCache = false;

    if (memoryRes.rows.length > 0) {
      analysis = memoryRes.rows[0];
      isFromCache = true;
    } else {
      analysis = await analyzeFoodImage(imageBuffer);
      if (analysis.is_quality_good === false) {
        return res.status(422).json({
          status: 'QUALITY_ERROR',
          message: analysis.quality_message || 'Qualidade da imagem insuficiente.'
        });
      }

      const saveMemoryRes = await db.query(
        'INSERT INTO food_memory (image_hash, food_name, calories, protein, carbs, fat, ingredients, nutrition_observation) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id',
        [
          imageHash, 
          analysis.dish_name || analysis.meal_name || analysis.food_name, 
          analysis.calories, analysis.protein, analysis.carbs, analysis.fat,
          JSON.stringify(analysis.ingredients || []),
          analysis.nutrition_observation || analysis.recommendation
        ]
      );
      analysis.id = saveMemoryRes.rows[0].id;
    }

    const mealCalories = Number(analysis.calories || 0);
    const expectedTotal = currentTotal + mealCalories;
    
    // Status Logic
    let status = 'GREEN';
    let message = 'Dentro da meta.';
    if (expectedTotal > goal) { status = 'RED'; message = 'Meta ultrapassada.'; }
    else if (expectedTotal > (goal * 0.8)) { status = 'YELLOW'; message = 'Perto da meta.'; }

    // 7. Save Scan Usage and Technical Log
    try {
      await db.query('BEGIN');

      await db.query(
        'UPDATE users SET scans_used_today = scans_used_today + 1, last_scan_date = $2 WHERE id = $1',
        [user_id, getMaputoNow().toDate()]
      );

      if (analysis.ingredients) {
        upsertAIDetectedFoods(analysis.ingredients).catch(e => console.error('AI Memory Background Error:', e));
      }

      const dishId = uuidv4();
      const dishName = analysis.dish_name || analysis.meal_name || analysis.food_name;
      const ingredientsJson = JSON.stringify(analysis.ingredients || []);
      
      await db.query(
        `INSERT INTO scanned_dishes (id, user_id, dish_name, image_url, calories, protein, carbs, fat, ingredients, scan_source)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [dishId, user_id, dishName, imageUrl, mealCalories, Number(analysis.protein || 0), Number(analysis.carbs || 0), Number(analysis.fat || 0), ingredientsJson, 'camera']
      );

      await db.query('COMMIT');

      // 8. Socket Notification for scan completion (not meal added)
      const io = req.app.get('socketio');
      if (io) {
        // We only notify that a scan was performed, not that a meal was added yet
        // Since addMeal will trigger the meal_added event later
        io.to('admin_room').emit('new_scanned_dish', { id: dishId, user_id, dish_name: dishName, image_url: imageUrl, calories: mealCalories, created_at: getMaputoNow().toDate() });
      }

    } catch (saveErr) {
      await db.query('ROLLBACK');
      console.error('Scan recording failed:', saveErr);
    }

    res.json({
      ...analysis,
      dish_name: analysis.dish_name || analysis.food_name || analysis.meal_name, 
      image_url: imageUrl,
      calorie_status: { status, message, goal, current_total: currentTotal, expected_total: expectedTotal },
      is_from_cache: isFromCache
    });

  } catch (err) {
    console.error('CRITICAL MEAL SCAN ERROR:', err);
    res.status(500).json({ 
      message: 'O Coach está analisando muitos pratos agora. Tente novamente em alguns segundos para uma análise de elite.', 
      detail: err.message 
    });
  }
};

exports.addMeal = async (req, res) => {
  const { food_name, meal_name, calories, protein, carbs, fat, quantity, meal_type, image_url, ingredients } = req.body;
  const user_id = req.user.id;
  
  // Robust Number parsing to avoid NaN errors in PostgreSQL
  const mealCalories = Math.round(Number(calories)) || 0;
  const parsedProtein = Number(protein) || 0;
  const parsedCarbs = Number(carbs) || 0;
  const parsedFat = Number(fat) || 0;
  const parsedQuantity = Number(quantity) || 1;

  const dateStr = getTodayString();

  try {
    // 1. Log the individual meal with full details
    await db.query(
      'INSERT INTO meals (id, user_id, food_name, meal_name, calories, protein, carbs, fat, quantity, meal_type, image_url, ingredients, nutrition_observation, date) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)',
      [
        uuidv4(), 
        user_id, 
        food_name, 
        meal_name || food_name, 
        mealCalories, 
        parsedProtein, 
        parsedCarbs, 
        parsedFat, 
        parsedQuantity, 
        meal_type || 'Manual', 
        image_url, 
        JSON.stringify(ingredients || []), 
        req.body.nutrition_observation || req.body.recommendation || '',
        getMaputoNow().toDate()
      ]
    );

    // 2. Upsert daily summary
    await db.query(
      `INSERT INTO daily_calories (id, user_id, date, calories)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (user_id, date) 
       DO UPDATE SET calories = daily_calories.calories + EXCLUDED.calories`,
      [uuidv4(), user_id, dateStr, mealCalories]
    );

    res.status(201).json({ message: 'Meal logged successfully' });

    // Notify via Socket
    try {
      const io = req.app.get('socketio');
      if (io) {
        io.to(`user_${user_id}`).emit('meal_added', { 
          message: 'Refeição registrada!',
          meal_name: meal_name || food_name,
          calories: mealCalories
        });
      }
    } catch (socketErr) {
      console.error('Socket emission failed:', socketErr);
    }

    // Check achievements
    const achievementController = require('./achievementController');
    achievementController.checkAchievements(user_id, 'scan_count');
    achievementController.checkAchievements(user_id, 'streak_days');

    // 3. Trigger Real Push Notification Alert (Async)
    try {
      const { sendPushToUser } = require('./notificationController');
      
      // Calculate today's status again to see if we reached a threshold
      const userRes = await db.query('SELECT daily_calorie_target FROM users WHERE id = $1', [user_id]);
      const goal = userRes.rows[0]?.daily_calorie_target || 2000;
      
      const dailyRes = await db.query(
        'SELECT calories FROM daily_calories WHERE user_id = $1 AND date = $2',
        [user_id, dateStr]
      );
      const total = Number(dailyRes.rows[0]?.calories || 0);

      if (total > goal) {
        await sendPushToUser(user_id, {
          title: '🚨 Limite Ultrapassado!',
          body: `Você ultrapassou sua meta diária hoje (${total} kcal). Tente manter o equilíbrio nas próximas refeições.`
        });
      } else if (total > (goal * 0.9)) {
        await sendPushToUser(user_id, {
          title: '⚠️ Meta Quase Atingida',
          body: `Atenção! Você está muito próximo do seu limite diário de calorias.`
        });
      }
    } catch (pushErr) {
      console.error('Push Alert Error:', pushErr);
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to log meal' });
  }
};

exports.getRecentMeals = async (req, res) => {
  const user_id = req.user.id;
  try {
    const result = await db.query(
      `SELECT * FROM meals 
       WHERE user_id = $1 
       ORDER BY created_at DESC 
       LIMIT 5`,
      [user_id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to fetch recent meals' });
  }
};

exports.getCalorieHistory = async (req, res) => {
  const user_id = req.user.id;
  try {
    const result = await db.query(
      `SELECT date, calories 
       FROM daily_calories 
       WHERE user_id = $1 
       ORDER BY date DESC 
       LIMIT 7`,
      [user_id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to fetch calorie history' });
  }
};

exports.getDailySummary = async (req, res) => {
  const user_id = req.user.id;
  const dateStr = req.query.date || getTodayString();
  
  try {
    console.log(`--- FETCHING SUMMARY for user ${user_id} on date ${dateStr} ---`);
    const result = await db.query(
      `SELECT 
        meal_type,
        SUM(COALESCE(calories, 0)) as calories,
        SUM(COALESCE(protein, 0)) as protein,
        SUM(COALESCE(carbs, 0)) as carbs,
        SUM(COALESCE(fat, 0)) as fat
       FROM meals 
       WHERE user_id = $1 AND (date AT TIME ZONE 'UTC' AT TIME ZONE 'Africa/Maputo')::date = $2::date
       GROUP BY meal_type`,
      [user_id, dateStr]
    );

    console.log(`Summary rows found: ${result.rows.length}`);
    if (result.rows.length > 0) {
      console.log('Sample summary row:', JSON.stringify(result.rows[0]));
    }

    const totalsResult = await db.query(
      `SELECT 
        SUM(COALESCE(calories, 0)) as calories,
        SUM(COALESCE(protein, 0)) as protein,
        SUM(COALESCE(carbs, 0)) as carbs,
        SUM(COALESCE(fat, 0)) as fat
       FROM meals 
       WHERE user_id = $1 AND (date AT TIME ZONE 'UTC' AT TIME ZONE 'Africa/Maputo')::date = $2::date`,
      [user_id, dateStr]
    );

    const dailyTotals = {
      calories: Number(totalsResult.rows[0]?.calories || 0),
      protein: Number(totalsResult.rows[0]?.protein || 0),
      carbs: Number(totalsResult.rows[0]?.carbs || 0),
      fat: Number(totalsResult.rows[0]?.fat || 0)
    };

    const mealsResult = await db.query(
      `SELECT * FROM meals WHERE user_id = $1 AND (date AT TIME ZONE 'UTC' AT TIME ZONE 'Africa/Maputo')::date = $2::date ORDER BY created_at DESC`,
      [user_id, dateStr]
    );

    res.json({
      summary: result.rows,
      meals: mealsResult.rows,
      steps: 0,
      water: 0,
      dailyTotals
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to fetch daily summary' });
  }
};

exports.getWeeklyStats = async (req, res) => {
  const user_id = req.user.id;
  try {
    const result = await db.query(
      `SELECT 
        TO_CHAR(date AT TIME ZONE 'UTC' AT TIME ZONE 'Africa/Maputo', 'Dy') as day,
        SUM(calories) as calories,
        (date AT TIME ZONE 'UTC' AT TIME ZONE 'Africa/Maputo')::date as full_date
       FROM meals 
       WHERE user_id = $1 
       AND (date AT TIME ZONE 'UTC' AT TIME ZONE 'Africa/Maputo')::date >= ((now() AT TIME ZONE 'UTC' AT TIME ZONE 'Africa/Maputo')::date - INTERVAL '6 days')
       GROUP BY day, full_date
       ORDER BY full_date ASC`,
      [user_id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to fetch weekly stats' });
  }
};

exports.getHistory = async (req, res) => {
  const user_id = req.user.id;
  const { date } = req.query;
  
  try {
    let query = 'SELECT * FROM meals WHERE user_id = $1';
    let params = [user_id];

    if (date) {
      query += " AND (date AT TIME ZONE 'UTC' AT TIME ZONE 'Africa/Maputo')::date = $2::date";
      params.push(date);
    }

    query += ' ORDER BY date DESC';
    
    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to fetch history' });
  }
};
exports.updateMeal = async (req, res) => {
  const user_id = req.user.id;
  const { id } = req.params;
  const { meal_name, calories, protein, carbs, fat, meal_type } = req.body;

  try {
    const check = await db.query('SELECT date FROM meals WHERE id = $1 AND user_id = $2', [id, user_id]);
    if (check.rows.length === 0) return res.status(404).json({ message: 'Refeição não encontrada' });

    const dateStr = check.rows[0].date.toISOString().split('T')[0];

    await db.query(
      `UPDATE meals SET 
        meal_name = $1, 
        calories = $2, 
        protein = $3, 
        carbs = $4, 
        fat = $5,
        meal_type = $6
       WHERE id = $7 AND user_id = $8`,
      [meal_name, calories, protein, carbs, fat, meal_type, id, user_id]
    );

    await syncDailyCalories(user_id, dateStr);
    await syncDailyLog(user_id, dateStr); // Sync daily log after update

    res.json({ message: 'Refeição atualizada com sucesso' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erro ao atualizar refeição' });
  }
};

exports.deleteMeal = async (req, res) => {
  const user_id = req.user.id;
  const { id } = req.params;

  try {
    const check = await db.query('SELECT date FROM meals WHERE id = $1 AND user_id = $2', [id, user_id]);
    if (check.rows.length === 0) return res.status(404).json({ message: 'Refeição não encontrada' });

    const dateStr = check.rows[0].date.toISOString().split('T')[0];

    await db.query('DELETE FROM meals WHERE id = $1 AND user_id = $2', [id, user_id]);

    await syncDailyCalories(user_id, dateStr);
    await syncDailyLog(user_id, dateStr); // Sync daily log after deletion

    res.json({ message: 'Refeição removida com sucesso' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erro ao remover refeição' });
  }
};

async function syncDailyCalories(userId, dateStr) {
  try {
    const result = await db.query(
      "SELECT SUM(calories) as total FROM meals WHERE user_id = $1 AND (date AT TIME ZONE 'UTC' AT TIME ZONE 'Africa/Maputo')::date = $2::date",
      [userId, dateStr]
    );
    const total = result.rows[0].total || 0;
    
    await db.query(
      `INSERT INTO daily_calories (id, user_id, date, calories) 
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (user_id, date) DO UPDATE SET calories = $4`,
      [uuidv4(), userId, dateStr, total]
    );
  } catch (err) {
    console.error('Error syncing daily calories:', err);
  }
}
