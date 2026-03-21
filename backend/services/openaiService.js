const axios = require('axios');
const fs = require('fs');

async function analyzeFoodImage(imagePath) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY is not configured');
  }

  // Convert image to base64
  const imageBuffer = fs.readFileSync(imagePath);
  const base64Image = imageBuffer.toString('base64');

const prompt = `Você agora é um Especialista de Visão Computacional e Nutrição de Elite.
Sua tarefa é analisar a imagem de um prato de comida e fornecer uma análise nutricional MASTER, profissional e visualmente precisa.

PRIMEIRO PASSO: Analise a qualidade da imagem.
Se a foto estiver: desfocada, muito escura, prato não visível ou com o alimento cortado, defina "is_quality_good": false e dê uma dica em "quality_message".

SEGUNDO PASSO: Identificação e Nutrição.
1. GERAÇÃO DO NOME DO PRATO: Crie um nome CURTO, NATURAL e CLARO (máximo 2 linhas). Exemplos: "Frango grelhado com batata doce" ou "Salada Tropical".
2. INGREDIENTES: Identifique o máximo de ingredientes visíveis (ex: alface, cebola, tomate).
3. CALORIAS E MACROS: Estime com precisão as Calorias (kcal), Proteínas (g), Carboidratos (g) e Gorduras (g) do prato total.

Retorne APENAS o objeto JSON abaixo:
{
  "is_quality_good": true,
  "quality_message": null,
  "dish_name": "Nome curto e claro aqui",
  "calories": 450,
  "protein": 32,
  "carbs": 28,
  "fat": 18,
  "ingredients": ["item 1", "item 2", "item 3"],
  "nutrition_observation": "Breve comentário profissional sobre o equilíbrio do prato",
  "recommendation": "Uma dica rápida de nutrição"
}`;

  try {
    console.log('[OpenAI] Sending image for analysis (gpt-4o-mini)...');
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: "gpt-4o-mini",
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: prompt },
              {
                type: "image_url",
                image_url: {
                  url: `data:image/jpeg;base64,${base64Image}`
                }
              }
            ]
          }
        ],
        response_format: { type: "json_object" }
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        }
      }
    );

    const result = JSON.parse(response.data.choices[0].message.content);
    return result;
  } catch (err) {
    console.error('OpenAI API Error:', err.response ? err.response.data : err.message);
    throw new Error('Failed to analyze food image');
  }
}

async function generateWorkoutStructuredPlan(goal, level, days, location, duration, history = []) {
  try {
    const historyContext = history.length > 0 
      ? `Histórico recente de treinos: ${JSON.stringify(history)}. Analise a consistência. Se o usuário perdeu treinos, ajuste para ser mais realista. Se completou tudo, desafie-o.`
      : "Este é o primeiro plano do usuário. Crie algo motivador.";

    const prompt = `Você agora é um Personal Trainer de Elite (PT-BR).
Sua tarefa é criar um plano de treino MASTER e ALTAMENTE MOTIVADOR.

DADOS DO USUÁRIO:
Objetivo: ${goal}
Nível: ${level}
Frequência: ${days} dias por semana
Local: ${location}
Duração: ${duration}
${historyContext}

REGRAS DE ESTRUTURA (OBRIGATÓRIO):
1. Cada dia de treino DEVE conter entre 6 e 8 exercícios (Volume Master para Hipertrofia).
2. Se o dia tiver múltiplos grupos (ex: Peito + Tríceps), distribua os exercícios proporcionalmente (ex: 4 para peito, 3 para tríceps).
3. "muscle_group" deve ser: peito, costas, pernas, biceps, triceps, ombro, abdomem, ou cardio.
4. Os exercícios devem ser variados e condizentes com o objetivo (ex: hipertrofia = pesos, emagrecimento = circuitos/intensidade).

REGRAS DE SEQUÊNCIA DE DIAS (CRITICAL):
- Gere treinos APENAS para os dias em sequência, SEMPRE começando na Segunda-feira.
- Se frequência = 3 dias, gere para: Segunda-feira, Terça-feira, Quarta-feira.
- Se frequência = 4 dias, gere para: Segunda-feira, Terça-feira, Quarta-feira, Quinta-feira.
- Se frequência = 5 dias, gere para: Segunda-feira, Terça-feira, Quarta-feira, Quinta-feira, Sexta-feira.
- Se frequência = 6 dias, gere para: Segunda-feira, Terça-feira, Quarta-feira, Quinta-feira, Sexta-feira, Sábado.
- Se frequência = 7 dias, gere para: Segunda-feira, Terça-feira, Quarta-feira, Quinta-feira, Sexta-feira, Sábado, Domingo.
- NUNCA pule dias (ex: nunca gere Segunda e depois Quarta).

REGRAS DE CONTEÚDO PARA CADA EXERCÍCIO:
- "name": Nome do exercício em português.
- "sets": Número de séries (normalmente 3 ou 4).
- "reps": Faixa de repetições (ex: "8-12", "12-15").
- "rest": Tempo de descanso (ex: "60-90s").
- "instructions": Uma dica técnica curta e motivadora (ex: "Controle a descida e exploda na subida!").

JSON de Saída:
{
  "title": "${goal} - ${level}",
  "message": "Feedback inteligente sobre progresso e motivação",
  "daily_workouts": [
    {
      "day": "Segunda-feira",
      "muscles": "Grupo Muscular Alvo",
      "exercises": [
        {
          "name": "Nome",
          "sets": 4,
          "reps": "10-12",
          "rest": "60s",
          "muscle_group": "peito",
          "instructions": "Dica técnica"
        }
      ]
    }
  ]
}`;

    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: "Personal Trainer Expert. Response format: JSON." },
          { role: "user", content: prompt }
        ],
        response_format: { type: "json_object" },
        temperature: 0.8
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const result = JSON.parse(response.data.choices[0].message.content);
    return result;
  } catch (error) {
    console.error('OpenAI Workout Error:', error.response?.data || error.message);
    throw new Error('Falha ao gerar plano de treino inteligente.');
  }
}

