const db = require('../config/database');
const { v4: uuidv4 } = require('uuid');
const { getSupportAIResponse } = require('../services/openaiService');

exports.getConversations = async (req, res) => {
  const user_id = req.user.id;
  try {
    const result = await db.query(
      'SELECT * FROM ai_conversations WHERE user_id = $1 ORDER BY updated_at DESC',
      [user_id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar conversas.' });
  }
};

exports.getMessages = async (req, res) => {
  const { conversationId } = req.params;
  const user_id = req.user.id;

  try {
    // Verify ownership
    const conv = await db.query('SELECT user_id FROM ai_conversations WHERE id = $1', [conversationId]);
    if (conv.rows.length === 0 || conv.rows[0].user_id !== user_id) {
      return res.status(403).json({ error: 'Acesso negado.' });
    }

    const result = await db.query(
      'SELECT * FROM ai_messages WHERE conversation_id = $1 ORDER BY created_at ASC',
      [conversationId]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar mensagens.' });
  }
};

const lastMessages = new Map(); // Simple in-memory rate limiting (cooldown)

exports.sendMessage = async (req, res) => {
  const { conversationId, message } = req.body;
  const user_id = req.user.id;

  // 0. Simple Rate Limiting / Duplicate Prevention (2s)
  const now = Date.now();
  const userKey = `${user_id}_${conversationId || 'new'}`;
  if (lastMessages.has(userKey) && (now - lastMessages.get(userKey)) < 2000) {
    return res.status(429).json({ error: 'Muitas mensagens. Aguarde um momento.' });
  }
  lastMessages.set(userKey, now);

  try {
    // 1. Verify/Create conversation
    let currentConvId = conversationId;
    if (!currentConvId) {
      currentConvId = uuidv4();
      await db.query(
        'INSERT INTO ai_conversations (id, user_id) VALUES ($1, $2)',
        [currentConvId, user_id]
      );
    }

    // 2. Save User Message
    const userMsgId = uuidv4();
    const userMsgResult = await db.query(
      'INSERT INTO ai_messages (id, conversation_id, sender, message) VALUES ($1, $2, $3, $4) RETURNING created_at',
      [userMsgId, currentConvId, 'user', message]
    );

    // 3. Get History for context
    const history = await db.query(
      'SELECT sender, message FROM ai_messages WHERE conversation_id = $1 ORDER BY created_at DESC LIMIT 10',
      [currentConvId]
    );

    // 4. Get User Profile for personalization
    const userProfileResult = await db.query('SELECT name, email, weight, height, goal, activity_level FROM users WHERE id = $1', [user_id]);
    const userProfile = userProfileResult.rows[0];
    
    // Map activity_level to level for AI service compatibility
    if (userProfile) {
      userProfile.level = userProfile.activity_level;
    }

    // 5. Get AI Response with automatic retry (1 time)
    let aiResponse;
    let attempts = 0;
    while (attempts < 2) {
      try {
        aiResponse = await getSupportAIResponse(message, history.rows.reverse(), userProfile);
        if (aiResponse) break;
      } catch (err) {
        attempts++;
        if (attempts === 2) {
          // Log to database
          await db.query(
            'INSERT INTO ai_error_logs (user_id, error_message, stack_trace) VALUES ($1, $2, $3)',
            [user_id, 'OpenAI failure after retries', err.stack || err.message]
          );
          throw err;
        }
        console.warn(`AI Response attempt ${attempts} failed, retrying...`);
        await new Promise(resolve => setTimeout(resolve, 1000)); // Wait before retry
      }
    }

    // 6. Save AI Message
    const aiMsgId = uuidv4();
    const aiMsgResult = await db.query(
      'INSERT INTO ai_messages (id, conversation_id, sender, message) VALUES ($1, $2, $3, $4) RETURNING created_at',
      [aiMsgId, currentConvId, 'ai', aiResponse]
    );

    // 7. Update conversation timestamp
    await db.query('UPDATE ai_conversations SET updated_at = CURRENT_TIMESTAMP WHERE id = $1', [currentConvId]);

    // 8. Real-time Notification
    const io = req.app.get('socketio');
    const messageData = {
      id: aiMsgId,
      conversationId: currentConvId,
      conversation_id: currentConvId,
      message: aiResponse,
      sender: 'ai',
      created_at: aiMsgResult.rows[0].created_at,
      user_message: {
        id: userMsgId,
        message: message,
        sender: 'user',
        created_at: userMsgResult.rows[0].created_at
      }
    };

    // Emit to conversation room
    io.to(currentConvId).emit('new_message', messageData);
    // Emit to admin room
    io.to('admin_room').emit('admin_new_user_message', {
        ...messageData,
        user_name: userProfile?.name || 'Usuário',
        user_email: userProfile?.email || ''
    });

    res.json(messageData);
  } catch (err) {
    console.error('AI Chat Fatal Error:', err);
    res.status(500).json({ error: 'Desculpe, estou tendo dificuldade para responder agora. Tente novamente em alguns segundos.' });
  }
};

exports.newConversation = async (req, res) => {
  const user_id = req.user.id;
  const id = uuidv4();
  try {
    await db.query('INSERT INTO ai_conversations (id, user_id) VALUES ($1, $2)', [id, user_id]);
    res.status(201).json({ id });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao criar nova conversa.' });
  }
};

// Admin Methods
exports.adminGetAllConversations = async (req, res) => {
  try {
    const result = await db.query(`
      SELECT c.*, u.name as user_name, u.email as user_email 
      FROM ai_conversations c 
      JOIN users u ON c.user_id = u.id 
      ORDER BY c.updated_at DESC
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar todas as conversas.' });
  }
};

exports.adminReply = async (req, res) => {
  const { conversationId, message } = req.body;
  try {
    const id = uuidv4();
    await db.query(
      'INSERT INTO ai_messages (id, conversation_id, sender, message) VALUES ($1, $2, $3, $4)',
      [id, conversationId, 'admin', message]
    );
    await db.query('UPDATE ai_conversations SET updated_at = CURRENT_TIMESTAMP WHERE id = $1', [conversationId]);
    
    // Real-time Notification
    const io = req.app.get('socketio');
    const replyData = { 
        id, 
        conversation_id: conversationId,
        message, 
        sender: 'admin',
        created_at: new Date()
    };
    io.to(conversationId).emit('new_message', replyData);

    res.status(201).json(replyData);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao enviar resposta do suporte.' });
  }
};
