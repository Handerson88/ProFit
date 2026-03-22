const db = require('../config/database');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const emailService = require('../services/emailService');

exports.register = async (req, res) => {
  const { name, email, password, referralCode } = req.body;
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

    // Rule: First 20 users get PRO plan
    const userCountResult = await db.query("SELECT COUNT(*) FROM users WHERE role = 'user'");
    const userCount = parseInt(userCountResult.rows[0].count);
    const planType = userCount < 20 ? 'pro' : 'free';

    const result = await db.query(
      'INSERT INTO users (id, name, email, password_hash, referral_code, referred_by, plan_type, role) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id, name, email, role, plan_type',
      [userId, name, email, hashedPassword, myReferralCode, referredBy, planType, 'user']
    );

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

    const token = jwt.sign({ id: result.rows[0].id }, process.env.JWT_SECRET);
    
    // Dispara email de boas vindas
    emailService.sendWelcomeEmail(result.rows[0]).catch(err => console.error('[Auth] Erro ao enviar email de boas-vindas:', err));
    
    res.status(201).json({ token, user: result.rows[0] });
  } catch (err) {
    console.error(err);
    if (err.code === '23505') { // Unique violation in Postgres
      return res.status(409).json({ message: 'Este email já está registrado.' });
    }
    res.status(500).json({ message: 'Erro ao conectar com servidor' });
  }
};

exports.login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const result = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    if (result.rows.length === 0) return res.status(404).json({ message: 'Conta não encontrada' });

    const user = result.rows[0];
    if (user.status === 'blocked') {
      return res.status(403).json({ message: 'Sua conta foi bloqueada. Entre em contato com o suporte.' });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) return res.status(401).json({ message: 'Email ou senha incorretos.' });

    // Update last_login_at
    await db.query('UPDATE users SET last_login_at = NOW() WHERE id = $1', [user.id]);

    const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET);
    res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
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
    const frontUrl = process.env.FRONTEND_URL || 'http://localhost:5174';
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
        const result = await db.query('SELECT name, email FROM users WHERE invite_token = $1 AND status = $2 AND invite_expires > NOW()', [token, 'pending_invite']);
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Convite inválido ou já utilizado.' });
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
        // 1. Find user
        const result = await db.query('SELECT id FROM users WHERE invite_token = $1 AND status = $2 AND invite_expires > NOW()', [token, 'pending_invite']);
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Convite inválido ou expirado.' });
        }

        const userId = result.rows[0].id;

        // 2. Hash password and update user
        const hashedPassword = await bcrypt.hash(password, 10);
        await db.query(
            'UPDATE users SET password_hash = $1, status = $2, invite_token = NULL, last_login_at = NOW() WHERE id = $3',
            [hashedPassword, 'active', userId]
        );

        // 3. Generate auth token for immediate login
        const authToken = jwt.sign({ id: userId }, process.env.JWT_SECRET);
        
        // 4. Fetch updated user info
        const userResult = await db.query('SELECT id, name, email FROM users WHERE id = $1', [userId]);

        // 5. Send Welcome Email
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
  const { name, email } = req.body;
  try {
    const checkUser = await db.query('SELECT id FROM users WHERE email = $1', [email]);
    if (checkUser.rows.length > 0) return res.status(400).json({ message: 'Email já cadastrado.' });

    const inviteToken = uuidv4();
    const userId = uuidv4();
    const inviteExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h

    await db.query(
      'INSERT INTO users (id, name, email, status, invite_token, invite_expires) VALUES ($1, $2, $3, $4, $5, $6)',
      [userId, name, email, 'pending_invite', inviteToken, inviteExpires]
    );

    const frontUrl = process.env.FRONTEND_URL || 'http://localhost:5174';
    const inviteLink = `${frontUrl}/accept-invite?token=${inviteToken}`;
    const inviterName = req.user ? req.user.name : 'Um membro do ProFit';
    
    await emailService.sendInviteEmail(email, inviterName, inviteLink);

    res.json({ message: 'Convite enviado com sucesso' });
  } catch (err) {
    console.error('[Auth] Erro ao criar convite:', err);
    res.status(500).json({ message: 'Erro ao processar convite' });
  }
};

exports.verifyToken = async (req, res) => {
  // If we reached here, the middleware already verified the token
  res.json({ 
    valid: true, 
    user: { 
      id: req.user.id, 
      name: req.user.name, 
      email: req.user.email,
      role: req.user.role
    } 
  });
};
