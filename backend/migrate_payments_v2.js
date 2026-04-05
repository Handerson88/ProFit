process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const db = require('./config/database');

async function migrate() {
    try {
        console.log('--- Iniciando Migração de Pagamentos v2 ---');

        // 1. Update Users table
        console.log('Atualizando tabela users...');
        await db.query(`
            ALTER TABLE users 
            ADD COLUMN IF NOT EXISTS plano_status TEXT DEFAULT 'inativo',
            ADD COLUMN IF NOT EXISTS data_expiracao TIMESTAMP;
        `);
        
        // Sync existing data to new columns (If end_date and subscription_status exist)
        const checkCols = await db.query(`
            SELECT column_name FROM information_schema.columns 
            WHERE table_name = 'users' AND column_name IN ('subscription_status', 'end_date')
        `);
        const hasSubStatus = checkCols.rows.some(r => r.column_name === 'subscription_status');
        const hasEndDate = checkCols.rows.some(r => r.column_name === 'end_date');

        if (hasSubStatus) {
            console.log('Sincronizando plano_status...');
            await db.query(`
                UPDATE users SET plano_status = CASE 
                    WHEN subscription_status = 'ativo' THEN 'ativo' 
                    ELSE 'inativo' 
                END WHERE plano_status = 'inativo' AND subscription_status = 'ativo';
            `);
        }

        if (hasEndDate) {
            console.log('Sincronizando data_expiracao...');
            await db.query(`
                UPDATE users SET data_expiracao = end_date 
                WHERE data_expiracao IS NULL AND end_date IS NOT NULL;
            `);
        }

        // 2. Update Payments table
        console.log('Verificando tabela payments...');
        const payCols = await db.query(`
            SELECT column_name FROM information_schema.columns 
            WHERE table_name = 'payments' AND column_name IN ('amount', 'valor')
        `);
        const hasAmount = payCols.rows.some(r => r.column_name === 'amount');
        const hasValor = payCols.rows.some(r => r.column_name === 'valor');

        if (hasAmount && !hasValor) {
            console.log('Renomeando amount para valor...');
            await db.query(`ALTER TABLE payments RENAME COLUMN amount TO valor;`);
            await db.query(`ALTER TABLE payments ADD COLUMN IF NOT EXISTS amount NUMERIC;`);
            await db.query(`UPDATE payments SET amount = valor WHERE amount IS NULL;`);
        } else if (!hasAmount && hasValor) {
            console.log('Ajustando coluna amount para compatibilidade...');
            await db.query(`ALTER TABLE payments ADD COLUMN IF NOT EXISTS amount NUMERIC;`);
            await db.query(`UPDATE payments SET amount = valor WHERE amount IS NULL;`);
        } else if (hasAmount && hasValor) {
            console.log('Colunas amount e valor já existem.');
        }

        // 3. Update Subscriptions table
        console.log('Atualizando tabela subscriptions...');
        await db.query(`
            ALTER TABLE subscriptions 
            ADD COLUMN IF NOT EXISTS data_inicio TIMESTAMP DEFAULT NOW(),
            ADD COLUMN IF NOT EXISTS data_expiracao TIMESTAMP;
        `);
        
        // Sync Subscriptions (If current_period_end or start_date exist)
        const subCols = await db.query(`
            SELECT column_name FROM information_schema.columns 
            WHERE table_name = 'subscriptions' AND column_name IN ('start_date', 'end_date', 'current_period_end')
        `);
        const hasSubStart = subCols.rows.some(r => r.column_name === 'start_date');
        const hasSubEnd = subCols.rows.some(r => r.column_name === 'end_date');
        const hasPeriodEnd = subCols.rows.some(r => r.column_name === 'current_period_end');

        if (hasSubStart) {
            await db.query(`UPDATE subscriptions SET data_inicio = start_date WHERE data_inicio IS NULL;`);
        } else {
            await db.query(`UPDATE subscriptions SET data_inicio = created_at WHERE data_inicio IS NULL;`);
        }

        if (hasSubEnd) {
            await db.query(`UPDATE subscriptions SET data_expiracao = end_date WHERE data_expiracao IS NULL;`);
        } else if (hasPeriodEnd) {
            await db.query(`UPDATE subscriptions SET data_expiracao = current_period_end WHERE data_expiracao IS NULL;`);
        }

        console.log('--- Migração concluída com sucesso! ---');
        process.exit(0);
    } catch (err) {
        console.error('Erro na migração:', err);
        process.exit(1);
    }
}

migrate();
