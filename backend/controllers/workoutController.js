const { generateWorkoutStructuredPlan } = require('../services/openaiService');
const db = require('../config/database');
const { v4: uuidv4 } = require('uuid');

exports.generateWorkoutPlan = async (req, res) => {
  const user_id = req.user.id;
  const { goal, level, days_per_week, location, duration } = req.body;

  try {
    console.log(`Generating intelligent workout for user ${user_id}...`);
    
    // 0. Check for active plan (Lock 30 days)
    const activeCheck = await db.query(
      'SELECT next_plan_available_at FROM workout_plans WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1',
      [user_id]
    );

    if (activeCheck.rows.length > 0 && activeCheck.rows[0].next_plan_available_at) {
      const nextAvailable = new Date(activeCheck.rows[0].next_plan_available_at);
      if (new Date() < nextAvailable) {
        return res.status(403).json({ 
          error: 'Você já tem um plano ativo.',
          available_at: activeCheck.rows[0].next_plan_available_at
        });
      }
    }

    console.log('Parameters:', { goal, level, days_per_week, location, duration });
    
    // 1. Fetch recent completion history for AI learning
    const historyRes = await db.query(
      `SELECT day_of_week, completed, completed_at, created_at 
       FROM workout_progress 
       WHERE user_id = $1 
       ORDER BY created_at DESC 
       LIMIT 21`,
      [user_id]
    );

    console.log('History fetched:', historyRes.rows.length, 'sessions');

    // 2. Generate with OpenAI (Structured JSON)
    const structuredPlan = await generateWorkoutStructuredPlan(
      goal, level, days_per_week, location, duration, historyRes.rows
    );
    
    console.log('AI Generation successful');

    // 2.5 Update User Training Days Preference
    const dayNames = ['Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado', 'Domingo'];
    const selectedDays = dayNames.slice(0, parseInt(days_per_week));
    await db.query('UPDATE users SET user_training_days = $1 WHERE id = $2', [JSON.stringify(selectedDays), user_id]);

    // 3. Save to database
    const planStartDate = new Date();
    const planRenewalDate = new Date();
    planRenewalDate.setDate(planRenewalDate.getDate() + 30);

    const newPlan = await db.query(
      `INSERT INTO workout_plans (
        id, user_id, title, goal, level, days_per_week, location, duration, 
        plan_text, structured_plan, next_plan_available_at,
        plan_start_date, plan_renewal_date
      )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
       RETURNING *`,
      [
        uuidv4(), user_id, structuredPlan.title, goal, level, days_per_week, location, duration, 
        structuredPlan.message, 
        JSON.stringify(structuredPlan),
        planRenewalDate, // next_plan_available_at still used for locking logic
        planStartDate,
        planRenewalDate
      ]
    );

    console.log('Plan saved to DB');
    
    try {
      const userResult = await db.query('SELECT name, email FROM users WHERE id = $1', [user_id]);
      if (userResult.rows.length > 0) {
        const emailService = require('../services/emailService');
        const userEmail = userResult.rows[0].email;
        emailService.sendWorkoutPlanEmail(
          userResult.rows[0], 
          structuredPlan.title
        ).catch(err => console.error('[Workout] Erro ao enviar email de plano:', err));
      }
    } catch(e) {
      console.error('[Workout] Erro ao obter usuario para notificação:', e);
    }

    res.status(201).json(newPlan.rows[0]);
  } catch (err) {
    console.error('CRITICAL: Generate Workout Error:', err);
    res.status(500).json({ 
      message: 'Falha ao gerar treino inteligente',
      detail: err.message
    });
  }
};

