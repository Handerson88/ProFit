const db = require('../config/database');
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

async function migrate() {
    console.log('🚀 Iniciando migração para exportação de contatos...');
    try {
        // 1. Adicionar colunas de Telefone e País
        await db.query(`
            ALTER TABLE users 
            ADD COLUMN IF NOT EXISTS phone TEXT,
            ADD COLUMN IF NOT EXISTS country TEXT,
            ADD COLUMN IF NOT EXISTS phone_prefix TEXT,
            ADD COLUMN IF NOT EXISTS country_code TEXT;
        `);
        console.log('✅ Colunas phone e country adicionadas.');

        // 2. Criar índices para performance (opcional mas recomendado)
        await db.query(`
            CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);
            CREATE INDEX IF NOT EXISTS idx_users_country ON users(country);
        `);
        console.log('✅ Índices criados.');

        // 3. (Opcional) Migrar telefones existentes da tabela payments se o user_id bater
        // Isso ajuda a popular o banco com o que já temos
        console.log('🔄 Tentando backfill de telefones a partir de pagamentos...');
        await db.query(`
            UPDATE users u
            SET phone = p.phone
            FROM payments p
            WHERE u.id = p.user_id 
            AND u.phone IS NULL 
            AND p.phone IS NOT NULL;
        `);
        console.log('✅ Backfill de telefones concluído.');

        console.log('🎉 Migração finalizada com sucesso!');
        process.exit(0);
    } catch (err) {
        console.error('❌ Erro na migração:', err);
        process.exit(1);
    }
}

migrate();
