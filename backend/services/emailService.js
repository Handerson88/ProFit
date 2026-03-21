const { Resend } = require('resend');
const db = require('../config/database');

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'ProFit <onboarding@resend.dev>';
const APP_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

const baseTemplate = (title, content, ctaText, ctaLink) => `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800&display=swap" rel="stylesheet">
    <style>
        body { 
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
            background-color: #F6F7F9; 
            margin: 0; 
            padding: 40px 20px; 
            color: #1F2937;
            -webkit-font-smoothing: antialiased;
        }
        .container { 
            max-width: 600px; 
            background: #ffffff; 
            margin: 0 auto; 
            border-radius: 32px; 
            overflow: hidden; 
            box-shadow: 0 20px 50px rgba(0,0,0,0.05);
            border: 1px solid rgba(0,0,0,0.02);
        }
        .header { 
            padding: 50px 40px; 
            text-align: center; 
            background: linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%);
        }
        .content { 
            padding: 50px 40px; 
            line-height: 1.8;
            font-size: 16px;
        }
        .footer { 
            padding: 40px; 
            text-align: center; 
            font-size: 12px; 
            color: #9CA3AF; 
            background: #FAFAFB;
            border-top: 1px solid #F3F4F6;
        }
        .button { 
            display: inline-block; 
            padding: 20px 40px; 
            background: linear-gradient(135deg, #6366F1 0%, #4F46E5 100%);
            color: #ffffff !important; 
            text-decoration: none; 
            border-radius: 18px; 
            font-weight: 800; 
            font-size: 16px;
            margin-top: 40px;
            box-shadow: 0 10px 25px rgba(99, 102, 241, 0.4);
            text-transform: uppercase;
            letter-spacing: 0.05em;
        }
        h1 { 
            font-size: 28px; 
            font-weight: 800; 
            margin-bottom: 24px; 
            color: #111827;
            letter-spacing: -0.025em;
            line-height: 1.2;
        }
        p { margin-bottom: 24px; color: #4B5563; }
        .highlight { color: #6366F1; font-weight: 700; }
        .logo { font-size: 24px; font-weight: 900; color: white; letter-spacing: -0.05em; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">ProFit.</div>
        </div>
        <div class="content">
            <h1>${title}</h1>
            ${content}
            ${ctaText ? `<center style="margin-top: 10px;"><a href="${ctaLink}" class="button">${ctaText}</a></center>` : ''}
        </div>
        <div class="footer">
            <p style="margin-bottom: 10px; font-weight: 700; color: #6B7280;">Atinge a tua melhor versão.</p>
            <p>© ${new Date().getFullYear()} ProFit AI - Inteligência Nutricional</p>
            <p>Beira, Moçambique | <a href="#" style="color: #6366F1; text-decoration: none;">Suporte ProFit</a></p>
        </div>
    </div>
</body>
</html>
`;

const logEmail = async (userId, type, status, details = null) => {
    try {
        await db.query(`
            INSERT INTO email_logs (user_id, email_type, status, details)
            VALUES ($1, $2, $3, $4)
        `, [userId, type, status, details]);
    } catch (err) {
        console.error('Failed to log email:', err);
    }
};

exports.sendWelcomeEmail = async (user) => {
    const title = "Bem-vindo ao ProFit 🎉";
    const content = `
        <p>Olá, <strong>${user.name || 'Atleta'}</strong>!</p>
        <p>Obrigado por se juntar a nós! O ProFit é seu novo assistente pessoal para monitorar calorias, macros e treinos de forma inteligente.</p>
        <p>Tudo o que você precisa para alcançar sua melhor versão está aqui.</p>
    `;
    const ctaText = "Acessar minha conta";
    const ctaLink = `${APP_URL}/dashboard`;

    try {
        await resend.emails.send({
            from: FROM_EMAIL,
            to: user.email,
            subject: title,
            html: baseTemplate(title, content, ctaText, ctaLink)
        });
        await logEmail(user.id, 'welcome', 'sent');
    } catch (err) {
        await logEmail(user.id, 'welcome', 'failed', err.message);
        throw err;
    }
};

exports.sendResetPasswordEmail = async (user, token) => {
    const title = "Recuperar sua senha 🔐";
    const content = `
        <p>Recebemos uma solicitação para redefinir a senha da sua conta no ProFit.</p>
        <p>Se você não solicitou isso, pode ignorar este e-mail com segurança.</p>
    `;
    const ctaText = "Redefinir Senha";
    const ctaLink = `${APP_URL}/reset-password?token=${token}`;

    try {
        await resend.emails.send({
            from: FROM_EMAIL,
            to: user.email,
            subject: title,
            html: baseTemplate(title, content, ctaText, ctaLink)
        });
        await logEmail(user.id, 'reset_password', 'sent');
    } catch (err) {
        await logEmail(user.id, 'reset_password', 'failed', err.message);
        throw err;
    }
};

