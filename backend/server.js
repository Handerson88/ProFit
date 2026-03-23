const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const db = require('./config/database');
const { v4: uuidv4 } = require('uuid');

console.log('Loading dependencies...');
const authRoutes = require('./routes/authRoutes');
console.log('authRoutes loaded');
const foodRoutes = require('./routes/foodRoutes');
console.log('foodRoutes loaded');
const mealRoutes = require('./routes/mealRoutes');
console.log('mealRoutes loaded');
const userRoutes = require('./routes/userRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const workoutRoutes = require('./routes/workoutRoutes');
const adminRoutes = require('./routes/adminRoutes');
const aiRoutes = require('./routes/aiRoutes');
const achievementRoutes = require('./routes/achievementRoutes');
console.log('notificationRoutes loaded');
const quizRoutes = require('./routes/quizRoutes');
const activityRoutes = require('./routes/activityRoutes');
const appRoutes = require('./routes/appRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const activityMiddleware = require('./middleware/activityMiddleware');
const authMiddleware = require('./middleware/auth');

const app = express();
console.log('Express app created');

// Request Logger
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

app.use(helmet({
  crossOriginResourcePolicy: false, // Allow images to be loaded across domains if needed
}));

// Rate Limiting
// const globalLimiter = rateLimit({
//   windowMs: 15 * 60 * 1000, // 15 minutes
//   max: 100, // Limit each IP to 100 requests per windowMs
//   standardHeaders: true,
//   legacyHeaders: false,
//   message: { message: 'Too many requests from this IP, please try again after 15 minutes' }
// });

// const loginLimiter = rateLimit({
//   windowMs: 60 * 60 * 1000, // 1 hour
//   max: 10, // Limit each IP to 10 login attempts per hour
//   message: { message: 'Too many login attempts from this IP, please try again after an hour' }
// });

// app.use('/api/', globalLimiter);
// app.use('/api/auth/login', loginLimiter);

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));
app.use('/uploads', express.static('uploads'));
console.log('Middleware configured');

