require('dotenv').config();
const db = require('../config/database');
const { v4: uuidv4 } = require('uuid');

async function migrate() {
    console.log('Starting Notification Templates migration...');
    try {
        // Create Table
        await db.query(`
            CREATE TABLE IF NOT EXISTS notification_templates (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                name TEXT NOT NULL,
                title TEXT NOT NULL,
                message TEXT NOT NULL,
                type TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('Table notification_templates verified/created.');

        // Seed Data
        const templates = [
            {
                name: 'Boas-vindas',
                title: 'Bem-vindo ao ProFit 💪',
                message: 'Estamos felizes por ter você aqui! Comece hoje seu treino e acompanhe sua evolução no ProFit.',
                type: 'update'
            },
            {
                name: 'Lembrete de Treino',
                title: 'Hora de treinar 🔥',
                message: 'Não esqueça do seu treino de hoje! Pequenos passos todos os dias geram grandes resultados.',
                type: 'info'
            },
            {
                name: 'Motivação',
                title: 'Você consegue! 💪',
                message: 'Continue firme no seu objetivo. Cada treino te deixa mais perto da melhor versão de você.',
                type: 'promotion' // Closer to "orange" motivation
            },
            {
                name: 'Nova Funcionalidade',
                title: 'Nova funcionalidade disponível 🚀',
                message: 'Acabamos de adicionar novos recursos no ProFit. Atualize o app e aproveite!',
                type: 'update'
            },
            {
                name: 'Promoção de Plano',
                title: 'Oferta especial 🎉',
                message: 'Aproveite nossa promoção e desbloqueie todos os treinos premium no ProFit.',
                type: 'promotion'
            },
            {
                name: 'Meta Atingida',
                title: 'Parabéns pela sua evolução 🏆',
                message: 'Você atingiu uma nova meta! Continue assim e conquiste resultados incríveis.',
                type: 'promotion'
            },
            {
                name: 'Lembrete de Dieta',
                title: 'Hora da sua refeição saudável 🥗',
                message: 'Não esqueça de registrar sua alimentação no ProFit e manter sua dieta equilibrada.',
                type: 'info'
            },
            {
                name: 'Retorno ao App',
                title: 'Sentimos sua falta 👀',
                message: 'Volte ao ProFit e continue sua jornada fitness. Seu progresso está esperando!',
                type: 'promotion'
            }
        ];

        for (const t of templates) {
            const check = await db.query('SELECT id FROM notification_templates WHERE name = $1', [t.name]);
            if (check.rows.length === 0) {
                await db.query(
                    'INSERT INTO notification_templates (name, title, message, type) VALUES ($1, $2, $3, $4)',
                    [t.name, t.title, t.message, t.type]
                );
                console.log(`Seeded template: ${t.name}`);
            }
        }

        console.log('Migration completed successfully.');
        process.exit(0);
    } catch (err) {
        console.error('Migration failed:', err);
        process.exit(1);
    }
}

migrate();