exports.sendPaymentApprovedEmail = async (user, amount) => {
    const title = "Pagamento confirmado 🎉";
    const content = `
        <p>Ótimas notícias! Confirmamos o seu pagamento de <span class="highlight">${amount} MZN</span>.</p>
        <p>Seu plano <span class="highlight">ProFit Elite</span> foi ativado e todos os benefícios e funcionalidades ilimitadas foram desbloqueados para você.</p>
    `;
    const ctaText = "Acessar ProFit";
    const ctaLink = `${APP_URL}/dashboard`;

    try {
        await resend.emails.send({
            from: FROM_EMAIL,
            to: user.email,
            subject: title,
            html: baseTemplate(title, content, ctaText, ctaLink)
        });
        await logEmail(user.id, 'payment_success', 'sent');
    } catch (err) {
        await logEmail(user.id, 'payment_success', 'failed', err.message);
        throw err;
    }
};

exports.sendPaymentFailedEmail = async (user, reason) => {
    const title = "Pagamento não concluído";
    const content = `
        <p>Olá, tentamos processar seu pagamento mas não foi possível concluir a transação.</p>
        <p><strong>Motivo provável:</strong> ${reason || 'PIN incorreto ou saldo insuficiente.'}</p>
        <p>Por favor, verifique seus dados no M-Pesa/e-Mola e tente novamente.</p>
    `;
    const ctaText = "Tentar novamente";
    const ctaLink = `${APP_URL}/checkout`;

    try {
        await resend.emails.send({
            from: FROM_EMAIL,
            to: user.email,
            subject: title,
            html: baseTemplate(title, content, ctaText, ctaLink)
        });
        await logEmail(user.id, 'payment_failed', 'sent');
    } catch (err) {
        await logEmail(user.id, 'payment_failed', 'failed', err.message);
        throw err;
    }
};

exports.sendInviteEmail = async (email, inviterName, inviteLink) => {
    const title = "Você foi convidado para o ProFit! 🚀";
    const content = `
        <p>Olá!</p>
        <p>Seu amigo <span class="highlight">${inviterName}</span> convidou você para se juntar ao ProFit, o assistente nutricional inteligente que está transformando vidas.</p>
        <p>Crie sua conta hoje e comece a monitorar sua saúde de forma profissional.</p>
    `;
    const ctaText = "Aceitar Convite";
    const ctaLink = inviteLink;

    try {
        await resend.emails.send({
            from: FROM_EMAIL,
            to: email,
            subject: title,
            html: baseTemplate(title, content, ctaText, ctaLink)
        });
        await logEmail(null, 'invite', 'sent', `Invited by ${inviterName}`);
    } catch (err) {
        await logEmail(null, 'invite', 'failed', err.message);
        throw err;
    }
};

exports.sendReferralMilestoneEmail = async (user, percentage = 50) => {
    const title = `🎉 Você ganhou ${percentage}% de desconto!`;
    const content = `
        <p>Parabéns, <strong>${user.name}</strong>!</p>
        <p>Você atingiu a marca de <span class="highlight">10 amigos ativos</span> (com plano assinado) no ProFit.</p>
        <p>Como prometido, você acabou de ganhar um bônus especial de <span class="highlight">${percentage}% de desconto</span> para usar na sua próxima renovação ou upgrade do ProFit Elite.</p>
    `;
    const ctaText = "Usar Meu Desconto";
    const ctaLink = `${APP_URL}/checkout`;

    try {
        await resend.emails.send({
            from: FROM_EMAIL,
            to: user.email,
            subject: title,
            html: baseTemplate(title, content, ctaText, ctaLink)
        });
        await logEmail(user.id, 'referral_milestone', 'sent');
    } catch (err) {
        await logEmail(user.id, 'referral_milestone', 'failed', err.message);
        throw err;
    }
};

exports.sendPasswordChangedEmail = async (user) => {
    const title = "Sua senha foi alterada";
    const content = `
        <p>Olá, <strong>${user.name}</strong>,</p>
        <p>Confirmamos que a senha da sua conta ProFit foi alterada com sucesso.</p>
        <p>Se você não realizou esta alteração, entre em contato com nossa equipe de segurança agora mesmo.</p>
    `;
    const ctaText = "Acessar minha conta";
    const ctaLink = `${APP_URL}/login`;

    try {
        await resend.emails.send({
            from: FROM_EMAIL,
            to: user.email,
            subject: title,
            html: baseTemplate(title, content, ctaText, ctaLink)
        });
        await logEmail(user.id, 'password_changed', 'sent');
    } catch (err) {
        await logEmail(user.id, 'password_changed', 'failed', err.message);
        throw err;
    }
};

exports.sendWorkoutPlanEmail = async (user, planTitle) => {
    const title = "Seu Plano de Treino está Pronto! 🏋️‍♂️";
    const content = `
        <p>Olá, <strong>${user.name || 'Atleta'}</strong>!</p>
        <p>Ótimas notícias! Sua inteligência artificial acabou de gerar um novo plano de treino focado em: <span class="highlight">${planTitle}</span>.</p>
        <p>O plano foi personalizado com base no seu nível, objetivo e disponibilidade. Você já pode começar a treinar hoje mesmo!</p>
    `;
    const ctaText = "Ver Meu Plano de Treino";
    const ctaLink = `${APP_URL}/workout/active`;

    try {
        await resend.emails.send({
            from: FROM_EMAIL,
            to: user.email,
            subject: title,
            html: baseTemplate(title, content, ctaText, ctaLink)
        });
        await logEmail(user.id, 'workout_plan_ready', 'sent');
    } catch (err) {
        await logEmail(user.id, 'workout_plan_ready', 'failed', err.message);
        console.error('Failed to send workout plan email:', err);
    }
};
