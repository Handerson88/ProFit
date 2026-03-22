const { Resend } = require('resend');
const db = require('../config/database');

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'ProFit <onboarding@resend.dev>';
const APP_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

const baseTemplate = (title, content, ctaText, ctaLink) => `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; 
            background-color: #0f172a; 
            margin: 0; padding: 40px 20px;
            color: #f8fafc;
        }
        .wrapper { width: 100%; max-width: 600px; margin: 0 auto; }
        .container { 
            background-color: #1e293b; 
            padding: 48px; 
            border-radius: 24px; 
            box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
        }
        .logo { 
            font-size: 24px; font-weight: 800; color: #10b981; 
            margin-bottom: 32px; letter-spacing: -0.02em; 
        }
        .content { font-size: 16px; line-height: 1.6; color: #cbd5e1; margin-bottom: 32px; }
        .content p { margin-bottom: 20px; }
        .cta-container { text-align: center; margin: 40px 0; }
        .button { 
            display: inline-block; 
            padding: 16px 32px; 
            background: linear-gradient(135deg, #10b981 0%, #059669 100%);
            color: #ffffff !important; 
            text-decoration: none; 
            border-radius: 12px; 
            font-weight: 700; 
            font-size: 16px;
            text-align: center;
        }
        .footer { 
            text-align: center; margin-top: 32px; 
            font-size: 13px; color: #64748b; 
        }
        .divider { height: 1px; background: #334155; margin: 24px 0; }
    </style>
</head>
<body>
    <div class="wrapper">
        <div class="container">
            <div class="logo">ProFit</div>
            <div class="content">
                ${content}
            </div>
            ${ctaText ? `
            <div class="cta-container">
                <a href="${ctaLink}" class="button">${ctaText}</a>
            </div>
            ` : ''}
        </div>
        <div class="footer">
            <p>— Equipe ProFit</p>
            <div class="divider"></div>
            <p>© ${new Date().getFullYear()} ProFit AI. Beira, Moçambique.</p>
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
    const title = "Seja bem-vindo ao ProFit! 🎉";
    const content = `
        <p>Olá, <strong>${user.name || 'Atleta'}</strong>!</p>
        <p>Sua conta está ativa e pronta para uso.</p>
        <p>A partir de agora, você tem acesso às ferramentas de elite para transformar seu corpo e sua saúde.</p>
        <p>Comece tirando sua primeira foto de refeição ou explorando seu novo plano de treino.</p>
    `;
    const ctaText = "Ir para o meu Painel";
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
        console.error(`[Email] Error sending welcome email to ${user.email}:`, err);
        await logEmail(user.id, 'welcome', 'failed', err.message);
    }
};

exports.sendResetPasswordEmail = async (user, token) => {
    const title = "Recuperar sua senha";
    const content = `
        <p>Olá, recebemos uma solicitação para redefinir sua senha.</p>
        <p>Para prosseguir com a alteração, clique no botão abaixo:</p>
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
        <p>Olá, confirmamos o recebimento do seu pagamento de <strong>${amount} MZN</strong>.</p>
        <p>Seu plano ProFit Elite foi ativado e todas as funcionalidades ilimitadas foram desbloqueadas.</p>
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
        <p><strong>Motivo:</strong> ${reason || 'PIN incorreto ou saldo insuficiente.'}</p>
        <p>Por favor, verifique seus dados e tente novamente.</p>
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
    const title = "Seu acesso ao ProFit";
    const content = `
        <p>Olá 👋,</p>
        <p>A equipe do ProFit preparou o seu acesso.</p>
        <p>Para começar, basta definir sua senha e ativar sua conta:</p>
    `;
    const ctaText = "Começar agora";
    const ctaLink = inviteLink;

    const footerDetails = `
        <p style="margin-top: 24px; color: #64748b; font-size: 14px;">Leva menos de 1 minuto.</p>
        <p style="margin-top: 8px; color: #64748b; font-size: 14px;">Se você não solicitou este acesso, pode ignorar este email.</p>
    `;

    try {
        await resend.emails.send({
            from: FROM_EMAIL,
            to: email,
            subject: title,
            html: baseTemplate(title, content + footerDetails, ctaText, ctaLink)
        });
        console.log(`[Email] Invite email sent to ${email}`);
        await logEmail(null, 'invite', 'sent', `Invited by ${inviterName}`);
    } catch (err) {
        console.error(`[Email] Error sending invite email to ${email}:`, err);
        await logEmail(null, 'invite', 'failed', err.message);
        throw err;
    }
};

exports.sendReferralMilestoneEmail = async (user, percentage = 50) => {
    const title = "🎉 Você ganhou um desconto!";
    const content = `
        <p>Parabéns, <strong>${user.name}</strong>!</p>
        <p>Você atingiu a marca de 10 amigos ativos no ProFit.</p>
        <p>Como prometido, você ganhou um bônus especial de <strong>${percentage}% de desconto</strong> para sua próxima renovação.</p>
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
        <p>Se você não realizou esta alteração, entre em contato imediatamente.</p>
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
    const title = "Seu Plano de Treino está Pronto!";
    const content = `
        <p>Olá, <strong>${user.name || 'Atleta'}</strong>!</p>
        <p>Temos o seu novo plano de treino focado em: <strong>${planTitle}</strong>.</p>
        <p>O plano foi personalizado com base no seu nível e objetivo. Já pode começar!</p>
    `;
    const ctaText = "Ver Meu Plano";
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

exports.sendBillingEmail = async (user, paymentLink) => {
    const { getBillingEmailTemplate } = require('../templates/billingEmail');
    const title = "⚠️ Seu acesso ao ProFit pode ser interrompido";
    
    try {
        await resend.emails.send({
            from: FROM_EMAIL,
            to: user.email,
            subject: title,
            html: getBillingEmailTemplate(user.name || 'Atleta', paymentLink)
        });
        await logEmail(user.id, 'billing_reminder', 'sent');
        return true;
    } catch (err) {
        await logEmail(user.id, 'billing_reminder', 'failed', err.message);
        console.error('Failed to send billing email:', err);
        throw err;
    }
};
