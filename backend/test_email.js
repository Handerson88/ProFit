require('dotenv').config();
const { sendWelcomeEmail } = require('./services/emailService');

async function testEmail() {
  console.log('Iniciando teste de envio de email...');
  try {
    const emailTo = 'handersonjulio619@gmail.com';
    const userName = 'Handerson';
    
    console.log(`Disparando template de boas-vindas para: ${emailTo}`);
    const result = await sendWelcomeEmail(emailTo, userName);
    
    console.log('✅ Sucesso! Resposta da Resend:', result);
  } catch (error) {
    console.error('❌ Falha no teste de email:', error);
  }
}

testEmail();
