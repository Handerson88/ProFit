require('dotenv').config();
const axios = require('axios');

async function testOpenAI() {
  console.log('--- Testando Conexão OpenAI ---');
  console.log('Usando Key:', process.env.OPENAI_API_KEY ? (process.env.OPENAI_API_KEY.substring(0, 10) + '...') : 'MISSING');
  
  try {
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: "Diga 1 palavra motivacional." }],
        max_tokens: 10
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );
    console.log('SUCESSO!');
    console.log('Resposta:', response.data.choices[0].message.content);
  } catch (error) {
    console.error('FALHA!');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.error('Mensagem:', error.message);
    }
  }
}

testOpenAI();
