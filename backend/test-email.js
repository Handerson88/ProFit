require('dotenv').config();
const { Resend } = require('resend');
const resend = new Resend(process.env.RESEND_API_KEY);

async function test() {
  try {
    const data = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'ProFit <noreply@myprofittness.com>',
      to: 'amadoutayob88@gmail.com',
      subject: 'Teste de API Resend',
      html: '<strong>it works!</strong>'
    });
    console.log("SUCCESS:", data);
  } catch (error) {
    console.error("ERROR:", error);
  }
}
test();
