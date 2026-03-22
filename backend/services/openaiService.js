const axios = require('axios');
const fs = require('fs');

async function analyzeFoodImage(imageBufferOrPath) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY is not configured');
  }

  // Convert image to base64
  let base64Image;
  if (Buffer.isBuffer(imageBufferOrPath)) {
    base64Image = imageBufferOrPath.toString('base64');
  } else {
    const imageBuffer = fs.readFileSync(imageBufferOrPath);
    base64Image = imageBuffer.toString('base64');
  }

const prompt = `Você agora é um Especialista de Visão Computacional e Nutrição de Elite da ProFit AI.
Sua tarefa é analisar a imagem de um prato de comida e fornecer uma análise nutricional MASTER, altamente precisa e profissional.

PRIMEIRO PASSO: Analise a qualidade da imagem.
- Se a foto estiver: desfocada, muito escura, prato não visível ou com o alimento cortado, defina "is_quality_good": false e dê uma dica em "quality_message".

SEGUNDO PASSO: Identificação e Nutrição.
1. GERAÇÃO DO NOME DO PRATO: Crie um nome CURTO, NATURAL e APETITOSO em português (PT-BR).
2. INGREDIENTES: Identifique detalhadamente todos os ingredientes visíveis.
3. CALORIAS E MACROS: Estime com máxima precisão as Calorias (kcal), Proteínas (g), Carboidratos (g) e Gorduras (g).
4. CONFIANÇA: Dê uma nota de 0 a 100 baseada na clareza da identificação.

Retorne APENAS o objeto JSON abaixo:
{
  "is_quality_good": true,
  "quality_message": null,
  "dish_name": "Nome do prato",
  "calories": 450,
  "protein": 32,
  "carbs": 28,
  "fat": 18,
  "ingredients": ["item 1", "item 2"],
  "nutrition_observation": "Comentário nutricional profissional",
  "recommendation": "Dica de saúde",
  "confidence": 95
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

async function analyzeBodyImage(imageBufferOrPath, { gender, goal, weight, height }) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error('OPENAI_API_KEY not configured');

  let base64Image;
  if (Buffer.isBuffer(imageBufferOrPath)) {
    base64Image = imageBufferOrPath.toString('base64');
  } else {
    base64Image = fs.readFileSync(imageBufferOrPath).toString('base64');
  }

  const prompt = `Você é um Especialista em Avaliação Física e Master Coach da ProFit AI.
Analise a imagem corporal do usuário para orientar a criação de um treino personalizado.

DADOS FORNECIDOS:
Gênero: ${gender === 'female' ? 'Feminino' : 'Masculino'}
Objetivo: ${goal}
Peso: ${weight}kg, Altura: ${height}cm

SUA TAREFA:
1. Avalie a estrutura corporal (somatotipo aproximado).
2. Identifique áreas de maior acúmulo de gordura ou menor desenvolvimento muscular.
3. Observe pontos de postura básica se visíveis.
4. NUNCA faça diagnósticos médicos. Seja profissional e motivador.

Retorne APENAS um objeto JSON:
{
  "analysis": "Texto descrevendo o físico, pontos fortes e áreas que precisam de foco (PT-BR).",
  "estimated_fat_percentage": "valor em % ou intervalo",
  "focus_recommendation": "área sugerida para focar no treino"
}`;

  try {
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: "gpt-4o-mini",
        messages: [{
          role: "user",
          content: [
            { type: "text", text: prompt },
            { type: "image_url", image_url: { url: `data:image/jpeg;base64,${base64Image}` } }
          ]
        }],
        response_format: { type: "json_object" }
      },
      { headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' } }
    );

    return JSON.parse(response.data.choices[0].message.content);
  } catch (err) {
    console.error('OpenAI Body Analysis Error:', err.response?.data || err.message);
    return { analysis: "Não foi possível analisar a imagem, mas usaremos seus dados informados.", focus_recommendation: "equilibrado" };
  }
}

async function generateWorkoutStructuredPlan({ gender, goal, level, days_per_week: days, location, duration, history, age, weight, height, experience, injuries, diseases, body_focus, intensity, observations, bodyAnalysis }) {
  try {
    const historyContext = history && history.length > 0 
        ? `Considere que ele já completou o treino de: ${history.join(', ')}. Evite repetir exatamente o mesmo treino recente.`
        : '';

    const genderContext = gender === 'female'
        ? 'Dê uma atenção especial (mais volume) para membros inferiores e glúteos, pois o usuário é do gênero feminino.'
        : 'Dê uma atenção especial (mais volume) para membros superiores (peito, costas, ombros), pois o usuário é do gênero masculino.';

    const prompt = `Gere um plano de TREINO MENSAL (30 DIAS) estruturado para este usuário.
Você é um MASTER COACH PERSONAL com 20 anos de experiência. Tone: Motivador, técnico e autoritário.

DADOS DO USUÁRIO:
Idade: ${age || 'N/A'} anos
Peso: ${weight || 'N/A'} kg
Altura: ${height || 'N/A'} cm
Gênero: ${gender === 'female' ? 'Feminino' : 'Masculino'}
Objetivo: ${goal}
Nível Atual: ${level}
Experiência: ${experience || 'N/A'}
Frequência: ${days} dias por semana
Local de Treino: ${location}
Tempo Disponível: ${duration}
Intensidade Preferida: ${intensity || 'Moderada'}
Foco Corporal: ${body_focus || 'Equilibrado'}

