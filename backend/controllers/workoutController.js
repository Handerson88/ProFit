const { generateWorkoutStructuredPlan, analyzeBodyImage } = require('../services/openaiService');
const db = require('../config/database');
const { v4: uuidv4 } = require('uuid');
const { getMaputoNow } = require('../utils/dateUtils');

exports.generateWorkoutPlan = async (req, res) => {
  const user_id = req.user.id;
  const { 
    goal, level, days_per_week, location, duration, isUpdate,
    age: bodyAge, weight: bodyWeight, height: bodyHeight,
    experience, injuries, diseases, body_focus, intensity, observations 
  } = req.body;
 
   try {
     console.log(`Generating intelligent workout for user ${user_id}...`);
     
     // 0. Check for active plan (Lock 30 days) - SKIP IF IS UPDATE
     if (!isUpdate) {
       const activeCheck = await db.query(
         'SELECT next_plan_available_at FROM workout_plans WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1',
         [user_id]
       );
 
       if (activeCheck.rows.length > 0 && activeCheck.rows[0].next_plan_available_at) {
         const nextAvailable = new Date(activeCheck.rows[0].next_plan_available_at);
         if (getMaputoNow().toDate() < nextAvailable) {
           return res.status(403).json({ 
             error: 'Você já tem um plano ativo.',
             available_at: activeCheck.rows[0].next_plan_available_at
           });
         }
       }
     }

    console.log('Parameters:', { goal, level, days_per_week, location, duration, focus: body_focus });
    
    // 1. Fetch user data (gender, metrics) and history
    const [userRes, historyRes] = await Promise.all([
      db.query('SELECT gender, age, weight, height FROM users WHERE id = $1', [user_id]),
      db.query(
        `SELECT day_of_week, completed, completed_at, created_at 
         FROM workout_progress 
         WHERE user_id = $1 
         ORDER BY created_at DESC 
         LIMIT 21`,
        [user_id]
      )
    ]);

    const user = userRes.rows[0];
    const gender = user?.gender || 'male';
    
    // Metrics priority: body if provided, else database
    const finalAge = bodyAge || user?.age;
    const finalWeight = bodyWeight || user?.weight;
    const finalHeight = bodyHeight || user?.height;
 
    console.log('User gender:', gender, 'Final Metrics:', { finalAge, finalWeight, finalHeight });
    console.log('History fetched:', historyRes.rows.length, 'sessions');

    // 1.5 Handle Body Image Analysis if present
    let bodyAnalysisText = null;
    if (req.file) {
      console.log('[Controller] Body image received, starting AI analysis...');
      const analysisResult = await analyzeBodyImage(req.file.buffer, {
        gender, goal, weight: finalWeight, height: finalHeight
      });
      bodyAnalysisText = analysisResult.analysis;
      console.log('[Controller] Body analysis complete:', bodyAnalysisText);
    }

    console.log('OpenAI Generation Response received.');
    // 2. Generate with OpenAI (Structured JSON)
    const structuredPlan = await generateWorkoutStructuredPlan({
      gender,
      goal,
      level,
      days_per_week,
      location,
      duration,
      history: historyRes.rows,
      age: finalAge,
      weight: finalWeight,
      height: finalHeight,
      experience,
      injuries,
      diseases,
      body_focus,
      intensity,
      observations,
      bodyAnalysis: bodyAnalysisText
    });
    
    console.log('AI Generation successful');

    // 2.5 Update User Training Days Preference
    const dayNames = ['Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado', 'Domingo'];
    const selectedDays = dayNames.slice(0, parseInt(days_per_week));
    await db.query('UPDATE users SET user_training_days = $1 WHERE id = $2', [JSON.stringify(selectedDays), user_id]);

    // 3. Save to database
    const planStartDate = getMaputoNow().toDate();
    const planRenewalDate = getMaputoNow().add(30, 'day').toDate();

    const newPlan = await db.query(
      `INSERT INTO workout_plans (
        id, user_id, title, goal, level, days_per_week, location, duration, 
        plan_text, structured_plan, next_plan_available_at,
        plan_start_date, plan_renewal_date, body_analysis
      )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
       RETURNING *`,
      [
        uuidv4(),
        user_id,
        structuredPlan.title,
        goal,
        level,
        days_per_week,
        location,
        duration,
        structuredPlan.message,
        JSON.stringify(structuredPlan),
        planRenewalDate, // next_plan_available_at still used for locking logic
        planStartDate,
        planRenewalDate,
        bodyAnalysisText
      ]
    );

    console.log('Plan saved to DB');
    
    try {
      const userResult = await db.query('SELECT name, email FROM users WHERE id = $1', [user_id]);
      if (userResult.rows.length > 0) {
        const userData = userResult.rows[0];

        // NEW: Save to administrative workouts table as per request
        await db.query(
          `INSERT INTO workouts (id, user_id, user_email, user_name, goal, level, duration, exercises, type, calories, status, structured_plan, created_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, CURRENT_TIMESTAMP)`,
          [
            newPlan.rows[0].id, user_id, userData.email, userData.name,
            goal, level, duration, JSON.stringify(structuredPlan), 
            'IA', 0, 'active', JSON.stringify(structuredPlan)
          ]
        );

        const emailService = require('../services/emailService');
        emailService.sendWorkoutPlanEmail(
          userData, 
          structuredPlan.title
        ).catch(err => console.error('[Workout] Erro ao enviar email de plano:', err));

        // NEW: Real-time update for Dashboard
        const io = req.app.get('socketio');
        if (io) {
          io.to(`user_${user_id}`).emit('workout_plan_added', {
            message: 'Seu novo plano de treino está pronto! 💪',
            plan: newPlan.rows[0]
          });
        }
      }
    } catch(e) {
      console.error('[Workout] Erro ao processar persistência administrativa/notificação:', e);
    }

    res.status(201).json({ 
      success: true, 
      plan: newPlan.rows[0] 
    });
  } catch (err) {
    console.error('CRITICAL: Generate Workout Error:', err);
    res.status(500).json({ 
      success: false,
      error: 'Infelizmente nossa IA está com alta demanda técnica agora.',
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
    if (!plan) return res.json(null);
    
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

    // NEW: Also update workout_sessions if this was an active session
    try {
      await db.query(
        "UPDATE workout_sessions SET status = 'completed', end_time = CURRENT_TIMESTAMP WHERE user_id = $1 AND plan_id = $2 AND status = 'active'",
        [user_id, workout_plan_id]
      );
    } catch(e) { console.error('Error updating session on complete:', e); }
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

// New: Migrate existing plans to flattened Workouts table
exports.migrateWorkoutsToDatabase = async (req, res) => {
  try {
    const plans = await db.query(`
      SELECT wp.*, u.name as user_name, u.email as user_email 
      FROM workout_plans wp 
      JOIN users u ON wp.user_id = u.id
      WHERE wp.id NOT IN (SELECT id FROM workouts)
    `);

    console.log(`Migrating ${plans.rows.length} workouts...`);

    for (const plan of plans.rows) {
      await db.query(
        `INSERT INTO workouts (id, user_id, user_email, user_name, goal, level, duration, exercises, type, status, structured_plan, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
         ON CONFLICT (id) DO UPDATE SET 
            type = EXCLUDED.type, 
            status = EXCLUDED.status, 
            structured_plan = EXCLUDED.structured_plan`,
        [
          plan.id, plan.user_id, plan.user_email, plan.user_name, 
          plan.goal, plan.level, plan.duration, 
          plan.structured_plan || {}, 
          plan.goal === 'Manual' ? 'Manual' : 'IA',
          'active',
          plan.structured_plan || {},
          plan.created_at
        ]
      );
    }

    res.json({ message: `Sucesso! ${plans.rows.length} treinos migrados.` });
  } catch (err) {
    console.error('Migration Error:', err);
    res.status(500).json({ error: 'Falha na migração de treinos.' });
  }
};

exports.saveManualPlan = async (req, res) => {
  const user_id = req.user.id;
  const { structuredPlan } = req.body;

  try {
    const daysWithExercises = structuredPlan.daily_workouts.filter(dw => dw.exercises && dw.exercises.length > 0).length;
    const planStartDate = new Date();
    const planRenewalDate = new Date();
    planRenewalDate.setDate(planRenewalDate.getDate() + 30);
    const planId = uuidv4();

    console.log(`Saving manual plan for user ${user_id}...`);

    const newPlan = await db.query(
      `INSERT INTO workout_plans (
        id, user_id, title, goal, level, days_per_week, location, duration, 
        plan_text, structured_plan, next_plan_available_at,
        plan_start_date, plan_renewal_date
      )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
       RETURNING *`,
      [
        planId,
        user_id,
        structuredPlan.title || 'Meu Treino Manual',
        'Manual',
        'Personalizado',
        `${daysWithExercises} dias`,
        'Casa/Academia',
        'Varia',
        'Plano de treino criado manualmente pelo usuário.',
        JSON.stringify(structuredPlan),
        planRenewalDate,
        planStartDate,
        planRenewalDate
      ]
    );

    // Update user training days preference based on manual selection
    const selectedDays = structuredPlan.daily_workouts
      .filter(dw => dw.exercises && dw.exercises.length > 0)
      .map(dw => dw.day);
    await db.query('UPDATE users SET user_training_days = $1 WHERE id = $2', [JSON.stringify(selectedDays), user_id]);

    // Save to admin table
    const userResult = await db.query('SELECT name, email FROM users WHERE id = $1', [user_id]);
    if (userResult.rows.length > 0) {
      const userData = userResult.rows[0];
      await db.query(
        `INSERT INTO workouts (id, user_id, user_email, user_name, goal, level, duration, exercises, type, status, structured_plan, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, CURRENT_TIMESTAMP)`,
        [
          planId, user_id, userData.email, userData.name,
          'Manual', 'Personalizado', 'Varia', JSON.stringify(structuredPlan),
          'Manual', 'active', JSON.stringify(structuredPlan)
        ]
      );

      console.log(`Manual plan saved successfully for user ${user_id}`);

      // Trigger real-time update
      const io = req.app.get('socketio');
      if (io) {
        io.to(`user_${user_id}`).emit('workout_plan_added', {
          message: 'Seu plano manual foi ativado! 💪',
          plan: newPlan.rows[0]
        });
      }
    }

    res.status(201).json({ 
      success: true, 
      plan: newPlan.rows[0] 
    });
  } catch (err) {
    console.error('CRITICAL: Save Manual Plan Error:', err);
    res.status(500).json({ 
      success: false,
      error: 'Falha ao salvar plano manual.',
      detail: err.message
    });
  }
};

// --- REAL-TIME SESSION TRACKING ---

exports.startWorkoutSession = async (req, res) => {
  const user_id = req.user.id;
  const { plan_id, workout_type, workout_day } = req.body;

  try {
    // Check if there's already an active session
    const activeCheck = await db.query(
      "SELECT id FROM workout_sessions WHERE user_id = $1 AND status = 'active'",
      [user_id]
    );

    if (activeCheck.rows.length > 0) {
      // Auto-complete or cancel previous active session? 
      // For now, let's just use the existing one or create new. 
      // User might have left a session hanging.
      await db.query(
        "UPDATE workout_sessions SET status = 'cancelled', end_time = CURRENT_TIMESTAMP WHERE id = $1",
        [activeCheck.rows[0].id]
      );
    }

    const sessionId = uuidv4();
    const result = await db.query(
      `INSERT INTO workout_sessions (id, user_id, plan_id, status, start_time, workout_type, workout_day)
       VALUES ($1, $2, $3, 'active', CURRENT_TIMESTAMP, $4, $5)
       RETURNING *`,
      [sessionId, user_id, plan_id, workout_type || 'IA', workout_day]
    );

    // Emit Real-time event for Admin
    const io = req.app.get('socketio');
    if (io) {
      io.to('admin_room').emit('workout_session_update', {
        type: 'session_started',
        session: result.rows[0]
      });
    }

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Start Session Error:', err);
    res.status(500).json({ error: 'Erro ao iniciar sessão de treino.' });
  }
};

exports.endWorkoutSession = async (req, res) => {
  const user_id = req.user.id;
  const { session_id, status, duration, calories } = req.body;

  try {
    const result = await db.query(
      `UPDATE workout_sessions 
       SET status = $1, end_time = CURRENT_TIMESTAMP, duration = $2, calories = $3
       WHERE id = $4 AND user_id = $5
       RETURNING *`,
      [status || 'completed', duration || 0, calories || 0, session_id, user_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Sessão não encontrada.' });
    }

    // Emit Real-time event for Admin
    const io = req.app.get('socketio');
    if (io) {
      io.to('admin_room').emit('workout_session_update', {
        type: 'session_ended',
        session: result.rows[0]
      });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('End Session Error:', err);
    res.status(500).json({ error: 'Erro ao encerrar sessão de treino.' });
  }
};

exports.getWorkoutSessions = async (req, res) => {
  const user_id = req.user.id;
  try {
    const result = await db.query(
      `SELECT * FROM workout_sessions WHERE user_id = $1 ORDER BY created_at DESC`,
      [user_id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Get Sessions Error:', err);
    res.status(500).json({ error: 'Erro ao buscar histórico de sessões.' });
  }
};

