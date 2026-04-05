require('dotenv').config();
const { sendWelcomeEmail } = require('./services/emailService');

async function testEmail() {
  console.log('Iniciando teste de envio de email...');
  try {
    const user = { email: 'handersonjulio619@gmail.com', name: 'Handerson', id: 1 };
    
    console.log(`Disparando template de boas-vindas para: ${user.email}`);
    const result = await sendWelcomeEmail(user);
    
    console.log('✅ Sucesso! Resposta da Resend:', result);
  } catch (error) {
    console.error('❌ Falha no teste de email:', error);
  }
}

testEmail();