// Database Initialization
const initDB = async () => {
  try {
    // 1. Core Profile & tracking
    await db.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY,
        name TEXT,
        email TEXT UNIQUE,
        password_hash TEXT,
        age INTEGER,
        weight NUMERIC,
        height NUMERIC,
        gender TEXT,
        goal TEXT,
        activity_level TEXT,
        target_weight NUMERIC,
        daily_calorie_target INTEGER,
        profile_photo TEXT,
        notifications_enabled BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Ensure invite columns exist on pre-existing databases
    await db.query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active',
      ADD COLUMN IF NOT EXISTS invite_token TEXT,
      ADD COLUMN IF NOT EXISTS invite_expires TIMESTAMP,
      ADD COLUMN IF NOT EXISTS plan_type TEXT DEFAULT 'free',
      ADD COLUMN IF NOT EXISTS scan_limit_per_day INTEGER DEFAULT 3,
      ADD COLUMN IF NOT EXISTS scans_used_today INTEGER DEFAULT 0,
      ADD COLUMN IF NOT EXISTS last_scan_date TIMESTAMP,
      ADD COLUMN IF NOT EXISTS has_paid BOOLEAN DEFAULT FALSE,
      ADD COLUMN IF NOT EXISTS referred_by UUID REFERENCES users(id) ON DELETE SET NULL,
      ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user',
      ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMP,
      ADD COLUMN IF NOT EXISTS last_active_at TIMESTAMP,
      ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE,
      ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT FALSE,
      ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'pending',
      ADD COLUMN IF NOT EXISTS last_payment_date TIMESTAMP,
      ADD COLUMN IF NOT EXISTS next_billing_date TIMESTAMP,
      ADD COLUMN IF NOT EXISTS subscription_active BOOLEAN DEFAULT FALSE,
      ADD COLUMN IF NOT EXISTS ai_language TEXT DEFAULT 'auto';
    `);

    await db.query(`
      CREATE TABLE IF NOT EXISTS goals (
          id UUID PRIMARY KEY,
          user_id UUID REFERENCES users(id) ON DELETE CASCADE,
          goal_type TEXT,
          target_weight NUMERIC,
          target_calories INTEGER,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 2. Core Food & Meals
    await db.query(`
      CREATE TABLE IF NOT EXISTS foods (
        id UUID PRIMARY KEY,
        name TEXT,
        calories INTEGER,
        protein NUMERIC,
        carbs NUMERIC,
        fat NUMERIC,
        source TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await db.query(`
      CREATE TABLE IF NOT EXISTS meals (
        id UUID PRIMARY KEY,
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        food_id UUID REFERENCES foods(id) ON DELETE SET NULL,
        food_name TEXT,
        meal_name TEXT,
        image_url TEXT,
        calories INTEGER,
        protein NUMERIC,
        carbs NUMERIC,
        fat NUMERIC,
        quantity INTEGER,
        meal_type TEXT,
        ingredients JSONB,
        nutrition_observation TEXT,
        date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 3. Activity Logs
    await db.query(`
      CREATE TABLE IF NOT EXISTS weight_logs (
          id UUID PRIMARY KEY,
          user_id UUID REFERENCES users(id) ON DELETE CASCADE,
          weight NUMERIC,
          date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await db.query(`
      CREATE TABLE IF NOT EXISTS water_logs (
          id UUID PRIMARY KEY,
          user_id UUID REFERENCES users(id) ON DELETE CASCADE,
          glasses INTEGER,
          date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await db.query(`
      CREATE TABLE IF NOT EXISTS workout_plans (
        id UUID PRIMARY KEY,
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        goal TEXT,
        level TEXT,
        days_per_week TEXT,
        location TEXT,
        duration TEXT,
        plan_text TEXT,
        structured_plan JSONB,
        next_plan_available_at TIMESTAMP,
        plan_start_date TIMESTAMP,
        plan_renewal_date TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // New: Flattened Workouts table for Admin view
    await db.query(`
      CREATE TABLE IF NOT EXISTS workouts (
        id UUID PRIMARY KEY,
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        user_email TEXT,
        user_name TEXT,
        goal TEXT,
        level TEXT,
        duration TEXT,
        exercises JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await db.query(`
      CREATE TABLE IF NOT EXISTS daily_calories (
        id UUID PRIMARY KEY,
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        date DATE NOT NULL,
        calories INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, date)
      )
    `);

    await db.query(`
      CREATE TABLE IF NOT EXISTS ai_conversations (
        id UUID PRIMARY KEY,
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await db.query(`
      CREATE TABLE IF NOT EXISTS ai_messages (
        id UUID PRIMARY KEY,
        conversation_id UUID REFERENCES ai_conversations(id) ON DELETE CASCADE,
        sender TEXT,
        message TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Admin Tables
    await db.query(`
      CREATE TABLE IF NOT EXISTS admins (
        id UUID PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        role TEXT DEFAULT 'admin',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await db.query(`
      CREATE TABLE IF NOT EXISTS admin_logs (
        id UUID PRIMARY KEY,
        admin_id UUID REFERENCES admins(id) ON DELETE CASCADE,
        action TEXT NOT NULL,
        target_type TEXT,
        target_id TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await db.query(`
      CREATE TABLE IF NOT EXISTS admin_preferences (
        admin_id UUID PRIMARY KEY REFERENCES admins(id) ON DELETE CASCADE,
        theme_mode TEXT DEFAULT 'light',
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await db.query(`
      CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await db.query(`
      CREATE TABLE IF NOT EXISTS tokens (
        token TEXT PRIMARY KEY,
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        type TEXT NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await db.query(`
      CREATE TABLE IF NOT EXISTS scanned_dishes (
        id UUID PRIMARY KEY,
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        dish_name TEXT,
        image_url TEXT,
        calories INTEGER,
        protein NUMERIC,
        carbs NUMERIC,
        fat NUMERIC,
        ingredients JSONB DEFAULT '[]',
        scan_source TEXT DEFAULT 'camera',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Ensure columns exist on pre-existing databases
    await db.query(`
      ALTER TABLE scanned_dishes 
      ADD COLUMN IF NOT EXISTS ingredients JSONB DEFAULT '[]',
      ADD COLUMN IF NOT EXISTS scan_source TEXT DEFAULT 'camera';
    `);

    await db.query(`
      CREATE TABLE IF NOT EXISTS ai_error_logs (
        id SERIAL PRIMARY KEY,
        user_id UUID REFERENCES users(id) ON DELETE SET NULL,
        error_message TEXT,
        stack_trace TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await db.query(`
      CREATE TABLE IF NOT EXISTS subscriptions (
        id UUID PRIMARY KEY,
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        plan_type TEXT NOT NULL,
        plan_price NUMERIC DEFAULT 599,
        status TEXT DEFAULT 'active',
        current_period_end TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await db.query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id UUID PRIMARY KEY,
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        title TEXT NOT NULL,
        message TEXT NOT NULL,
        type TEXT DEFAULT 'info',
        is_read BOOLEAN DEFAULT FALSE,
        sent_to_all BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await db.query(`
      CREATE TABLE IF NOT EXISTS notification_templates (
        id UUID PRIMARY KEY,
        title TEXT NOT NULL,
        message TEXT NOT NULL,
        type TEXT DEFAULT 'info',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await db.query(`
      CREATE TABLE IF NOT EXISTS user_devices (
        id UUID PRIMARY KEY,
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        subscription TEXT NOT NULL,
        device_type TEXT DEFAULT 'web',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await db.query(`
      CREATE TABLE IF NOT EXISTS scheduled_notifications (
        id UUID PRIMARY KEY,
        title TEXT NOT NULL,
        message TEXT NOT NULL,
        type TEXT DEFAULT 'info',
        scheduled_time TIMESTAMP,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await db.query(`
      CREATE TABLE IF NOT EXISTS daily_logs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        date DATE NOT NULL,
        calories INTEGER DEFAULT 0,
        protein INTEGER DEFAULT 0,
        carbs INTEGER DEFAULT 0,
        fat INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, date)
      )
    `);

    // Seed Templates
    const templateCheck = await db.query('SELECT COUNT(*) FROM notification_templates');
    if (parseInt(templateCheck.rows[0].count) === 0) {
      const templates = [
        ['Novo Treino Disponível', 'Um novo plano de treino personalizado foi gerado para você. Aproveite!', 'success'],
        ['Dica de Nutrição', 'Lembre-se de beber bastante água hoje para manter o metabolismo acelerado!', 'info'],
        ['Lembrete de Água', 'Você já registrou sua ingestão de água hoje?', 'warning'],
        ['Nova funcionalidade disponível 🚀', 'Acabamos de adicionar novos recursos no ProFit. Atualize o app e aproveite!', 'success']
      ];
      for (const t of templates) {
        await db.query(
          'INSERT INTO notification_templates (id, title, message, type) VALUES ($1, $2, $3, $4)',
          [uuidv4(), t[0], t[1], t[2]]
        );
      }
    }

    // Seed Initial Admin in USERS table for unified auth
    const adminUserEmail = 'admin@profit.com';
    const adminUserCheck = await db.query('SELECT * FROM users WHERE email = $1', [adminUserEmail]);
    if (adminUserCheck.rows.length === 0) {
      const bcrypt = require('bcryptjs');
      const hashedPassword = await bcrypt.hash('adminpassword123', 10);
      await db.query(
        'INSERT INTO users (id, name, email, password_hash, role) VALUES ($1, $2, $3, $4, $5)',
        [uuidv4(), 'Administrador ProFit', adminUserEmail, hashedPassword, 'admin']
      );
      console.log('Unified Admin user created in users table: admin@profit.com / adminpassword123');
    }

    // Seed Initial Admin in legacy admins table (for compatibility during transition if needed)
    const adminEmail = 'admin@profit.com';
    const adminCheck = await db.query('SELECT * FROM admins WHERE email = $1', [adminEmail]);
    if (adminCheck.rows.length === 0) {
      const bcrypt = require('bcryptjs');
      const hashedPassword = await bcrypt.hash('adminpassword123', 10);
      await db.query(
        'INSERT INTO admins (id, email, password_hash, role) VALUES ($1, $2, $3, $4)',
        [uuidv4(), adminEmail, hashedPassword, 'admin']
      );
      console.log('Initial admin user created: admin@profit.com / adminpassword123');
    }

    // Core Tracking & Progress
    await db.query(`
      CREATE TABLE IF NOT EXISTS quiz_responses (
        id UUID PRIMARY KEY,
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        question TEXT NOT NULL,
        answer JSONB NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, question)
      )
    `);

    await db.query(`
      CREATE TABLE IF NOT EXISTS user_progress (
        user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
        current_step TEXT,
        is_complete BOOLEAN DEFAULT FALSE,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await db.query(`
      CREATE TABLE IF NOT EXISTS user_activity_logs (
        id UUID PRIMARY KEY,
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        action TEXT NOT NULL,
        details JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await db.query(`
      CREATE TABLE IF NOT EXISTS payments (
        id UUID PRIMARY KEY,
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        amount NUMERIC DEFAULT 599,
        method TEXT,
        status TEXT DEFAULT 'pending',
        phone TEXT,
        transaction_id TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create Indexes
    await db.query('CREATE INDEX IF NOT EXISTS idx_daily_calories_user_date ON daily_calories(user_id, date);');
    await db.query('CREATE INDEX IF NOT EXISTS idx_meals_user_date ON meals(user_id, date);');
    await db.query('CREATE INDEX IF NOT EXISTS idx_weight_user_date ON weight_logs(user_id, date);');
    await db.query('CREATE INDEX IF NOT EXISTS idx_water_user_date ON water_logs(user_id, date);');
    await db.query('CREATE INDEX IF NOT EXISTS idx_workout_plans_user ON workout_plans(user_id);');
    // await db.query('CREATE INDEX IF NOT EXISTS idx_steps_user_date ON steps_logs(user_id, date);');

    console.log('Tables verified/created with full schema.');

    // Seed Data if empty
    const foodCheck = await db.query('SELECT COUNT(*) FROM foods');
    if (parseInt(foodCheck.rows[0].count) === 0) {
      console.log('Seeding sample food data...');
      const samples = [
        ['Rice', 130, 2, 28, 0],
        ['Egg', 155, 13, 1, 11],
        ['Chicken Breast', 165, 31, 0, 3],
        ['Avocado', 160, 2, 9, 15]
      ];
      for (const s of samples) {
        await db.query(
          'INSERT INTO foods (id, name, calories, protein, carbs, fat, source) VALUES ($1, $2, $3, $4, $5, $6, $7)',
          [uuidv4(), s[0], s[1], s[2], s[3], s[4], 'system']
        );
      }
      console.log('Sample data seeded.');
    }

  } catch (err) {
    console.error('Initialization error:', err);
  }
};

console.log('Initializing database...');
initDB();
console.log('Database init called');

// Health Check
app.get('/api/health', (req, res) => res.json({ status: 'ok', time: new Date() }));

// Database Health Check for Production Verification
app.get('/api/db-check', async (req, res) => {
  try {
    const result = await db.query('SELECT NOW()');
    res.json({ 
      status: 'connected', 
      db_time: result.rows[0].now,
      env: {
        has_db_url: !!(process.env.DATABASE_URL || process.env.URL_BANCO_DE_DADOS),
        has_jwt: !!process.env.JWT_SECRET
      }
    });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

// Keep process alive if app.listen fails to hold it
setInterval(() => {}, 1000 * 60 * 60);

// Apply Activity Tracking and Auth Middleware to high-traffic groups
// We apply it BEFORE the specific route groups to ensure it runs for all endpoints in that group
app.use('/api/user', authMiddleware, activityMiddleware, userRoutes);
app.use('/api/meals', authMiddleware, activityMiddleware, mealRoutes);
app.use('/api/workouts', authMiddleware, activityMiddleware, workoutRoutes);
app.use('/api/ai', authMiddleware, activityMiddleware, aiRoutes);

// Other Routes
app.use('/api/auth', authRoutes);
app.use('/api/foods', foodRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/achievements', achievementRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/quiz', quizRoutes);
app.use('/api/activity', activityRoutes);
app.use('/api/app', appRoutes);
app.use('/api/payment', paymentRoutes);

console.log('Routes registered with activity tracking');

// Catch-all for 404s
app.use((req, res, next) => {
  console.warn(`${new Date().toISOString()} - 404 NOT FOUND - ${req.method} ${req.url}`);
  res.status(404).json({ message: `Route ${req.method} ${req.url} not found on this server` });
});

// Socket.io Integration
const http = require('http');
const { Server } = require('socket.io');
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

app.set('socketio', io);

io.on('connection', (socket) => {
  console.log('New connection:', socket.id);
  
  socket.on('join_conversation', (conversationId) => {
    socket.join(conversationId);
    console.log(`Socket ${socket.id} joined conversation: ${conversationId}`);
  });

  socket.on('join_user', (userId) => {
    socket.join(`user_${userId}`);
    console.log(`Socket ${socket.id} joined user room: user_${userId}`);
  });

  socket.on('join_admin', () => {
    socket.join('admin_room');
    console.log(`Socket ${socket.id} joined admin room`);
  });

  socket.on('typing', ({ conversationId, sender, isTyping }) => {
    // Broadcast to everyone in the room EXCEPT the sender
    socket.to(conversationId).emit('user_typing', { sender, isTyping });
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 5000;
if (process.env.NODE_ENV !== 'production') {
  server.listen(PORT, () => {
    console.log(`Server running on port ${PORT} with Socket.io enabled`);
  });
}

const cronService = require('./services/cronService');
cronService.initCronJobs(io);

module.exports = app;

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('GLOBAL ERROR:', err);
  res.status(500).json({ message: err.message || 'Internal Server Error' });
});
