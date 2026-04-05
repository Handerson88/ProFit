const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function migrate() {
  console.log('🚀 Iniciando migração da tabela workouts...');

  try {
    // 1. Adicionar colunas se não existirem
    const addColumnsQuery = `
      ALTER TABLE workouts ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'IA';
      ALTER TABLE workouts ADD COLUMN IF NOT EXISTS calories INTEGER DEFAULT 0;
      ALTER TABLE workouts ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';
      ALTER TABLE workouts ADD COLUMN IF NOT EXISTS structured_plan JSONB;
    `;

    // Como o supabase-js não tem um método direto para rodar SQL arbitrário facilmente sem a extensão, 
    // e eu não tenho o `pg` aqui configurado para rodar scripts avulsos facilmente (tenho o server.js),
    // vou tentar rodar via interface de comando ou apenas garantir que o código no server.js seja robusto.
    
    // Na verdade, eu tenho a ferramenta mcp_supabase-mcp-server_execute_sql!
    console.log('Utilizando MCP para executar SQL...');
  } catch (err) {
    console.error('Erro na migração:', err);
  }
}

migrate();
