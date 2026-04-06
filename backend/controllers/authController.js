const db = require('../config/database');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const emailService = require('../services/emailService');

exports.register = async (req, res) => {
  const { 
    name, password, referralCode, 
    age, gender, weight, height, goal, activity_level, 
    target_weight, daily_calorie_target, primary_objective, 
    blockers, understands_calories, phone, country, plan_type
  } = req.body;
  const email = req.body.email ? req.body.email.trim().toLowerCase() : '';
  
  if (!email || !password || !name) {
    return res.status(400).json({ message: 'Nome, e-mail e senha são obrigatórios.' });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const userId = uuidv4();
    const myReferralCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    
    // Check if referred by someone
    let referredBy = null;
    if (referralCode) {
        const referrerResult = await db.query('SELECT id FROM users WHERE referral_code = $1', [referralCode.toUpperCase()]);
        if (referrerResult.rows.length > 0) {
            referredBy = referrerResult.rows[0].id;
        }
    }

    const result = await db.query(
      `INSERT INTO users (
        id, name, email, password_hash, referral_code, referred_by, 
        plan, subscription_status, role, scan_limit_per_day, onboarding_completed,
        age, gender, weight, height, goal, activity_level, 
        target_weight, daily_calorie_target, primary_objective, 
        blockers, understands_calories, phone, country
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24) 
      RETURNING id, name, email, role, plan, subscription_status, is_influencer, created_at`,
      [
        userId, name, email, hashedPassword, myReferralCode, referredBy, 
        plan_type || 'free', 'sem assinatura', 'user', 5, true,
        age || null, gender || null, weight || null, height || null, goal || null, activity_level || null,
        target_weight || null, daily_calorie_target || null, primary_objective || null,
        JSON.stringify(blockers || []), understands_calories !== undefined ? understands_calories : true,
        phone || null, country || null
      ]
    );

    const user = result.rows[0];

    // --- PROMOÇÃO: PRIMEIROS 20 USUÁRIOS GRÁTIS (Excluindo Admin/Influencer) ---
    const userCountRes = await db.query("SELECT COUNT(*) FROM users WHERE role NOT IN ('admin', 'influencer')");
    const totalRealUsers = parseInt(userCountRes.rows[0].count);
    
    if (totalRealUsers <= 20) {
        console.log(`[AuthPromo] User ${email} is among the first 20. Activating PRO free.`);
        await db.query(
            "UPDATE users SET has_paid = true, subscription_status = 'ativo', plan = $1, payment_status = 'PAID_PROMO' WHERE id = $2",
            [plan_type || 'pro', userId]
        );
    }
    // ----------------------------------------------

    // Mark quiz lead as converted if it exists
    await db.query('UPDATE quiz_leads SET status = \'converted\' WHERE email = $1 OR id = $2', [email, req.body.leadId || null]);

    // Increment total_referrals for the referrer
    if (referredBy) {
        await db.query('UPDATE users SET total_referrals = total_referrals + 1 WHERE id = $1', [referredBy]);
        
        // Check for milestone (10 referrals)
        const referrerStatus = await db.query('SELECT id, name, email, total_referrals, discount_earned FROM users WHERE id = $1', [referredBy]);
        if (referrerStatus.rows[0].total_referrals >= 10 && !referrerStatus.rows[0].discount_earned) {
            await db.query('UPDATE users SET discount_earned = true WHERE id = $1', [referredBy]);
            emailService.sendReferralMilestoneEmail(referrerStatus.rows[0]).catch(e => console.error('[Auth] Erro ao enviar email de milestone:', e));
        }
    }

    const token = jwt.sign({ 
      id: user.id, 
      role: user.role, 
      status: user.subscription_status, 
      plano_status: user.plano_status,
      end_date: user.end_date,
      data_expiracao: user.data_expiracao
    }, process.env.JWT_SECRET);
    
    // Dispara email de boas vindas
    console.log(`[Auth] Registrando usuário ${email}, enviando e-mail de boas-vindas...`);
    emailService.sendWelcomeEmail(user).catch(err => console.error('[Auth] Erro ao enviar email de boas-vindas:', err));
    
    res.status(201).json({ token, user });
  } catch (err) {
    console.error('[Auth] Register Error:', err);
    if (err.code === '23505') { // Unique violation in Postgres
      return res.status(409).json({ message: 'Este email já está registrado. Tente fazer login.' });
    }
    res.status(500).json({ message: 'Erro ao processar registro. Tente novamente mais tarde.' });
  }
};

