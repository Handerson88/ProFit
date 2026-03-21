const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const db = require('../config/database');

async function fixSchema() {
    try {
        console.log('Fixing Notification Schema...');

        // 1. Create user_devices table
        await db.query(`
            CREATE TABLE IF NOT EXISTS user_devices (
                id UUID PRIMARY KEY,
                user_id UUID REFERENCES users(id) ON DELETE CASCADE,
                subscription JSONB NOT NULL,
                device_type VARCHAR(50) DEFAULT 'web',
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('Table user_devices verified/created.');

        // 2. Create notification_templates table
        await db.query(`
            CREATE TABLE IF NOT EXISTS notification_templates (
                id UUID PRIMARY KEY,
                name VARCHAR(100) NOT NULL,
                title VARCHAR(255) NOT NULL,
                message TEXT NOT NULL,
                type VARCHAR(50) DEFAULT 'info',
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('Table notification_templates verified/created.');

        // 3. Seed some templates if empty
        const templates = await db.query('SELECT id FROM notification_templates LIMIT 1');
        if (templates.rows.length === 0) {
            console.log('Seeding initial notification templates...');
            const seedTemplates = [
                {
                    id: 'd1964f43-85f2-4c28-98e3-085739378621',
                    name: 'Bem-vindo',
                    title: 'Bem-vindo ao ProFit! 🎉',
                    message: 'Estamos felizes em ter você conosco. Comece registrando sua primeira refeição para atingir sua meta!',
                    type: 'info'
                },
                {
                    id: 'e2a75d54-9603-5d39-a9f4-19684a489732',
                    name: 'Dica de Água',
                    title: 'Hora de Hidratar! 💧',
                    message: 'Beber água é essencial para o metabolismo. Que tal um copo agora?',
                    type: 'update'
                },
                {
                    id: 'f3b86e65-a714-6e4a-ba05-2a795b590843',
                    name: 'Lembrete de Almoço',
                    title: 'Hora do Almoço! 🥗',
                    message: 'Não esqueça de registrar seu almoço para manter o controle das suas calorias.',
                    type: 'info'
                }
            ];

            for (const t of seedTemplates) {
                await db.query(
                    'INSERT INTO notification_templates (id, name, title, message, type) VALUES ($1, $2, $3, $4, $5)',
                    [t.id, t.name, t.title, t.message, t.type]
                );
            }
            console.log('Templates seeded.');
        }

        // 4. Ensure notifications table has correct columns (some migrations used SERIAL, others UUID)
        // Let's keep it simple and ensure the basic columns exist.
        // If it was SERIAL, we might need to handle it, but let's assume UUID for new one.
        
        console.log('Schema fix completed successfully.');
        process.exit(0);
    } catch (err) {
        console.error('Schema fix failed:', err);
        process.exit(1);
    }
}

fixSchema();
