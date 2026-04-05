const db = require('./config/database');
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';


async function migrateSubscriptions() {
    console.log('--- Iniciando Migração de Assinaturas ---');
    try {
        // 1. Update Users Table
        console.log('Atualizando tabela de usuários...');
        await db.query(`
            ALTER TABLE users 
            ADD COLUMN IF NOT EXISTS subscription_status VARCHAR(50) DEFAULT 'sem assinatura',
            ADD COLUMN IF NOT EXISTS is_blocked BOOLEAN DEFAULT false;
        `);

        // 2. Create Subscriptions Table
        console.log('Criando tabela de assinaturas...');
        await db.query(`
            CREATE TABLE IF NOT EXISTS subscriptions (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                user_id UUID REFERENCES users(id) ON DELETE CASCADE,
                start_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                end_date TIMESTAMP WITH TIME ZONE,
                status VARCHAR(50) DEFAULT 'active',
                is_first_payment BOOLEAN DEFAULT true,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // 3. Ensure payments table has email
        console.log('Verificando tabela de pagamentos...');
        await db.query(`
            ALTER TABLE payments 
            ADD COLUMN IF NOT EXISTS email VARCHAR(255);
        `);

        // 4. Initialize existing users (optional but good for consistency)
        // Set 'active' if they were already 'PAID' or 'PRO'
        await db.query(`
            UPDATE users 
            SET subscription_status = 'ativo' 
            WHERE plan = 'PRO' OR payment_status = 'PAID';
        `);

        console.log('--- Migração concluída com sucesso! ---');
        process.exit(0);
    } catch (error) {
        console.error('Erro na migração:', error);
        process.exit(1);
    }
}

migrateSubscriptions();