exports.login = async (req, res) => {
  const { password } = req.body;
  const email = req.body.email ? req.body.email.trim().toLowerCase() : '';
  try {
    const result = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    if (result.rows.length === 0) {
      return res.status(404).json({ 
        message: 'Nenhuma conta encontrada com este e-mail. Deseja criar uma conta?',
        code: 'USER_NOT_FOUND'
      });
    }

    const user = result.rows[0];
    console.log(`[AuthDebug] Tentativa de login: email=${email}, status=${user.status}, role=${user.role}`);

    if (user.status === 'blocked') {
      return res.status(403).json({ message: 'Sua conta foi bloqueada. Entre em contato com o suporte.' });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    console.log(`[AuthDebug] Resultado bcrypt.compare: ${isMatch}`);
    
    if (!isMatch) {
      return res.status(401).json({ 
        message: 'Senha incorreta. Tente novamente.',
        code: 'INVALID_PASSWORD'
      });
    }

    // Update last_login_at
    await db.query('UPDATE users SET last_login_at = NOW() WHERE id = $1', [user.id]);

    // --- REGRA DE ACESSO INTELIGENTE (20 USUÁRIOS / 30 DIAS) ---
    const userCountRes = await db.query("SELECT COUNT(*) FROM users WHERE role NOT IN ('admin', 'influencer')");
    const totalUsersCount = parseInt(userCountRes.rows[0].count);
    
    // Regra: Se count <= 20, verificar se está nos primeiros 30 dias
    // (Usando created_at como base para garantir que usuários antigos não sejam bloqueados imediatamente se acabaram de entrar nos 20)
    const accountCreatedAt = new Date(user.created_at || new Date());
    const daysSinceCreation = (new Date() - accountCreatedAt) / (1000 * 60 * 60 * 24);
    
    let effectiveStatus = user.subscription_status;
    let isPromoActive = false;

    if (totalUsersCount <= 20) {
        if (daysSinceCreation <= 30) {
            effectiveStatus = 'ativo';
            isPromoActive = true;
        }
    }
    // ---------------------------------------------------------

    const token = jwt.sign({ 
      id: user.id, 
      role: user.role, 
      status: effectiveStatus, 
      plano_status: user.plano_status,
      end_date: isPromoActive ? null : user.end_date,
      data_expiracao: isPromoActive ? null : user.data_expiracao
    }, process.env.JWT_SECRET);

    res.json({ 
        token, 
        user: { 
            id: user.id, 
            name: user.name, 
            email: user.email, 
            role: user.role,
            is_influencer: user.is_influencer,
            onboarding_completed: user.onboarding_completed,
            plan: user.plan,
            subscription_status: effectiveStatus,
            plano_status: user.plano_status,
            end_date: isPromoActive ? null : user.end_date,
            data_expiracao: isPromoActive ? null : user.data_expiracao,
            is_blocked: user.is_blocked,
            created_at: user.created_at
        } 
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erro ao conectar com servidor' });
  }
};

// New: Forgot Password
exports.forgotPassword = async (req, res) => {
  const emailRaw = req.body.email;
  if (!emailRaw) return res.json({ message: 'Se o email existir, você receberá um link' });
  
  const email = emailRaw.trim().toLowerCase();
  
  try {
    const result = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    
    // Sempre retornar 200 sucesso (segurança para não vazar existência de emails)
    if (result.rows.length === 0) {
        return res.json({ message: 'Se o email existir, você receberá um link' });
    }

    const user = result.rows[0];
    
    // Gerar token seguro JWT (expira em 1 hora)
    const resetToken = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '1h' });

    // Link para o frontend
    const frontUrl = process.env.FRONTEND_URL || 'https://app.myprofittness.com';
    const resetLink = `${frontUrl}/reset-password?token=${resetToken}`;
    
    // Dispara email
    emailService.sendResetPasswordEmail(user, resetToken).catch(err => console.error('[Auth] Erro ao enviar email de recuperação:', err));

    res.json({ message: 'Se o email existir, você receberá um link' });
  } catch (err) {
    console.error('[Auth] Erro em forgotPassword:', err);
    res.status(500).json({ message: 'Erro ao processar solicitação' });
  }
};

// New: Reset Password
exports.resetPassword = async (req, res) => {
  const { token, newPassword } = req.body;
  
  try {
    // 1. Valida o Token JWT
    let decoded;
    try {
        decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
        return res.status(400).json({ message: 'Token de recuperação expirado ou inválido.' });
    }

    const userId = decoded.userId;

    // 2. Hash da nova senha
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // 3. Atualiza no banco as credenciais do usuário
    await db.query(
      'UPDATE users SET password_hash = $1 WHERE id = $2',
      [hashedPassword, userId]
    );

    // 4. Enviar email de confirmação silenciosa
    const userResult = await db.query('SELECT id, name, email FROM users WHERE id = $1', [userId]);
    if (userResult.rows.length > 0) {
        emailService.sendPasswordChangedEmail(userResult.rows[0])
        .catch(err => console.error('[Auth] Erro ao enviar email de confirmação de senha:', err));
    }

    res.json({ message: 'Senha redefinida com sucesso!' });
  } catch (err) {
    console.error('[Auth] Erro ao redefinir a senha:', err);
    res.status(500).json({ message: 'Erro interno ao redefinir senha' });
  }
};

// New: Get Invitation Details
exports.getInviteDetail = async (req, res) => {
    const { token } = req.params;
    try {
        const result = await db.query(`
            SELECT u.name, u.email 
            FROM tokens t
            JOIN users u ON t.user_id = u.id
            WHERE t.token = $1 
              AND t.type = 'activation' 
              AND t.expires_at > NOW()
              AND u.is_active = false
        `, [token]);

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Convite inválido ou expirado.' });
        }
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Erro ao verificar convite' });
    }
};

