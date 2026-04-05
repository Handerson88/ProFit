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

const prompt = `Você agora é um Especialista de Visão Computacional e Nutrição Pro da ProFit AI.
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
        max_tokens: 4096,
        response_format: { type: "json_object" }
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        timeout: 60000
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
Gênero: ${gender === 'female' ? 'Feminino' : gender === 'male' ? 'Masculino' : 'Outro'}
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
        max_tokens: 4096,
        response_format: { type: "json_object" }
      },
      { headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' }, timeout: 60000 }
    );

    return JSON.parse(response.data.choices[0].message.content);
  } catch (err) {
    console.error('OpenAI Body Analysis Error:', err.response?.data || err.message);
    return { analysis: "Não foi possível analisar a imagem, mas usaremos seus dados informados.", focus_recommendation: "equilibrado" };
  }
}

async function generateWorkoutStructuredPlan({ gender, goal, level, days_per_week, location, duration, history, age, weight, height, experience, injuries, diseases, body_focus, intensity, observations, bodyAnalysis }) {
  try {
    const historyContext = history && history.length > 0 
        ? `Histórico Recente: O usuário já completou sessões de: ${history.slice(0, 5).join(', ')}. Foque em progressão e variação técnica.`
        : '';

    const genderContext = gender === 'female'
        ? 'FOCO FEMININO: Este usuário é uma MULHER. Priorize hipertrofia de glúteos e membros inferiores. Volume moderado para membros superiores.'
        : gender === 'male' 
        ? 'FOCO MASCULINO: Este usuário é um HOMEM. Priorize ombros (V-taper), peitoral e braços, além de pernas potentes.'
        : 'Crie um treino balanceado e inclusivo.';

    const prompt = `Gere uma DIVISÃO SEMANAL DE TREINO (SPLIT) de elite para este usuário.
Você é um MASTER COACH PERSONAL com 20 anos de experiência. Tone: Motivador, técnico e autoritário.

DADOS DO USUÁRIO:
Idade: ${age || 'N/A'} anos | Peso: ${weight || 'N/A'} kg | Altura: ${height || 'N/A'} cm
Gênero: ${gender === 'female' ? 'Feminino' : 'Masculino'}
Objetivo: ${goal}
Nível: ${level}
Frequência: ${days_per_week} dias por semana
Local: ${location} | Tempo: ${duration}
Foco: ${body_focus || 'Equilibrado'} | Intensidade: ${intensity || 'Alta'}

SAÚDE/RESTRIÇÕES:
Lesões: ${injuries || 'Nenhuma'} | Doenças: ${diseases || 'Nenhuma'}
Obs: ${observations || 'Nenhuma'}

ANÁLISE DE IMAGEM DA IA:
${bodyAnalysis || 'Nenhuma imagem enviada.'}

REGRAS MASTER COACH:
1. GERE UMA DIVISÃO SEMANAL COMPLETA (EX: Se 3 dias, gere Treino A, B, C. Se 5 dias, A, B, C, D, E).
2. ADAPTE PARA LESÕES: Se houver restrições (${injuries}), mude os exercícios e explique nas "instructions".
3. VOLUME ELITE: Mínimo 4 a 5 exercícios por grupo muscular. Total de 8 a 12 exercícios por dia.
4. JSON PURO: Retorne APENAS o JSON, sem conversas.

ESTRUTURA JSON OBRIGATÓRIA:
{
  "title": "${goal} - Split Semanal Master",
  "message": "Mensagem motivadora focada no objetivo e nas restrições.",
  "daily_workouts": [
    {
      "day": "Treino A (Ex: Peito e Tríceps)",
      "muscles": "Músculos alvo",
      "coach_tip": "Dica técnica matadora",
      "exercises": [
        {
          "name": "Nome do Exercício",
          "sets": 4,
          "reps": "10-12",
          "rest": "60s",
          "muscle_group": "Peito",
          "instructions": "Guia de execução perfeito."
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
        max_tokens: 16384,
        response_format: { type: "json_object" },
        temperature: 0.8
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        },
        timeout: 120000
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
       - Sexo: ${userProfile.gender === 'female' ? 'Feminino' : userProfile.gender === 'male' ? 'Masculino' : 'Outro'}
       - Peso: ${userProfile.weight}kg
       - Altura: ${userProfile.height}cm
       - Idade: ${userProfile.age} anos
       - Objetivo: ${userProfile.goal}
       - Nível: ${userProfile.level}
       - Plano: ${userProfile.plan_status === 'active' ? 'Pro' : 'Gratuito'}` 
    : '';

  const systemPrompt = `Você é o ProFit AI, um Coach Pro de Nível Mundial. Você combina o conhecimento científico de um Fisiologista do Exercício Master, um Nutricionista Esportivo de Elite (especialista em hipertrofia e performance) e um Estrategista de Biohacking.

  PERSONALIDADE:
  - Extremamente competente, analítico, motivador e focado em resultados reais.
  - Sua inteligência deve transparecer na profundidade técnica: cite macros, fale sobre síntese proteica, tempo sob tensão, densidade calórica e periodização se relevante.
  - Linguagem natural, impecável e inspiradora.

  SUA MISSÃO MASTER:
  1. Treinos: Planeje progressão de carga, fale sobre falha concêntrica, bi-sets, e ajuste o treino ao objetivo (ex: foco em pernas para mulheres, ombros largos para homens).
  2. Nutrição de Precisão: Calcule a ingestão ideal de proteína (ex: 2g/kg), explique o papel dos carboidratos na insulina e glicogênio, e recomende suplementação baseada em evidências (Creatina, Beta-Alanina, etc).
  3. Estratégia Mental: Use psicologia esportiva para manter o usuário no trilho.
  4. Suporte App: Guie o usuário no ProFit (Scanner de refeições, Diário, etc).

  REGRAS CRÍTICAS:
  - IDIOMA: ${languageInstruction}
  - CONTEXTO: Use os DADOS DO USUÁRIO fornecidos para ser cirúrgico. Se ele quer "ganhar massa", dê números, macros sugeridos e estratégias de superávit.
  - ESCOPO: Responda apenas sobre Fitness, Saúde e Bem-estar.
  - SEGURANÇA: NÃO dê diagnósticos médicos. Se o assunto for grave ou clínico, oriente a busca por um profissional.
  - CONCISÃO INTELIGENTE: Seja direto. O usuário quer resultados técnicos e rápidos.

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
        max_tokens: 4096,
        temperature: 0.7
      },
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: 60000
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
