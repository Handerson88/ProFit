const { Client } = require('pg');
require('dotenv').config();

async function migrate() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('Connected to database');
    
    const query = `
      -- Enable uuid-ossp if not enabled
      CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

      CREATE TABLE IF NOT EXISTS achievements (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        name VARCHAR(100) NOT NULL,
        description TEXT,
        icon_name VARCHAR(50),
        criteria_type VARCHAR(50), 
        criteria_value INTEGER,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS user_achievements (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        achievement_id UUID REFERENCES achievements(id) ON DELETE CASCADE,
        earned_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, achievement_id)
      );

      -- Insert some default achievements
      INSERT INTO achievements (name, description, icon_name, criteria_type, criteria_value)
      VALUES
        ('Primeiro Passo', 'Registre sua primeira refeição no app.', 'Star', 'scan_count', 1),
        ('Explorador de Sabores', 'Registre 10 refeições diferentes.', 'Utensils', 'scan_count', 10),
        ('Consistência é Tudo', 'Atinja sua meta calórica por 3 dias seguidos.', 'Zap', 'streak_days', 3),
        ('Mestre do Foco', 'Complete 7 dias de registros sem falhar.', 'Target', 'streak_days', 7),
        ('Atleta de Elite', 'Complete seu primeiro plano de treino de 30 dias.', 'Crown', 'workout_plan_completion', 1)
      ON CONFLICT DO NOTHING;
    `;

    await client.query(query);
    console.log('Migration successful: Gamification tables created');
  } catch (err) {
    console.error('Migration failed:', err);
  } finally {
    await client.end();
  }
}

migrate();
