const db = require('../config/database');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const jwt = require('jsonwebtoken');
const emailService = require('../services/emailService');

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
        const activeToday = await db.query("SELECT COUNT(DISTINCT user_id) FROM meals WHERE date >= CURRENT_DATE");
        const activeWeekly = await db.query("SELECT COUNT(DISTINCT user_id) FROM meals WHERE date >= CURRENT_DATE - INTERVAL '7 days'");
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
                COUNT(*) FILTER (WHERE role = 'user' AND plan_type = 'pro' AND payment_status = 'paid' AND (expiration_date IS NULL OR expiration_date > NOW())) as pro,
                COUNT(*) FILTER (WHERE role = 'user' AND plan_type = 'free') as free
            FROM users
        `);
        const { total, pro, free } = usersRes.rows[0];
        
        const total_users = parseInt(total || 0);
        const pro_users = parseInt(pro || 0);
        const free_users = parseInt(free || 0);
        const paywallActive = total_users > 20;

        // 2. Revenue (Only approved/paid payments)
        const revenueRes = await db.query("SELECT SUM(amount) as total FROM payments WHERE status IN ('approved', 'paid', 'completed')");
        const totalRevenue = parseFloat(revenueRes.rows[0].total || 0);

        // 3. MRR (Price = 599 MZN)
        const mrr = pro_users * 599;

        // 4. Payments count
        const paymentsCountRes = await db.query("SELECT COUNT(*) FROM payments WHERE status IN ('approved', 'paid', 'completed')");
        const totalPayments = parseInt(paymentsCountRes.rows[0].count || 0);

        // 5. Chart Data (Last 7 days growth)
        const chartRes = await db.query(`
            SELECT 
                to_char(date_trunc('day', d), 'Dy') as day_name,
                (SELECT COUNT(*) FROM users WHERE created_at <= d + interval '1 day' AND role = 'user') as users_count,
                (SELECT COUNT(*) FROM meals WHERE date = d::date) as meals_count
            FROM generate_series(CURRENT_DATE - interval '6 days', CURRENT_DATE, interval '1 day') d
            ORDER BY d
        `);

        const activityData = chartRes.rows.map(row => ({
            name: row.day_name,
            users: parseInt(row.users_count),
            meals: parseInt(row.meals_count)
        }));

        res.json({
            total_users,
            pro_users,
            free_users,
            paywall_active: paywallActive,
            total_revenue: totalRevenue,
            mrr,
            total_payments: totalPayments,
            activityData
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
            SELECT id, name, email, created_at, status, has_paid, scan_limit_per_day,
            (SELECT name FROM users u2 WHERE u2.id = users.referred_by) as referrer_name,
            (SELECT date FROM meals WHERE user_id = users.id ORDER BY date DESC LIMIT 1) as last_activity
            FROM users 
            ORDER BY created_at DESC
        `);
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Erro ao buscar usuários' });
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
    const { status } = req.body; // 'active', 'blocked', 'pending_invite'
    try {
        await db.query('UPDATE users SET status = $1 WHERE id = $2', [status, id]);
        const action = status === 'blocked' ? 'Bloqueio de usuário' : 'Desbloqueio de usuário';
        logAdminAction(req.admin.id, `${action}: ${id}`, 'user', id);
        res.json({ message: `Status do usuário atualizado para ${status}`, status });
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
    const id = uuidv4();
    const token = uuidv4(); // Unique invite token

    try {
        // 1. Check if user already exists
        const checkResult = await db.query('SELECT * FROM users WHERE email = $1', [email]);
        if (checkResult.rows.length > 0) {
            return res.status(409).json({ message: 'Este email já está registrado.' });
        }

        // 2. Create user with pending_invite status
        await db.query(
            'INSERT INTO users (id, name, email, scan_limit_per_day, status, invite_token) VALUES ($1, $2, $3, $4, $5, $6)',
            [id, name, email, scan_limit || 3, 'pending_invite', token]
        );

        // 3. Log action
        logAdminAction(req.admin.id, `Convite enviado para ${email}`, 'user', id);

        // 4. Send Email
        const frontUrl = process.env.FRONTEND_URL || 'http://localhost:5174';
        const inviteLink = `${frontUrl}/accept-invite?token=${token}`;
        const inviterName = 'Administração ProFit';
        
        await emailService.sendInviteEmail(email, inviterName, inviteLink);
        
        console.log(`[ADMIN] Convite real enviado para ${email}`);
        
        res.json({ 
            message: 'Convite enviado com sucesso!', 
            inviteLink,
            user_id: id 
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
        const paidUsersRes = await db.query("SELECT COUNT(*) FROM users WHERE has_paid = true");
        const totalUsersRes = await db.query("SELECT COUNT(*) FROM users");
        const revenueRes = await db.query("SELECT SUM(amount) as total FROM payments WHERE status = 'approved'");
        
        const paidCount = parseInt(paidUsersRes.rows[0].count);
        const totalCount = parseInt(totalUsersRes.rows[0].count);
        const totalRevenue = parseFloat(revenueRes.rows[0].total || 0);

        const mrr = paidCount * 599;
        const arpu = totalCount > 0 ? (totalRevenue / totalCount) : 0;
        
        // Simplified growth calculation
        const thisMonthPaidRes = await db.query("SELECT COUNT(*) FROM users WHERE has_paid = true AND created_at >= date_trunc('month', CURRENT_DATE)");
        const thisMonthPaid = parseInt(thisMonthPaidRes.rows[0].count);
        const growth = paidCount > 0 ? Math.round((thisMonthPaid / paidCount) * 100) : 0;

        res.json({
            mrr,
            subscribers: paidCount,
            arpu,
            growth: growth || 0
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
