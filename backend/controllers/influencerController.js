const db = require('../config/database');
const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');
const emailService = require('../services/emailService');

/**
 * Admin: Convida um influenciador por e-mail
 */
exports.inviteInfluencer = async (req, res) => {
  const { email, name } = req.body;

  if (!email) {
    return res.status(400).json({ message: 'E-mail é obrigatório' });
  }

  try {
    // 1. Gerar token seguro
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 48); // 48 horas de validade

    // 2. Salvar convite (UPSERT se já existir convite pendente)
    await db.query(`
      INSERT INTO influencer_invites (email, token, expires_at)
      VALUES ($1, $2, $3)
      ON CONFLICT (email) DO UPDATE 
      SET token = EXCLUDED.token, 
          used = FALSE, 
          expires_at = EXCLUDED.expires_at,
          created_at = NOW()
    `, [email, token, expiresAt]);

    // 3. Enviar e-mail
    const frontendUrl = process.env.FRONTEND_URL || 'https://myprofittness.com';
    const inviteLink = `${frontendUrl}/influencer/accept?token=${token}`;
    
    await emailService.sendInfluencerInviteEmail(email, name, inviteLink);

    res.json({ success: true, message: 'Convite enviado com sucesso!' });
  } catch (error) {
    console.error('[InfluencerController] Invite Error:', error);
    res.status(500).json({ message: 'Erro ao processar convite' });
  }
};

/**
 * Public: Verifica se o token é válido
 */
exports.verifyInviteToken = async (req, res) => {
  const { token } = req.query;

  if (!token) {
    return res.status(400).json({ message: 'Token não fornecido' });
  }

  try {
    const result = await db.query(
      'SELECT * FROM influencer_invites WHERE token = $1 AND used = FALSE AND expires_at > NOW()',
      [token]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({ valid: false, message: 'Link inválido ou expirado' });
    }

    const invite = result.rows[0];
    
    // Verificar se o usuário já existe para saber se pede senha ou faz upgrade
    const userResult = await db.query('SELECT id, name FROM users WHERE email = $1', [invite.email]);
    
    res.json({ 
      valid: true, 
      email: invite.email,
      exists: userResult.rows.length > 0,
      name: userResult.rows[0]?.name || ''
    });
  } catch (error) {
    console.error('[InfluencerController] Verify Error:', error);
    res.status(500).json({ message: 'Erro ao verificar token' });
  }
};

/**
 * Public: Aceita o convite e ativa a conta
 */
exports.acceptInvite = async (req, res) => {
  const { token, password, name } = req.body;
  const bcrypt = require('bcryptjs');

  try {
    // 1. Validar token novamente
    const inviteResult = await db.query(
      'SELECT * FROM influencer_invites WHERE token = $1 AND used = FALSE AND expires_at > NOW()',
      [token]
    );

    if (inviteResult.rows.length === 0) {
      return res.status(400).json({ message: 'Convite inválido ou expirado' });
    }

    const invite = inviteResult.rows[0];

    // 2. Verificar se usuário existe
    const userResult = await db.query('SELECT * FROM users WHERE email = $1', [invite.email]);
    let user;

    if (userResult.rows.length > 0) {
      // Upgrade de usuário existente
      user = userResult.rows[0];
      await db.query(`
        UPDATE users 
        SET is_influencer = TRUE, 
            plan_type = 'pro', 
            plan_status = 'active', 
            subscription_active = TRUE,
            plan = 'pro'
        WHERE id = $1
      `, [user.id]);
    } else {
      // Criar novo usuário Influenciador
      if (!password) {
        return res.status(400).json({ message: 'Senha é necessária para novas contas' });
      }
      
      const userId = uuidv4();
      const hashedPassword = await bcrypt.hash(password, 10);
      
      await db.query(`
        INSERT INTO users (id, email, name, password_hash, is_influencer, plan_type, plan_status, subscription_active, plan, role)
        VALUES ($1, $2, $3, $4, TRUE, 'pro', 'active', TRUE, 'pro', 'user')
      `, [userId, invite.email, name || 'Influenciador', hashedPassword]);
      
      const newUserResult = await db.query('SELECT * FROM users WHERE id = $1', [userId]);
      user = newUserResult.rows[0];
    }

    // 3. Marcar token como usado
    await db.query('UPDATE influencer_invites SET used = TRUE WHERE id = $1', [invite.id]);

    // 4. Gerar Token de Auth (JWT)
    const jwt = require('jsonwebtoken');
    const authToken = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'secret_fallback',
      { expiresIn: '30d' }
    );

    // 5. Gerar Cupom Automático (NOME10)
    try {
      const couponCode = `${(name || user.name || 'INF').split(' ')[0].replace(/[^a-zA-Z0-9]/g, '').toUpperCase()}10`;
      await db.query(
        `INSERT INTO coupons (code, discount_type, discount_value, influencer_id, active)
         VALUES ($1, 'percent', 10, $2, true)
         ON CONFLICT (code) DO NOTHING`,
        [couponCode, user.id]
      );
      console.log(`[InfluencerController] Cupom automático gerado: ${couponCode}`);
    } catch (couponErr) {
      console.error('[InfluencerController] Erro ao gerar cupom automático:', couponErr);
    }

    res.json({ 
      success: true, 
      token: authToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        is_influencer: true,
        plan_type: 'pro',
        onboarding_completed: user.onboarding_completed
      }
    });

  } catch (error) {
    console.error('[InfluencerController] Accept Error:', error);
    res.status(500).json({ message: 'Erro ao ativar conta VIP' });
  }
};