async function getSupportAIResponse(userMessage, history = [], userProfile = {}) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error('OPENAI_API_KEY is not configured');

  const historyContext = history.map(msg => `${msg.sender === 'user' ? 'Usuário' : 'Assistente'}: ${msg.message}`).join('\n');
  const profileContext = userProfile 
    ? `Dados do Usuário: Peso ${userProfile.weight}kg, Altura ${userProfile.height}cm, Objetivo: ${userProfile.goal}, Nível: ${userProfile.level}.` 
    : '';

  const systemPrompt = `Você é um Assistente Fitness especializado em treinos, exercícios, suplementos e nutrição esportiva básica.
  
  Sua tarefa é ajudar o usuário com dúvidas sobre:
  - Execução de exercícios.
  - Divisão de treinos.
  - Perda de gordura e hipertrofia.
  - Suplementos (Whey, Creatina, etc).
  - Alimentação básica fitness (pré/pós treino).
  - Listas de compras fitness.
  - Uso do aplicativo ProFit.

  REGRAS CRÍTICAS:
  1. RESPONDA APENAS sobre fitness/treino. No entanto, sinta-se à vontade para responder a saudações básicas (como "olá", "bom dia", "como vai") de forma cordial antes de guiar o usuário de volta ao tema fitness.
  2. Se perguntarem sobre política, medicina clínica (exceto lesões comuns de treino de forma superficial), finanças, programação ou qualquer assunto totalmente fora do escopo após a saudação inicial, responda de forma educada que seu foco é fitness.
  3. NÃO dê conselhos médicos ou dietas clínicas. Se o usuário perguntar algo médico grave, responda: "Para questões médicas ou dietas clínicas é importante consultar um profissional de saúde."
  4. Use os dados do perfil do usuário para personalizar a resposta.
  5. Seja motivador, direto e profissional.
  6. Se solicitado uma lista de compras, gere uma lista clara e simples.

  CONTEXTO:
  ${profileContext}
  
  HISTÓRICO DA CONVERSA:
  ${historyContext}
  `;

  try {
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userMessage }
        ],
        temperature: 0.7
      },
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      }
    );

    return response.data.choices[0].message.content;
  } catch (error) {
    console.error('OpenAI Support Error:', error.response?.data || error.message);
    throw new Error('Falha ao obter resposta da IA.');
  }
}

module.exports = { 
  analyzeFoodImage,
  generateWorkoutStructuredPlan,
  getSupportAIResponse
};
