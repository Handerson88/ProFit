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
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
            background-color: #F8FAFC; 
            color: #1E293B;
            line-height: 1.6;
            -webkit-font-smoothing: antialiased;
        }
        .wrapper { width: 100%; padding: 40px 20px; background-color: #F8FAFC; }
        .container { 
            max-width: 600px; 
            background: #ffffff; 
            margin: 0 auto; 
            border-radius: 40px; 
            overflow: hidden; 
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.08);
            border: 1px solid #F1F5F9;
        }
        .header { 
            padding: 60px 40px; 
            text-align: center; 
            background: linear-gradient(135deg, #10B981 0%, #059669 100%);
            position: relative;
        }
        .header::after {
            content: '';
            position: absolute;
            bottom: 0; left: 0; right: 0;
            height: 40px;
            background: #ffffff;
            border-radius: 40px 40px 0 0;
        }
        .content { 
            padding: 20px 50px 60px; 
            text-align: center;
        }
        .footer { 
            padding: 50px 40px; 
            text-align: center; 
            font-size: 13px; 
            color: #64748B; 
            background: #F8FAFC;
            border-top: 1px solid #F1F5F9;
        }
        .logo-text { 
            font-size: 32px; 
            font-weight: 800; 
            color: #ffffff; 
            letter-spacing: -0.05em;
            margin-bottom: 5px;
        }
        .logo-dot { color: #D1FAE5; }
        .badge {
            display: inline-block;
            padding: 6px 16px;
            background: #ECFDF5;
            color: #059669;
            border-radius: 100px;
            font-size: 12px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            margin-bottom: 24px;
        }
        h1 { 
            font-size: 32px; 
            font-weight: 800; 
            margin-bottom: 24px; 
            color: #0F172A;
            letter-spacing: -0.03em;
            line-height: 1.2;
        }
        .text-lead {
            font-size: 18px;
            color: #475569;
            margin-bottom: 32px;
        }
        .main-content {
            font-size: 16px;
            color: #64748B;
            margin-bottom: 40px;
            text-align: left;
            background: #F8FAFC;
            padding: 30px;
            border-radius: 24px;
        }
        .button { 
            display: inline-block; 
            padding: 22px 48px; 
            background: linear-gradient(135deg, #10B981 0%, #059669 100%);
            color: #ffffff !important; 
            text-decoration: none; 
            border-radius: 20px; 
            font-weight: 700; 
            font-size: 18px;
            box-shadow: 0 10px 30px rgba(16, 185, 129, 0.3);
            transition: all 0.3s ease;
        }
        .highlight { color: #059669; font-weight: 700; }
        .divider { height: 1px; background: #F1F5F9; margin: 40px 0; }
        .social-links { margin-top: 24px; }
        .social-links a { 
            margin: 0 10px;
            color: #94A3B8;
            text-decoration: none;
        }
    </style>
</head>
<body>
    <div class="wrapper">
        <div class="container">
            <div class="header">
                <div class="logo-text">ProFit<span class="logo-dot">.</span></div>
                <div style="color: #D1FAE5; font-size: 14px; font-weight: 500;">Premium Nutrition Coaching</div>
            </div>
            <div class="content">
                <div class="badge">Notificação Oficial</div>
                <h1>${title}</h1>
                <div class="main-content">
                    ${content}
                </div>
                ${ctaText ? `
                <div style="margin-top: 20px;">
                    <a href="${ctaLink}" class="button">${ctaText}</a>
                </div>
                ` : ''}
            </div>
            <div class="footer">
                <p style="margin-bottom: 12px; font-weight: 700; color: #0F172A; font-size: 16px;">Vem ser sua melhor versão.</p>
                <p style="margin-bottom: 24px;">Este é um e-mail automático do ecossistema ProFit AI. Por favor, não responda a este endereço.</p>
                <div class="divider"></div>
                <p>© ${new Date().getFullYear()} ProFit AI - Inteligência Nutricional em Saúde</p>
                <p style="margin-top: 8px;">Beira, Moçambique</p>
            </div>
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
        <div class="text-lead">Olá, <strong>${user.name || 'Atleta'}</strong>!</div>
        <p>Estamos muito felizes em ter você conosco na plataforma mais inteligente de nutrição e performance de Moçambique.</p>
        <p>Seu acesso foi configurado com sucesso. A partir de agora, você tem em mãos ferramentas de elite para transformar seu corpo e sua saúde.</p>
        
        <div style="margin: 30px 0; text-align: left; background: #ffffff; padding: 25px; border-radius: 20px; border: 1px solid #F1F5F9;">
            <div style="font-weight: 800; color: #0F172A; margin-bottom: 15px; font-size: 18px;">Próximos Passos:</div>
            <div style="margin-bottom: 12px; display: flex; align-items: center;">
                <span style="background: #ECFDF5; color: #10B981; width: 24px; height: 24px; border-radius: 50%; display: inline-flex; items-center; justify-content: center; font-size: 12px; font-weight: 800; margin-right: 12px;">1</span>
                <span>Finalize o Quiz para que nossa IA entenda seu perfil.</span>
            </div>
            <div style="margin-bottom: 12px; display: flex; align-items: center;">
                <span style="background: #ECFDF5; color: #10B981; width: 24px; height: 24px; border-radius: 50%; display: inline-flex; items-center; justify-content: center; font-size: 12px; font-weight: 800; margin-right: 12px;">2</span>
                <span>Tire sua primeira foto de refeição para escaneamento.</span>
            </div>
            <div style="display: flex; align-items: center;">
                <span style="background: #ECFDF5; color: #10B981; width: 24px; height: 24px; border-radius: 50%; display: inline-flex; items-center; justify-content: center; font-size: 12px; font-weight: 800; margin-right: 12px;">3</span>
                <span>Explore seu plano de treino personalizado.</span>
            </div>
        </div>

        <p>Se precisar de ajuda, basta clicar em "Suporte" dentro do aplicativo.</p>
    `;
    const ctaText = "Ir para o meu Painel";
    const ctaLink = `${APP_URL}/dashboard`;

    try {
        const result = await resend.emails.send({
            from: FROM_EMAIL,
            to: user.email,
            subject: title,
            html: baseTemplate(title, content, ctaText, ctaLink)
        });
        console.log(`[Email] Welcome email sent to ${user.email}. ID: ${result.id}`);
        await logEmail(user.id, 'welcome', 'sent');
    } catch (err) {
        console.error(`[Email] Error sending welcome email to ${user.email}:`, err);
        await logEmail(user.id, 'welcome', 'failed', err.message);
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
    const title = "Seu convite exclusivo chegou! 🚀";
    const content = `
        <p>Olá!</p>
        <p>Temos o prazer de informar que <span class="highlight">${inviterName}</span> convidou você para fazer parte do <span class="highlight">ProFit Elite</span>.</p>
        <p>O ProFit não é apenas um contador de calorias. É o seu novo assistente pessoal de saúde que utiliza inteligência artificial avançada para analisar suas refeições através de fotos e criar planos de treino sob medida para os seus objetivos.</p>
        <p style="margin-top: 10px; font-weight: 600; color: #0F172A;">O que te espera:</p>
        <ul style="margin-bottom: 20px; list-style-type: none; padding-left: 0;">
            <li style="margin-bottom: 8px;">✨ Escaneamento de Refeições por IA</li>
            <li style="margin-bottom: 8px;">🏋️ Treinos Personalizados Dinâmicos</li>
            <li style="margin-bottom: 8px;">📊 Acompanhamento de Macros Profissional</li>
        </ul>
        <p>Clique no botão abaixo para ativar seu convite e realizar seu quiz inicial de perfil.</p>
    `;
    const ctaText = "Começar Agora";
    const ctaLink = inviteLink;

    try {
        const result = await resend.emails.send({
            from: FROM_EMAIL,
            to: email,
            subject: title,
            html: baseTemplate(title, content, ctaText, ctaLink)
        });
        console.log(`[Email] Invite email sent to ${email} (from ${inviterName}). ID: ${result.id}`);
        await logEmail(null, 'invite', 'sent', `Invited by ${inviterName}`);
    } catch (err) {
        console.error(`[Email] Error sending invite email to ${email}:`, err);
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
