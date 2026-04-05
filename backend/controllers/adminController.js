const db = require('../config/database');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const jwt = require('jsonwebtoken');
const emailService = require('../services/emailService');
const ExcelJS = require('exceljs');

// Helper to log admin actions
const logAdminAction = async (adminId, action, targetType, targetId) => {
    try {
        await db.query(
            'INSERT INTO admin_logs (id, admin_id, action, target_type, target_id) VALUES ($1, $2, $3, $4, $5)',
            [uuidv4(), adminId, action, targetType, targetId]
        );
    } catch (err) {
        console.error('Error logging admin action:', err);
    }
};

// Admin Login
exports.login = async (req, res) => {
    const { email, password } = req.body;
    try {
        // Search in users table instead of separate admins table
        const result = await db.query('SELECT * FROM users WHERE email = $1', [email]);
        if (result.rows.length === 0) return res.status(404).json({ message: 'Conta de administrador não encontrada' });
 
        const admin = result.rows[0];
        
        // Verify ROLE matches 'admin'
        if (admin.role !== 'admin') {
            return res.status(403).json({ message: 'Acesso negado. Esta conta não possui privilégios de administrador.' });
        }

        const isMatch = await bcrypt.compare(password, admin.password_hash);
        if (!isMatch) return res.status(401).json({ message: 'Email ou senha incorretos.' });
 
        const token = jwt.sign({ id: admin.id, role: admin.role }, process.env.JWT_SECRET);
        res.json({ 
            token, 
            admin: { id: admin.id, email: admin.email, role: admin.role } 
        });
        
        logAdminAction(admin.id, 'Login efetuado', 'auth', admin.id);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Erro ao conectar com servidor' });
    }
};

