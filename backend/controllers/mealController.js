const { analyzeFoodImage } = require('../services/openaiService');
const db = require('../config/database');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const crypto = require('crypto');

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
       WHERE user_id = $1 AND date::date = $2::date`,
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
    // For Vercel/MemoryStorage, req.file.path is undefined. Use buffer.
    const imageBuffer = req.file.buffer;
    // placeholder or base64 if needed, but for scan logic imageUrl is minimal
    const imageUrl = req.body.image_url || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c'; 
    console.log('--- START MEAL SCAN ---');
    console.log('User ID:', user_id);
    console.log('File details:', {
      fieldname: req.file.fieldname,
      originalname: req.file.originalname,
      encoding: req.file.encoding,
      mimetype: req.file.mimetype,
      path: req.file.path,
      size: req.file.size
    });
    
    // 1. Fetch user scan limits and current usage
    const userRes = await db.query(
      'SELECT daily_calorie_target, scan_limit_per_day, scans_used_today, last_scan_date, plan_type FROM users WHERE id = $1', 
      [user_id]
    );
    const user = userRes.rows[0];
    const goal = user?.daily_calorie_target || 2000;
    const planType = user?.plan_type || 'free';
    let scanLimit = user?.scan_limit_per_day || 3;
    let scansUsedToday = user?.scans_used_today || 0;
    const lastScanDate = user?.last_scan_date;
    
    // Check if monetization is enabled (app-wide)
    const appStatusRes = await db.query('SELECT COUNT(*) FROM users');
    const totalUsers = parseInt(appStatusRes.rows[0].count);
    const monetizationEnabled = totalUsers >= 20;
    
    // Automatic Reset Logic
    const todayStr = new Date().toISOString().split('T')[0];
    const lastScanDateStr = lastScanDate ? new Date(lastScanDate).toISOString().split('T')[0] : null;

    if (lastScanDateStr !== todayStr) {
      console.log('--- DAILY RESET: Starting new day for user ---');
      scansUsedToday = 0;
      await db.query(
        'UPDATE users SET scans_used_today = 0, last_scan_date = CURRENT_TIMESTAMP WHERE id = $1',
        [user_id]
      );
    }

    // Check if limit reached
    // Rules:
    // 1. Only check if monetization is enabled app-wide (>= 20 users)
    // 2. Only check if user is not on a 'pro' or 'elite' plan
    const isPremiumUser = planType === 'pro' || planType === 'elite';

    if (monetizationEnabled && !isPremiumUser && scansUsedToday >= scanLimit) {
      console.log('BLOCK: Daily scan limit reached for user');
      return res.status(403).json({ 
        status: 'LIMIT_REACHED',
        message: 'Você atingiu o limite diário de scans do plano atual. Volte amanhã ou atualize seu plano.',
        limit: scanLimit,
        used: scansUsedToday
      });
    }

    console.log(`User goal: ${goal}, Scans used: ${scansUsedToday}/${scanLimit}`);

    // 2. Fetch today's total calories consumed (for UI)
    const today = new Date().toISOString().split('T')[0];
    const dailyRes = await db.query(
      'SELECT calories FROM daily_calories WHERE user_id = $1 AND date = $2',
      [user_id, today]
    );
    const currentTotal = Number(dailyRes.rows[0]?.calories || 0);
    console.log('Current total calories today:', currentTotal);

    // 3. Generate Image Hash for Memory (MD5)
    console.log('Generating image hash...');
    const imageHash = crypto.createHash('md5').update(imageBuffer).digest('hex');
    console.log('Image Hash:', imageHash);

    // 4. Check Food Memory Cache
    console.log('Checking food memory...');
    const memoryRes = await db.query(
      'SELECT id, food_name, calories, protein, carbs, fat, ingredients, nutrition_observation FROM food_memory WHERE image_hash = $1 LIMIT 1',
      [imageHash]
    );

    let analysis;
    let isFromCache = false;

    if (memoryRes.rows.length > 0) {
      console.log('CACHE HIT! Reusing data from memory.');
      analysis = memoryRes.rows[0];
      isFromCache = true;
    } else {
      console.log('CACHE MISS. Calling OpenAI Vision...');
      // 5. Analyze with OpenAI Vision
      analysis = await analyzeFoodImage(imageBuffer);
      console.log('AI Analysis result received:', !!analysis);

      // 5.1 Check for image quality
      if (analysis.is_quality_good === false) {
        return res.status(422).json({
          status: 'QUALITY_ERROR',
          message: analysis.quality_message || 'Qualidade da imagem insuficiente para análise.',
          tips: [
            'Use boa iluminação',
            'Evite sombras fortes',
            'Centralize o prato na imagem',
            'Aproxime a câmera da comida'
          ]
        });
      }

      // 6. Save to Food Memory
      console.log('Saving to food memory for future use...');
      const saveMemoryRes = await db.query(
        'INSERT INTO food_memory (image_hash, food_name, calories, protein, carbs, fat, ingredients, nutrition_observation) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id',
        [
          imageHash, 
          analysis.dish_name || analysis.meal_name || analysis.food_name, 
          analysis.calories, 
          analysis.protein, 
          analysis.carbs, 
          analysis.fat,
          JSON.stringify(analysis.ingredients || []),
          analysis.nutrition_observation || analysis.recommendation
        ]
      );
      analysis.id = saveMemoryRes.rows[0].id;
    }

    const mealCalories = Number(analysis.calories || 0);
    const expectedTotal = currentTotal + mealCalories;
    
    // 4. Determine Status
    let status = 'GREEN';
    let message = 'Você ainda está dentro da sua meta diária.';
    
    if (expectedTotal > goal) {
      status = 'RED';
      message = 'Você ultrapassou sua meta diária de calorias.';
    } else if (expectedTotal > (goal * 0.8)) {
      status = 'YELLOW';
      message = 'Atenção! Você está próximo da sua meta diária de calorias.';
    }

    // 7. Save to Scanned Dishes for Admin Panel & AUTOMATICALLY to User Meals
    try {
      // Use a transaction for these related updates
      await db.query('BEGIN');

      // 7.1 Increment user scan count
      await db.query(
        'UPDATE users SET scans_used_today = scans_used_today + 1, last_scan_date = CURRENT_TIMESTAMP WHERE id = $1',
        [user_id]
      );

      // 7.1.5 Update AI detected foods memory
      if (analysis.ingredients) {
        upsertAIDetectedFoods(analysis.ingredients).catch(e => console.error('AI Memory Background Error:', e));
      }

      // 7.2 Save for Admin View / History of Scans (Not active meal)
      const dishId = uuidv4();
      const dishName = analysis.dish_name || analysis.meal_name || analysis.food_name;
      const ingredientsJson = JSON.stringify(analysis.ingredients || []);
      
      await db.query(
        `INSERT INTO scanned_dishes (id, user_id, dish_name, image_url, calories, protein, carbs, fat, ingredients, scan_source)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [
          dishId, 
          user_id, 
          dishName, 
          imageUrl, 
          mealCalories, 
          Number(analysis.protein || 0), 
          Number(analysis.carbs || 0), 
          Number(analysis.fat || 0),
          ingredientsJson,
          'camera' 
        ]
      );

      await db.query('COMMIT');
      console.log('SCAN: Analysis recorded in scanned_dishes.');

      // 7.3 Notify Admins in real-time
      try {
        const io = req.app.get('socketio');
        if (io) {
          // Get user info for the admin notification
          const userMeta = await db.query('SELECT name, email FROM users WHERE id = $1', [user_id]);
          const user = userMeta.rows[0];
          
          io.to('admin_room').emit('new_scanned_dish', {
            id: dishId,
            user_id,
            user_name: user?.name || 'Usuário',
            user_email: user?.email || '',
            dish_name: dishName,
            image_url: imageUrl,
            calories: mealCalories,
            protein: Number(analysis.protein || 0),
            carbs: Number(analysis.carbs || 0),
            fat: Number(analysis.fat || 0),
            ingredients: analysis.ingredients || [],
            scan_source: 'camera',
            created_at: new Date()
          });
        }
      } catch (socketErr) {
        console.error('Admin socket emission failed:', socketErr);
      }

    } catch (saveErr) {
      await db.query('ROLLBACK');
      console.error('CRITICAL: Scan recording failed:', saveErr);
    }

    // Return enriched analysis
    const finalResponse = {
      ...analysis,
      dish_name: analysis.dish_name || analysis.food_name || analysis.meal_name, 
      meal_name: analysis.dish_name || analysis.food_name || analysis.meal_name,
      ingredients: analysis.ingredients || [],
      nutrition_observation: analysis.nutrition_observation || analysis.recommendation || '',
      image_url: imageUrl,
      calorie_status: {
        status,
        message,
        goal,
        current_total: currentTotal,
        expected_total: expectedTotal,
        remaining: Math.max(0, goal - expectedTotal),
        excess: Math.max(0, expectedTotal - goal)
      },
      is_from_cache: isFromCache
    };

    console.log('DEBUG: Final Backend Response:', JSON.stringify(finalResponse, null, 2));
    res.json(finalResponse);

    // Check achievements
    const achievementController = require('./achievementController');
    achievementController.checkAchievements(user_id, 'scan_count');
    achievementController.checkAchievements(user_id, 'streak_days');
  } catch (err) {
    console.error('CRITICAL MEAL SCAN ERROR:', err);
    res.status(500).json({ 
      message: 'Falha ao analisar refeição',
      detail: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
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

  const dateStr = new Date().toISOString().split('T')[0];

  try {
    // 1. Log the individual meal with full details
    await db.query(
      'INSERT INTO meals (id, user_id, food_name, meal_name, calories, protein, carbs, fat, quantity, meal_type, image_url, ingredients, nutrition_observation, date) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, CURRENT_TIMESTAMP)',
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
        req.body.nutrition_observation || req.body.recommendation || ''
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
  const dateStr = req.query.date || new Date().toISOString().split('T')[0];
  
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
       WHERE user_id = $1 AND (DATE(date) = $2 OR date::date = $2)
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
       WHERE user_id = $1 AND (DATE(date) = $2 OR date::date = $2)`,
      [user_id, dateStr]
    );

    const dailyTotals = {
      calories: Number(totalsResult.rows[0]?.calories || 0),
      protein: Number(totalsResult.rows[0]?.protein || 0),
      carbs: Number(totalsResult.rows[0]?.carbs || 0),
      fat: Number(totalsResult.rows[0]?.fat || 0)
    };

    const mealsResult = await db.query(
      `SELECT * FROM meals WHERE user_id = $1 AND (DATE(date) = $2 OR date::date = $2) ORDER BY created_at DESC`,
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
        TO_CHAR(date, 'Dy') as day,
        SUM(calories) as calories
       FROM meals 
       WHERE user_id = $1 
       AND date >= CURRENT_DATE - INTERVAL '6 days'
       GROUP BY day, DATE(date)
       ORDER BY DATE(date) ASC`,
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
      query += ' AND DATE(date) = $2';
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
      "SELECT SUM(calories) as total FROM meals WHERE user_id = $1 AND DATE(date) = $2",
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