SAÚDE E LIMITAÇÕES (MUITO IMPORTANTE):
Lesões: ${injuries || 'Nenhuma'}
Doenças/Condições: ${diseases || 'Nenhuma'}
Observações: ${observations || 'Nenhuma'}

ANÁLISE CORPORAL POR IA (VISÃO):
${bodyAnalysis || 'Nenhuma imagem enviada.'}

${historyContext}
${genderContext}

REGRAS DE GERAÇÃO (MASTER COACH):
1. SEGURANÇA: Se houver lesões ou doenças, substitua exercícios perigosos por alternativas seguras e inclua avisos nas instruções.
2. ADAPTAÇÃO: Se o nível for "iniciante", foque em técnica. Se "avançado", use técnicas como drop-sets ou bi-sets.
3. LOCAL: Se o local for "Casa", use APENAS exercícios com peso do corpo ou itens domésticos. NUNCA sugira máquinas de academia para treinos em casa.
4. FOCO: Priorize o grupo muscular "${body_focus}" se especificado, mas mantenha o equilíbrio.
5. VOLUME: 6 a 8 exercícios por dia. É um plano de elite.
6. ANALISE VISUAL: Se houver uma "ANÁLISE CORPORAL POR IA", priorize os ajustes sugeridos nela (ex: se indicar gordura abdominal, adicione cardio; se indicar pernas fracas, aumente volume de pernas).
7. COACH TIPS: Use as dicas para motivar e corrigir a postura.
8. MENSAGEM DO DIA: A "message" inicial deve ser personalizada (ex: "Mesmo com ${injuries}, vamos superar limites com segurança!").

JSON de Saída (OBRIGATÓRIO):
{
  "title": "${goal} - Plano Elite ${level}",
  "message": "Mensagem motivadora e personalizada do Master Coach",
  "daily_workouts": [
    {
      "day": "Segunda-feira",
      "muscles": "Grupo Muscular Alvo",
      "coach_tip": "Dica de ouro do treinador para hoje",
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
  
  const aiLang = userProfile.ai_language || 'auto';
  let languageInstruction = '';
  if (aiLang === 'en') {
    languageInstruction = 'ALWAYS respond in English. Regardless of the user\'s language, your response MUST be in natural, professional English.';
  } else if (aiLang === 'pt') {
    languageInstruction = 'Sempre responda em Português (PT-BR). Mesmo que o usuário escreva em outro idioma, sua resposta deve ser em português brasileiro natural e profissional.';
  } else {
    languageInstruction = 'DETECT the language of the user\'s latest message. If they write in English, respond in English. If they write in Portuguese, respond in Portuguese. Always prioritize the user\'s current language for a natural conversation flow.';
  }

  const profileContext = userProfile 
    ? `DADOS DO USUÁRIO: 
       - Nome: ${userProfile.name}
       - Sexo: ${userProfile.gender === 'female' ? 'Feminino' : 'Masculino'}
       - Peso: ${userProfile.weight}kg
       - Altura: ${userProfile.height}cm
       - Idade: ${userProfile.age} anos
       - Objetivo: ${userProfile.goal}
       - Nível: ${userProfile.level}
       - Plano: ${userProfile.plan_type === 'premium' ? 'Premium (Elite)' : 'Gratuito'}` 
    : '';

  const systemPrompt = `Você é o ProFit AI, um Coach de Elite que combina o conhecimento de um Personal Trainer Master, um Nutricionista Esportivo e um Mentor Motivacional.

  PERSONALIDADE:
  - Profissional, técnico, direto e altamente motivador.
  - Use emojis de forma moderada para incentivar (💪, 🥗, 🔥).
  - Linguagem natural e fluida (evite termos robóticos).

  SUA MISSÃO:
  Ajudar o usuário com:
  1. Treinos: Execução, divisões (ABC, Full Body, etc), volume e intensidade.
  2. Nutrição: Macros, suplementação (Creatina, Whey), listas de compras saudáveis e refeições pré/pós treino.
  3. Motivação: Superação de platôs e consistência.
  4. Suporte: Uso das funcionalidades do App ProFit.

  REGRAS CRÍTICAS:
  - IDIOMA: ${languageInstruction}
  - CONTEXTO: Use os DADOS DO USUÁRIO fornecidos para dar respostas personalizadas (ex: se ele quer "ganhar massa", não sugira apenas deficit calórico).
  - ESCOPO: Responda apenas sobre Fitness, Saúde e Bem-estar. Saudações iniciais podem ser retribuídas cordialmente antes de focar no tema.
  - SEGURANÇA: NÃO dê diagnósticos médicos. Se o assunto for grave ou clínico, oriente a busca por um profissional de saúde.
  - CONCISÃO: Seja direto. O usuário quer resultados, não textos gigantes.

  CONTEXTO DO PERFIL:
  ${profileContext}
  
  HISTÓRICO RECENTE:
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
  analyzeBodyImage,
  generateWorkoutStructuredPlan,
  getSupportAIResponse
};
