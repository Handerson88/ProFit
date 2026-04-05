process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const db = require('./config/database');

async function run() {
    try {
        console.log('--- Verificando estrutura da tabela USERS ---');
        const res = await db.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'users'
            ORDER BY column_name
        `);
        
        if (res.rows.length === 0) {
            console.log('Tabela "users" não encontrada no esquema padrão.');
            
            const tables = await db.query("SELECT table_name, table_schema FROM information_schema.tables WHERE table_name = 'users'");
            console.log('Ocorrências de "users":', tables.rows);
        } else {
            console.log('Colunas de Users:');
            res.rows.forEach(r => console.log(` - ${r.column_name} (${r.data_type})`));
        }
        
        process.exit(0);
    } catch (err) {
        console.error('Erro ao verificar tabela:', err);
        process.exit(1);
    }
}

run();