exports.getWorkoutPlans = async (req, res) => {
  const user_id = req.user.id;
  try {
    const result = await db.query(
      `SELECT * FROM workout_plans 
       WHERE user_id = $1 
       ORDER BY created_at DESC`,
      [user_id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Get Workouts Error:', err);
    res.status(500).json({ message: 'Falha ao buscar seu histórico de treinos.' });
  }
};

exports.getActivePlan = async (req, res) => {
  const user_id = req.user.id;
  try {
    const result = await db.query(
      `SELECT * FROM workout_plans 
       WHERE user_id = $1 
       ORDER BY created_at DESC LIMIT 1`,
      [user_id]
    );
    
    const plan = result.rows[0];
    
    // Safety check: ensure dates are present and not Unix Epoch
    if (!plan.plan_start_date || new Date(plan.plan_start_date).getFullYear() === 1970) {
      plan.plan_start_date = plan.created_at;
    }
    
    if (!plan.plan_renewal_date || new Date(plan.plan_renewal_date).getFullYear() === 1970) {
      const renewalDate = new Date(plan.plan_start_date);
      renewalDate.setDate(renewalDate.getDate() + 30);
      plan.plan_renewal_date = renewalDate;
    }
    
    res.json(plan);
  } catch (err) {
    console.error('Error fetching active plan:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.getWorkoutPlanDetails = async (req, res) => {
  const user_id = req.user.id;
  const { id } = req.params;
  try {
    const result = await db.query(
      `SELECT * FROM workout_plans WHERE id = $1 AND user_id = $2`,
      [id, user_id]
    );
    if (result.rows.length === 0) return res.status(404).json({ message: 'Plano não encontrado' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Erro ao buscar detalhes do plano' });
  }
};

exports.markSessionComplete = async (req, res) => {
  const user_id = req.user.id;
  const { workout_plan_id, day_of_week } = req.body;

  try {
    const id = uuidv4();
    const result = await db.query(
      `INSERT INTO workout_progress (id, user_id, workout_plan_id, day_of_week, completed, completed_at)
       VALUES ($1, $2, $3, $4, true, CURRENT_TIMESTAMP)
       RETURNING *`,
      [id, user_id, workout_plan_id, day_of_week]
    );

    res.status(201).json({
      ...result.rows[0],
      message: 'Treino concluído! 💪',
      motivation: 'Excelente trabalho hoje. Continue assim para alcançar seus resultados.'
    });
  } catch (err) {
    console.error('Mark Progress Error:', err);
    res.status(500).json({ error: 'Erro ao registrar progresso do treino.' });
  }
};

exports.markExerciseComplete = async (req, res) => {
  const user_id = req.user.id;
  const { workout_plan_id, exercise_name, workout_day, completed, completed_sets } = req.body;

  try {
    // Check if progress already exists
    const check = await db.query(
      `SELECT * FROM user_workout_progress 
       WHERE user_id = $1 AND workout_plan_id = $2 AND exercise_name = $3 AND workout_day = $4`,
      [user_id, workout_plan_id, exercise_name, workout_day]
    );

    let result;
    if (check.rows.length > 0) {
      result = await db.query(
        `UPDATE user_workout_progress 
         SET completed = $1, completed_sets = $2, completed_at = CURRENT_TIMESTAMP 
         WHERE id = $3 RETURNING *`,
        [completed, JSON.stringify(completed_sets || []), check.rows[0].id]
      );
    } else {
      result = await db.query(
        `INSERT INTO user_workout_progress (id, user_id, workout_plan_id, exercise_name, workout_day, completed, completed_sets)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING *`,
        [uuidv4(), user_id, workout_plan_id, exercise_name, workout_day, completed, JSON.stringify(completed_sets || [])]
      );
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Mark Exercise Error:', err);
    res.status(500).json({ error: 'Erro ao registrar progresso do exercício.' });
  }
};

exports.getExerciseProgress = async (req, res) => {
  const user_id = req.user.id;
  const { workout_plan_id, workout_day } = req.query;

  try {
    const result = await db.query(
      `SELECT * FROM user_workout_progress 
       WHERE user_id = $1 AND workout_plan_id = $2 AND workout_day = $3`,
      [user_id, workout_plan_id, workout_day]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Get Exercise Progress Error:', err);
    res.status(500).json({ error: 'Erro ao buscar progresso dos exercícios.' });
  }
};

exports.getWorkoutProgress = async (req, res) => {
  const user_id = req.user.id;
  const { workout_plan_id } = req.query;
  try {
    const result = await db.query(
      `SELECT * FROM workout_progress WHERE user_id = $1 AND workout_plan_id = $2`,
      [user_id, workout_plan_id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar progresso.' });
  }
};

exports.resetWorkoutPlan = async (req, res) => {
  const user_id = req.user.id;
  try {
    // Delete the most recent plan to allow regeneration
    await db.query(
      'DELETE FROM workout_plans WHERE user_id = $1 AND id = (SELECT id FROM workout_plans WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1)',
      [user_id]
    );
    res.json({ message: 'Plano resetado com sucesso. Você já pode gerar um novo!' });
  } catch (err) {
    console.error('Reset Workout Error:', err);
    res.status(500).json({ message: 'Erro ao resetar plano.' });
  }
};