// New: Activate Account via Invite
exports.activateInvite = async (req, res) => {
    const { token, password } = req.body;
    try {
        // 1. Find token and user
        const tokenResult = await db.query(`
            SELECT user_id FROM tokens 
            WHERE token = $1 AND type = 'activation' AND expires_at > NOW()
        `, [token]);

        if (tokenResult.rows.length === 0) {
            return res.status(404).json({ message: 'Convite inválido ou expirado.' });
        }

        const userId = tokenResult.rows[0].user_id;

        // 2. Hash password and update user
        const hashedPassword = await bcrypt.hash(password, 10);
        await db.query(`
            UPDATE users 
            SET password_hash = $1, is_active = true, last_login_at = NOW() 
            WHERE id = $2
        `, [hashedPassword, userId]);

        // 3. Delete the used token
        await db.query('DELETE FROM tokens WHERE token = $1', [token]);

        // 4. Generate auth token for immediate login
        const authToken = jwt.sign({ id: userId }, process.env.JWT_SECRET);
        
        // 5. Fetch updated user info
        const userResult = await db.query('SELECT id, name, email, onboarding_completed, plan, subscription_status FROM users WHERE id = $1', [userId]);

        // 6. Send Welcome Email
        emailService.sendWelcomeEmail(userResult.rows[0])
          .catch(err => console.error('[Auth] Erro ao enviar email de boas-vindas no convite:', err));

        res.json({ 
            message: 'Conta ativada com sucesso!', 
            token: authToken,
            user: userResult.rows[0]
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Erro ao ativar conta' });
    }
};

// New: Create Invite
exports.createInvite = async (req, res) => {
  const { name } = req.body;
  const email = req.body.email ? req.body.email.trim().toLowerCase() : '';
  try {
    const checkUser = await db.query('SELECT id FROM users WHERE email = $1', [email]);
    if (checkUser.rows.length > 0) return res.status(400).json({ message: 'Email já cadastrado.' });

    const inviteToken = uuidv4();
    const userId = uuidv4();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h

    // 1. Create user (inactive)
    await db.query(
      'INSERT INTO users (id, name, email, is_active, onboarding_completed) VALUES ($1, $2, $3, $4, $5)',
      [userId, name, email, false, false]
    );

    // 2. Create activation token
    await db.query(
        'INSERT INTO tokens (token, user_id, type, expires_at) VALUES ($1, $2, $3, $4)',
        [inviteToken, userId, 'activation', expiresAt]
    );

    const frontUrl = process.env.FRONTEND_URL || 'https://myprofittness.com';
    const inviteLink = `${frontUrl}/activate?token=${inviteToken}`;
    const inviterName = req.user ? req.user.name : 'Um membro do ProFit';
    
    await emailService.sendInviteEmail(email, inviterName, inviteLink);

    res.json({ message: 'Convite enviado com sucesso' });
  } catch (err) {
    console.error('[Auth] Erro ao criar convite:', err);
    res.status(500).json({ message: 'Erro ao processar convite' });
  }
};

exports.verifyToken = async (req, res) => {
  // --- REGRA DE ACESSO INTELIGENTE (VERIFICAÇÃO DE TOKEN) ---
  const userCountRes = await db.query("SELECT COUNT(*) FROM users WHERE role NOT IN ('admin', 'influencer')");
  const totalUsersCount = parseInt(userCountRes.rows[0].count);
  
  const accountCreatedAt = new Date(req.user.created_at || new Date());
  const daysSinceCreation = (new Date() - accountCreatedAt) / (1000 * 60 * 60 * 24);
  
  let effectiveStatus = req.user.subscription_status;
  let isPromoActive = false;

  if (totalUsersCount <= 20) {
      if (daysSinceCreation <= 30) {
          effectiveStatus = 'ativo';
          isPromoActive = true;
      }
  }

  res.json({ 
    valid: true, 
    user: { 
      id: req.user.id, 
      name: req.user.name, 
      email: req.user.email,
      role: req.user.role,
      plan: req.user.plan,
      subscription_status: effectiveStatus,
      plano_status: req.user.plano_status,
      end_date: isPromoActive ? null : req.user.end_date,
      data_expiracao: isPromoActive ? null : req.user.data_expiracao,
      is_blocked: req.user.is_blocked,
      created_at: req.user.created_at
    } 
  });
};

// Nova: Status da Promoção (Pública)
exports.getPromotionStatus = async (req, res) => {
  try {
    const result = await db.query("SELECT COUNT(*) FROM users WHERE role NOT IN ('admin', 'influencer')");
    const count = parseInt(result.rows[0].count);
    res.json({ 
      isFreePromoActive: count < 20,
      total_users: count,
      limit: 20
    });
  } catch (err) {
    console.error('[AuthPromo] Error fetching status:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
};