// Dashboard Stats
exports.getStats = async (req, res) => {
    try {
        const usersCount = await db.query('SELECT COUNT(*) FROM users');
        const activeToday = await db.query("SELECT COUNT(DISTINCT user_id) FROM meals WHERE date >= (CURRENT_TIMESTAMP AT TIME ZONE 'UTC' AT TIME ZONE 'Africa/Maputo')::DATE");
        const activeWeekly = await db.query("SELECT COUNT(DISTINCT user_id) FROM meals WHERE date >= (CURRENT_TIMESTAMP AT TIME ZONE 'UTC' AT TIME ZONE 'Africa/Maputo')::DATE - INTERVAL '7 days'");
        const mealsCount = await db.query('SELECT COUNT(*) FROM meals');
        const workoutsCount = await db.query('SELECT COUNT(*) FROM workout_plans');
        const scansCount = await db.query('SELECT COUNT(*) FROM settings WHERE key = \'total_scans_globais\'');

        res.json({
            totalUsers: parseInt(usersCount.rows[0].count),
            activeToday: parseInt(activeToday.rows[0].count),
            activeWeekly: parseInt(activeWeekly.rows[0].count),
            totalMeals: parseInt(mealsCount.rows[0].count),
            totalScans: parseInt(scansCount.rows[0]?.value || 0),
            totalWorkouts: parseInt(workoutsCount.rows[0].count)
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Erro ao buscar estatísticas' });
    }
};

exports.getDashboardData = async (req, res) => {
    try {
        // 1. User metrics (Excluding Admin)
        const usersRes = await db.query(`
            SELECT 
                COUNT(*) FILTER (WHERE role = 'user') as total,
                COUNT(*) FILTER (WHERE role = 'user' AND plan_type = 'pro' AND status = 'active') as pro,
                COUNT(*) FILTER (WHERE role = 'user' AND plan_type = 'free') as free
            FROM users
        `);
        const { total, pro, free } = usersRes.rows[0];
        
        const total_users = parseInt(total || 0);
        const pro_users = parseInt(pro || 0);
        const free_users = parseInt(free || 0);
        
        // Regel: Active if users >= 20
        const paywallActive = total_users >= 20;

        // 2. MRR (Price = 499 MZN as requested)
        const mrr = pro_users * 499;

        // 3. Chart Data (Active Users per day vs Meals per day)
        // Last 7 days
        const chartRes = await db.query(`
            SELECT 
                to_char(date_trunc('day', d), 'Dy') as day_name,
                (SELECT COUNT(DISTINCT user_id) FROM meals WHERE date::date = d::date) as active_users,
                (SELECT COUNT(*) FROM meals WHERE date::date = d::date) as meals_count
            FROM generate_series(
                (CURRENT_TIMESTAMP AT TIME ZONE 'UTC' AT TIME ZONE 'Africa/Maputo')::DATE - interval '6 days', 
                (CURRENT_TIMESTAMP AT TIME ZONE 'UTC' AT TIME ZONE 'Africa/Maputo')::DATE, 
                interval '1 day'
            ) d
            ORDER BY d
        `);

        const activityData = chartRes.rows.map(row => ({
            name: row.day_name,
            users: parseInt(row.active_users || 0),
            meals: parseInt(row.meals_count || 0)
        }));

        // 4. System Status Check
        let dbStatus = 'Online';
        try {
            await db.query('SELECT 1');
        } catch (e) {
            dbStatus = 'Offline';
        }

        res.json({
            total_users,
            pro_users,
            free_users,
            paywall_active: paywallActive,
            mrr,
            activityData,
            system_status: {
                database: dbStatus,
                vumba_core: 'Operacional', // Mocked as operational for now
                ai_api: '200 OK'
            }
        });
    } catch (err) {
        console.error('[Admin] Error fetching dashboard data:', err);
        res.status(500).json({ message: 'Erro ao carregar dados reais do painel' });
    }
};

exports.getUsersActivity = async (req, res) => {
    try {
        const result = await db.query(`
            SELECT 
                id, 
                name,
                email, 
                last_active_at,
                last_login_at,
                plan_type,
                CASE 
                    WHEN last_active_at IS NULL THEN 'Nunca ativo'
                    WHEN last_active_at > NOW() - INTERVAL '2 minutes' THEN 'Online agora'
                    WHEN last_active_at > NOW() - INTERVAL '1 hour' THEN 'Há ' || floor(extract(epoch from (NOW() - last_active_at))/60) || ' minutos'
                    WHEN last_active_at > NOW() - INTERVAL '1 day' THEN 'Há ' || floor(extract(epoch from (NOW() - last_active_at))/3600) || ' horas'
                    ELSE 'Há ' || floor(extract(epoch from (NOW() - last_active_at))/86400) || ' dias'
                END as tempo_formatado
            FROM users 
            WHERE role = 'user'
            ORDER BY last_active_at DESC NULLS LAST
            LIMIT 50
        `);
        
        res.json(result.rows);
    } catch (err) {
        console.error('[Admin] Error fetching users activity:', err);
        res.status(500).json({ message: 'Erro ao buscar atividade dos usuários' });
    }
};

// User Management
exports.getUsers = async (req, res) => {
    try {
        const result = await db.query(`
            SELECT id, name, email, created_at, status, is_active, onboarding_completed, has_paid, scan_limit_per_day, is_influencer,
            (SELECT name FROM users u2 WHERE u2.id = users.referred_by) as referrer_name,
            (SELECT date FROM meals WHERE user_id = users.id ORDER BY date DESC LIMIT 1) as last_activity
            FROM users 
            WHERE role = 'user' OR role IS NULL
            ORDER BY created_at DESC
        `);
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Erro ao buscar usuários' });
    }
};

exports.getAdmins = async (req, res) => {
    try {
        const result = await db.query(`
            SELECT id, name, email, created_at, status, is_active, role,
            (SELECT date FROM meals WHERE user_id = users.id ORDER BY date DESC LIMIT 1) as last_activity
            FROM users 
            WHERE role IN ('admin', 'super_admin')
            ORDER BY created_at DESC
        `);
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Erro ao buscar administradores' });
    }
};

exports.getUserDetails = async (req, res) => {
    const { id } = req.params;
    try {
        const user = await db.query('SELECT id, name, email, created_at, status, age, gender, goal FROM users WHERE id = $1', [id]);
        if (user.rows.length === 0) return res.status(404).json({ message: 'Usuário não encontrado' });

        const mealStats = await db.query(`
            SELECT 
                COUNT(*) as count, 
                SUM(calories) as total_calories,
                COUNT(image_url) as total_scans
            FROM meals 
            WHERE user_id = $1
        `, [id]);
        
        const workoutPlans = await db.query('SELECT * FROM workout_plans WHERE user_id = $1 ORDER BY created_at DESC', [id]);
        const recentActivity = await db.query(`
            (SELECT 'meal' as type, COALESCE(food_name, 'Refeição') as title, COALESCE(calories::text, '0') as info, date FROM meals WHERE user_id = $1)
            UNION ALL
            (SELECT 'workout' as type, COALESCE(title, 'Plano de Treino') as title, COALESCE(goal, 'Objetivo') as info, created_at as date FROM workout_plans WHERE user_id = $1)
            ORDER BY date DESC LIMIT 20
        `, [id]);

        console.log('User History Debug:', recentActivity.rows[0]);
        res.json({
            user: user.rows[0],
            stats: {
                totalMeals: parseInt(mealStats.rows[0].count),
                totalCalories: parseInt(mealStats.rows[0].total_calories || 0),
                totalScans: parseInt(mealStats.rows[0].total_scans || 0)
            },
            plans: workoutPlans.rows,
            history: recentActivity.rows
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Erro ao buscar detalhes do usuário' });
    }
};

exports.deleteUser = async (req, res) => {
    const { id } = req.params;
    try {
        await db.query('DELETE FROM users WHERE id = $1', [id]);
        logAdminAction(req.admin.id, `Usuário excluído: ${id}`, 'user', id);
        res.json({ message: 'Usuário removido com sucesso' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Erro ao remover usuário' });
    }
};

exports.toggleUserStatus = async (req, res) => {
    const { id } = req.params;
    const { is_active } = req.body; 
    try {
        await db.query('UPDATE users SET is_active = $1 WHERE id = $2', [is_active, id]);
        const action = is_active ? 'Desbloqueio de usuário' : 'Bloqueio de usuário';
        logAdminAction(req.admin.id, `${action}: ${id}`, 'user', id);
        res.json({ message: `Status do usuário atualizado para ${is_active ? 'Ativo' : 'Bloqueado'}`, is_active });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Erro ao atualizar status do usuário' });
    }
};

// New: Manage User Scan Limits
exports.updateUserScanLimit = async (req, res) => {
    const { id } = req.params;
    const { scan_limit } = req.body; // Number or -1 for unlimited
    
    try {
        await db.query('UPDATE users SET scan_limit_per_day = $1 WHERE id = $2', [scan_limit, id]);
        logAdminAction(req.admin.id, `Limite de scan atualizado para ${scan_limit}: ${id}`, 'user', id);
        res.json({ message: 'Limite de scan atualizado com sucesso' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Erro ao atualizar limite de scan' });
    }
};

// New: Invite User
exports.inviteUser = async (req, res) => {
    const { name, email, scan_limit } = req.body;
    const userId = uuidv4();
    const inviteToken = uuidv4();

    try {
        // 1. Check if user already exists
        const checkResult = await db.query('SELECT * FROM users WHERE email = $1', [email]);
        if (checkResult.rows.length > 0) {
            return res.status(409).json({ message: 'Este email já está registrado.' });
        }

        // 2. Create user (inactive)
        await db.query(
            'INSERT INTO users (id, name, email, scan_limit_per_day, is_active, onboarding_completed, role) VALUES ($1, $2, $3, $4, $5, $6, $7)',
            [userId, name, email, scan_limit || 3, false, false, 'user']
        );

        // 3. Create activation token (48h expiration for admin invites)
        const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000); 
        await db.query(
            'INSERT INTO tokens (token, user_id, type, expires_at) VALUES ($1, $2, $3, $4)',
            [inviteToken, userId, 'activation', expiresAt]
        );

        // 4. Log action
        logAdminAction(req.admin.id, `Convite enviado para ${email}`, 'user', userId);

        // 5. Send Email
        const frontUrl = process.env.FRONTEND_URL || 'https://myprofittness.com';
        const inviteLink = `${frontUrl}/activate?token=${inviteToken}`;
        const inviterName = 'Administração ProFit';
        
        await emailService.sendInviteEmail(email, inviterName, inviteLink);
        
        res.json({ 
            message: 'Convite enviado com sucesso!', 
            inviteLink,
            user_id: userId 
        });
    } catch (err) {
        console.error('[Admin] Erro ao processar convite:', err);
        res.status(500).json({ message: 'Erro ao processar convite' });
    }
};

// Food Management
exports.getFoods = async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM foods ORDER BY name ASC');
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Erro ao buscar banco de alimentos' });
    }
};

exports.updateFood = async (req, res) => {
    const { id } = req.params;
    const { name, calories, protein, carbs, fat } = req.body;
    try {
        await db.query(
            'UPDATE foods SET name = $1, calories = $2, protein = $3, carbs = $4, fat = $5 WHERE id = $6',
            [name, calories, protein, carbs, fat, id]
        );
        logAdminAction(req.admin.id, `Alimento editado: ${name} (${id})`, 'food', id);
        res.json({ message: 'Alimento atualizado com sucesso' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Erro ao atualizar alimento' });
    }
};

exports.deleteFood = async (req, res) => {
    const { id } = req.params;
    try {
        await db.query('DELETE FROM foods WHERE id = $1', [id]);
        logAdminAction(req.admin.id, `Alimento excluído: ${id}`, 'food', id);
        res.json({ message: 'Alimento removido com sucesso' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Erro ao remover alimento' });
    }
};

// Workout Plans
exports.getPlans = async (req, res) => {
    try {
        const result = await db.query(`
            SELECT wp.*, u.name as user_name, u.email as user_email 
            FROM workout_plans wp 
            JOIN users u ON wp.user_id = u.id 
            ORDER BY wp.created_at DESC
        `);
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Erro ao buscar planos de treino' });
    }
};

// Logs
exports.getLogs = async (req, res) => {
    try {
        const adminLogs = await db.query(`
            SELECT al.*, a.email as admin_email 
            FROM admin_logs al 
            JOIN admins a ON al.admin_id = a.id 
            ORDER BY al.created_at DESC 
            LIMIT 100
        `);
        res.json({
            adminLogs: adminLogs.rows
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Erro ao buscar logs' });
    }
};
// MRR Statistics
exports.getMRRStats = async (req, res) => {
    try {
        // 1. Total MRR (Sum of active monthly plans)
        const mrrResult = await db.query("SELECT SUM(plan_price) as mrr FROM subscriptions WHERE status = 'active'");
        const mrr = parseFloat(mrrResult.rows[0].mrr || 0);

        // 2. Active Subscribers
        const subscribersResult = await db.query("SELECT COUNT(*) as count FROM subscriptions WHERE status = 'active'");
        const subscribers = parseInt(subscribersResult.rows[0].count || 0);

        // 3. Average Revenue Per User (ARPU)
        const arpu = subscribers > 0 ? (mrr / subscribers) : 0;

        // 4. Growth (Current month vs Previous month)
        // This is a simplified calculation based on created_at
        const currentMonthMRR = await db.query(`
            SELECT SUM(plan_price) as mrr FROM subscriptions 
            WHERE status = 'active' 
            AND created_at >= date_trunc('month', CURRENT_DATE)
        `);
        const prevMonthMRR = await db.query(`
            SELECT SUM(plan_price) as mrr FROM subscriptions 
            WHERE status = 'active' 
            AND created_at >= date_trunc('month', CURRENT_DATE - INTERVAL '1 month')
            AND created_at < date_trunc('month', CURRENT_DATE)
        `);
        
        const mrrNow = parseFloat(currentMonthMRR.rows[0].mrr || 0);
        const mrrPrev = parseFloat(prevMonthMRR.rows[0].mrr || 0);
        const growth = mrrPrev > 0 ? ((mrrNow - mrrPrev) / mrrPrev * 100).toFixed(1) : '100';

        res.json({
            mrr,
            subscribers,
            arpu,
            growth
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Erro ao buscar dados MRR' });
    }
};

exports.getMRRChart = async (req, res) => {
    try {
        // Last 12 months trend
        const result = await db.query(`
            SELECT 
                to_char(date_trunc('month', created_at), 'Mon') as month,
                SUM(plan_price) as value
            FROM subscriptions
            WHERE created_at >= CURRENT_DATE - INTERVAL '12 months'
            GROUP BY date_trunc('month', created_at)
            ORDER BY date_trunc('month', created_at)
        `);
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Erro ao buscar gráfico MRR' });
    }
};
// Scanned Dishes Management
exports.getScannedDishes = async (req, res) => {
    const { search, period } = req.query;
    try {
        let query = `
            SELECT sd.*, u.name as user_name, u.email as user_email 
            FROM scanned_dishes sd
            JOIN users u ON sd.user_id = u.id
        `;
        let params = [];
        let conditions = [];

        if (search) {
            params.push(`%${search}%`);
            conditions.push(`(sd.dish_name ILIKE $${params.length} OR u.name ILIKE $${params.length})`);
        }

        if (period && period !== 'all') {
            if (period === 'today') {
                conditions.push("sd.created_at >= CURRENT_DATE");
            } else if (period === 'week') {
                conditions.push("sd.created_at >= CURRENT_DATE - INTERVAL '7 days'");
            } else if (period === 'month') {
                conditions.push("sd.created_at >= CURRENT_DATE - INTERVAL '30 days'");
            }
        }

        if (conditions.length > 0) {
            query += ' WHERE ' + conditions.join(' AND ');
        }

        query += ' ORDER BY sd.created_at DESC';

        const result = await db.query(query, params);
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Erro ao buscar pratos escaneados' });
    }
};

exports.updateScannedDish = async (req, res) => {
    const { id } = req.params;
    const { dish_name, calories, protein, carbs, fat } = req.body;
    try {
        await db.query(
            'UPDATE scanned_dishes SET dish_name = $1, calories = $2, protein = $3, carbs = $4, fat = $5 WHERE id = $6',
            [dish_name, calories, protein, carbs, fat, id]
        );
        logAdminAction(req.admin.id, `Prato escaneado editado: ${dish_name} (${id})`, 'scanned_dish', id);
        res.json({ message: 'Informações do prato atualizadas com sucesso' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Erro ao atualizar informações do prato' });
    }
};

exports.deleteScannedDish = async (req, res) => {
    const { id } = req.params;
    try {
        await db.query('DELETE FROM scanned_dishes WHERE id = $1', [id]);
        logAdminAction(req.admin.id, `Prato escaneado excluído: ${id}`, 'scanned_dish', id);
        res.json({ message: 'Prato removido com sucesso' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Erro ao remover prato' });
    }
};

exports.getMRRStats = async (req, res) => {
    try {
        const totalUsersRes = await db.query("SELECT COUNT(*) FROM users");
        const totalUsers = parseInt(totalUsersRes.rows[0].count);

        let mode = "ESTIMADO";
        let charging = false;
        let mrr = 0;
        let subscribers = 0;

        if (totalUsers < 20) {
            mode = "ESTIMADO";
            charging = false;
            mrr = totalUsers * 299;
            subscribers = totalUsers; // No modo estimado, projetamos com todos
        } else {
            mode = "REAL";
            charging = true;
            const paidUsersRes = await db.query("SELECT COUNT(*) FROM users WHERE plan = 'PRO' AND payment_status = 'PAID'");
            subscribers = parseInt(paidUsersRes.rows[0].count);
            mrr = subscribers * 299;
        }

        const arpu = subscribers > 0 ? 299 : 0;
        
        // Cáculo de crescimento simplificado baseado em novos usuários no mês
        const thisMonthTotalRes = await db.query("SELECT COUNT(*) FROM users WHERE created_at >= date_trunc('month', CURRENT_DATE)");
        const thisMonthTotal = parseInt(thisMonthTotalRes.rows[0].count);
        const growth = totalUsers > 0 ? Math.round((thisMonthTotal / totalUsers) * 100) : 0;

        res.json({
            mrr,
            subscribers,
            arpu,
            growth,
            mode,
            charging,
            totalUsers
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Erro ao buscar estatísticas de MRR' });
    }
};

exports.getMRRChart = async (req, res) => {
    try {
        const result = await db.query(`
            SELECT 
                to_char(date_trunc('month', created_at), 'Mon') as month,
                SUM(amount) as value
            FROM payments
            WHERE status = 'approved'
            AND created_at >= CURRENT_DATE - INTERVAL '12 months'
            GROUP BY date_trunc('month', created_at)
            ORDER BY date_trunc('month', created_at)
        `);
        
        res.json(result.rows.map(row => ({
            month: row.month,
            value: parseFloat(row.value)
        })));
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Erro ao buscar dados do gráfico MRR' });
    }
};

exports.getFunnelStats = async (req, res) => {
    try {
        const statsRes = await db.query(`
            SELECT funnel_step, COUNT(*) as count 
            FROM users 
            WHERE role = 'user' 
            GROUP BY funnel_step
        `);
        const usersRes = await db.query(`
            SELECT id, name, email, funnel_step, created_at, plan, payment_status, 'user' as user_type
            FROM users 
            WHERE role = 'user' 
            ORDER BY created_at DESC 
            LIMIT 100
        `);

        const leadsRes = await db.query(`
            SELECT id, name, email, current_step as funnel_step, created_at, 'lead' as user_type
            FROM quiz_leads
            WHERE status != 'converted'
            ORDER BY last_active_at DESC
            LIMIT 100
        `);
        
        const countMap = {
            'REGISTERED': 0,
            'QUIZ_STARTED': 0,
            'QUIZ_COMPLETED': 0,
            'PLAN_VIEWED': 0,
            'PAYMENT_PENDING': 0,
            'PAID': 0
        };

        statsRes.rows.forEach(r => {
            if (r.funnel_step) countMap[r.funnel_step] = parseInt(r.count);
        });

        // Add leads to the count (approximating steps)
        leadsRes.rows.forEach(l => {
            const step = parseInt(l.funnel_step);
            if (step === 1) countMap['QUIZ_STARTED']++;
            else if (step > 1 && step < 36) countMap['QUIZ_STARTED']++;
            else if (step >= 36) countMap['QUIZ_COMPLETED']++;
        });

        // Merge and process users list
        const mergedUsers = [
            ...usersRes.rows,
            ...leadsRes.rows.map(l => ({
                ...l,
                name: l.name || 'Usuário Desconhecido',
                email: l.email || 'Anônimo (Pendente)',
                funnel_step: parseInt(l.funnel_step) >= 36 ? 'QUIZ_COMPLETED' : 'QUIZ_STARTED'
            }))
        ].sort((a,b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 100);

        // Agregação de bloqueadores/obstáculos
        const blockersRes = await db.query(`
            SELECT blocker, COUNT(*) as count
            FROM users, jsonb_array_elements_text(COALESCE(blockers, '[]'::jsonb)) as blocker
            WHERE role = 'user'
            GROUP BY blocker
        `);
        const blockersMap = {};
        blockersRes.rows.forEach(r => {
            blockersMap[r.blocker] = parseInt(r.count);
        });

        // Agregação de objetivos principais
        const objectivesRes = await db.query(`
            SELECT primary_objective, COUNT(*) as count
            FROM users
            WHERE role = 'user' AND primary_objective IS NOT NULL
            GROUP BY primary_objective
        `);
        const objectivesMap = {};
        objectivesRes.rows.forEach(r => {
            objectivesMap[r.primary_objective] = parseInt(r.count);
        });
        
        res.json({ counts: countMap, users: mergedUsers, blockers: blockersMap, objectives: objectivesMap });
    } catch(err) {
        console.error('Error fetching funnel stats:', err);
        res.status(500).json({ message: 'Error fetching funnel stats' });
    }
};

exports.getWorkoutActivity = async (req, res) => {
    const { search, status, type, date, page = 1, limit = 10 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    try {
        let query = `
            SELECT 
                ws.*,
                u.name as user_name,
                u.email as user_email,
                wp.title as plan_title
            FROM workout_sessions ws
            JOIN users u ON ws.user_id = u.id
            LEFT JOIN workout_plans wp ON ws.plan_id = wp.id
        `;
        const params = [];
        const conditions = [];

        if (search) {
            params.push(`%${search}%`);
            conditions.push(`(u.name ILIKE $${params.length} OR u.email ILIKE $${params.length})`);
        }

        if (status && status !== 'all') {
            params.push(status);
            conditions.push(`ws.status = $${params.length}`);
        }

        if (type && type !== 'all') {
            params.push(type);
            conditions.push(`ws.workout_type = $${params.length}`);
        }

        if (date) {
            params.push(date);
            conditions.push(`ws.created_at::date = $${params.length}::date`);
        }

        if (conditions.length > 0) {
            query += ' WHERE ' + conditions.join(' AND ');
        }

        // Get total count for pagination
        const countQuery = `SELECT COUNT(*) FROM (${query}) as count_query`;
        const totalCountRes = await db.query(countQuery, params);
        const total = parseInt(totalCountRes.rows[0].count);

        // Add sorting and pagination
        query += ` ORDER BY ws.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
        params.push(parseInt(limit), offset);

        const result = await db.query(query, params);
        
        res.json({
            data: result.rows,
            pagination: {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                pages: Math.ceil(total / parseInt(limit))
            }
        });
    } catch (err) {
        console.error('Admin Get Workout Activity Error:', err);
        res.status(500).json({ message: 'Erro ao buscar atividade de treinos' });
    }
};

exports.getWorkoutDashboardStats = async (req, res) => {
    try {
        const today = new Date().toISOString().split('T')[0];
        
        const stats = await db.query(`
            SELECT 
                (SELECT COUNT(*) FROM workout_sessions WHERE created_at::date = $1::date) as total_today,
                (SELECT COUNT(*) FROM workout_sessions WHERE status = 'active') as active_now,
                (SELECT COUNT(*) FROM workout_sessions WHERE status = 'completed' AND created_at::date = $1::date) as completed_today,
                (SELECT COALESCE(SUM(calories), 0) FROM workout_sessions WHERE created_at::date = $1::date) as calories_today
        `, [today]);

        res.json(stats.rows[0]);
    } catch (err) {
        console.error('Admin Get Workout Stats Error:', err);
        res.status(500).json({ message: 'Erro ao buscar estatísticas de treinos' });
    }
};

exports.getWorkoutSessionDetails = async (req, res) => {
    const { id } = req.params;
    try {
        const session = await db.query(`
            SELECT ws.*, u.name as user_name, u.email as user_email, wp.structured_plan as full_plan
            FROM workout_sessions ws
            JOIN users u ON ws.user_id = u.id
            LEFT JOIN workout_plans wp ON ws.plan_id = wp.id
            WHERE ws.id = $1
        `, [id]);

        if (session.rows.length === 0) return res.status(404).json({ message: 'Sessão não encontrada' });

        const exerciseProgress = await db.query(`
            SELECT * FROM user_workout_progress 
            WHERE user_id = $1 AND workout_plan_id = $2 AND workout_day = $3
            ORDER BY created_at ASC
        `, [session.rows[0].user_id, session.rows[0].plan_id, session.rows[0].workout_day]);

        res.json({
            session: session.rows[0],
            exercises: exerciseProgress.rows
        });
    } catch (err) {
        console.error('Admin Get Workout Session Details Error:', err);
        res.status(500).json({ message: 'Erro ao buscar detalhes da sessão' });
    }
};

// AI Food Memory Endpoints
exports.getAIDetectedFoods = async (req, res) => {
    const { search, sortBy = 'count' } = req.query;
    try {
        let query = 'SELECT * FROM ai_detected_foods';
        const params = [];

        if (search) {
            params.push(`%${search}%`);
            query += ' WHERE name ILIKE $1';
        }

        if (sortBy === 'recent') {
            query += ' ORDER BY last_detected_at DESC';
        } else if (sortBy === 'oldest') {
            query += ' ORDER BY last_detected_at ASC';
        } else {
            query += ' ORDER BY count DESC, last_detected_at DESC';
        }

        const result = await db.query(query, params);
        res.json(result.rows);
    } catch (err) {
        console.error('[Admin] Error fetching AI foods:', err);
        res.status(500).json({ message: 'Erro ao buscar memória da IA' });
    }
};

exports.migrateAIDetectedFoods = async (req, res) => {
    try {
        console.log('--- ADMIN: Starting AI Food Memory Migration ---');
        // Fetch all meals with ingredients
        const result = await db.query("SELECT ingredients FROM meals WHERE ingredients IS NOT NULL AND ingredients != '[]'");
        const allIngredients = result.rows;
        
        let totalProcessed = 0;
        let totalIngredients = 0;

        for (const row of allIngredients) {
            let ingredients = [];
            try {
                ingredients = typeof row.ingredients === 'string' ? JSON.parse(row.ingredients) : row.ingredients;
            } catch (e) { continue; }

            if (!Array.isArray(ingredients)) continue;

            for (const item of ingredients) {
                const normalized = item.trim().toLowerCase();
                if (!normalized) continue;

                await db.query(`
                    INSERT INTO ai_detected_foods (name, count, last_detected_at)
                    VALUES ($1, 1, CURRENT_TIMESTAMP)
                    ON CONFLICT (name) 
                    DO UPDATE SET 
                        count = ai_detected_foods.count + 1,
                        last_detected_at = CURRENT_TIMESTAMP
                `, [normalized]);
                totalIngredients++;
            }
            totalProcessed++;
        }

        logAdminAction(req.admin.id, `Migração de memória IA concluída: ${totalProcessed} refeições, ${totalIngredients} alimentos`, 'ai_memory', null);
        
        res.json({ 
            message: 'Migração concluída com sucesso', 
            processedMeals: totalProcessed,
            totalIngredients: totalIngredients 
        });
    } catch (err) {
        console.error('[Admin] Migration failed:', err);
        res.status(500).json({ message: 'Falha durante a migração da memória da IA' });
    }
};

/**
 * Exporta contatos dos usuários em formato Excel (.xlsx)
 * Filtros opcionais: country, status
 */
exports.exportUsers = async (req, res) => {
    try {
        const { country, status } = req.query;
        
        let query = `
            SELECT 
                name, 
                email, 
                phone, 
                country, 
                plan as plano, 
                subscription_status as status_assinatura,
                end_date as data_expiracao, 
                created_at as data_cadastro
            FROM users 
            WHERE role = 'user' AND phone IS NOT NULL AND phone != ''
        `;
        const params = [];

        if (country && country !== 'all') {
            params.push(country);
            // Case-insensitive search for country or country_code
            query += ` AND (country ILIKE $${params.length} OR country_code ILIKE $${params.length})`;
        }

        if (status && status !== 'all') {
            if (status === 'active') {
                query += " AND subscription_status = 'active'";
            } else if (status === 'inactive') {
                query += " AND (subscription_status != 'active' OR subscription_status IS NULL)";
            }
        }

        query += " ORDER BY created_at DESC";

        const result = await db.query(query, params);
        const users = result.rows;

        // Criar Workbook
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Contatos ProFit');

        // Configurar Colunas
        worksheet.columns = [
            { header: 'Nome', key: 'name', width: 30 },
            { header: 'Email', key: 'email', width: 35 },
            { header: 'Telefone', key: 'phone', width: 20 },
            { header: 'País', key: 'country', width: 20 },
            { header: 'Plano', key: 'plano', width: 15 },
            { header: 'Status', key: 'status_assinatura', width: 20 },
            { header: 'Expiração', key: 'data_expiracao', width: 20 },
            { header: 'Data Cadastro', key: 'data_cadastro', width: 20 }
        ];

        // Adicionar Linhas com formatação de telefone
        users.forEach(user => {
            let formattedPhone = user.phone.replace(/\s+/g, '').replace('+', '').replace('-', '').replace('(', '').replace(')', '');
            
            // Lógica de prefixo automático baseada no país se não tiver prefixo
            const normalizedCountry = (user.country || '').toLowerCase();
            if (!formattedPhone.startsWith('258') && !formattedPhone.startsWith('27') && !formattedPhone.startsWith('244')) {
                if (normalizedCountry.includes('moç') || normalizedCountry.includes('moz')) {
                    formattedPhone = '258' + formattedPhone;
                } else if (normalizedCountry.includes('afri') || normalizedCountry.includes('south')) {
                    formattedPhone = '27' + formattedPhone;
                } else if (normalizedCountry.includes('angol')) {
                    formattedPhone = '244' + formattedPhone;
                }
            }
            
            worksheet.addRow({
                name: user.name || 'N/A',
                email: user.email,
                phone: '+' + formattedPhone,
                country: user.country || 'N/A',
                plano: (user.plano || 'FREE').toUpperCase(),
                status_assinatura: user.status_assinatura || 'sem assinatura',
                data_expiracao: user.data_expiracao ? new Date(user.data_expiracao).toLocaleDateString('pt-BR') : 'N/A',
                data_cadastro: new Date(user.data_cadastro).toLocaleDateString('pt-BR')
            });
        });

        // Estilizar Cabeçalho
        const headerRow = worksheet.getRow(1);
        headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 12 };
        headerRow.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FF000000' } // Preto Premium
        };
        headerRow.alignment = { vertical: 'middle', horizontal: 'center' };

        // Enviar arquivo
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename=contatos_profit.xlsx');

        await workbook.xlsx.write(res);
        res.end();

        logAdminAction(req.admin.id, `Exportação de contatos (Filtros: ${country || 'todos'}, ${status || 'todos'})`, 'export', 'users');

    } catch (err) {
        console.error('[Admin] Erro ao exportar contatos:', err);
        res.status(500).json({ message: 'Erro ao gerar arquivo Excel' });
    }
};
