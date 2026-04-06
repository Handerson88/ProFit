const { Resend } = require('resend');
const db = require('../config/database');
const { getMaputoNow } = require('../utils/dateUtils');
const dayjs = require('dayjs');

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'ProFit <onboarding@resend.dev>';
const APP_URL = process.env.FRONTEND_URL || 'https://app.myprofittness.com';
const fs = require('fs');
const path = require('path');

/**
 * Replaces dynamic variables in text
 * @param {string} text - The text with {{nome}}, {{email}}, {{pais}}
 * @param {object} user - User object with name, email, country
 */
const parseMessage = (text, user) => {
    if (!text) return '';
    return text
        .replace(/{{nome}}/g, user.name || 'Usuário')
        .replace(/{{email}}/g, user.email || '')
        .replace(/{{pais}}/g, user.country || 'seu país');
};

/**
 * Loads and populates an HTML template with data
 */
const loadTemplate = (templateName, data = {}) => {
    try {
        const templatePath = path.join(__dirname, '../templates/emails', `${templateName}.html`);
        if (!fs.existsSync(templatePath)) return null;
        let html = fs.readFileSync(templatePath, 'utf8');
        
        // Simple placeholder replacement {{key}}
        Object.keys(data).forEach(key => {
            const regex = new RegExp(`{{${key}}}`, 'g');
            html = html.replace(regex, data[key]);
        });

        // Handle simple conditional blocks: {{#if key}} content {{/if}}
        // If data[key] is falsy, remove the entire block
        const ifRegex = /{{#if (.*?)}}([\s\S]*?){{\/if}}/g;
        html = html.replace(ifRegex, (match, key, content) => {
            return data[key.trim()] ? content : '';
        });

        // Default placeholders
        html = html.replace(/{{APP_URL}}/g, APP_URL);
        html = html.replace(/{{unsubscribe_link}}/g, `${APP_URL}/unsubscribe`);
        
        return html;
    } catch (err) {
        console.error(`[EmailService] Error loading template ${templateName}:`, err);
        return null;
    }
};

/**
 * Master Template for all ProFit Emails
 * Ensures consistent UI, identity, and structure.
 */
const getMasterTemplate = (title, message, ctaText = null, ctaLink = null, user = {}) => {
    const name = user.name || 'Usuário';
    const personalizedMessage = message.replace(/{{nome}}/g, name);
    
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <style>
        body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; margin: 0; padding: 0; background-color: #f5f7f6; -webkit-font-smoothing: antialiased; }
        .wrapper { width: 100%; table-layout: fixed; background-color: #f5f7f6; padding: 40px 0; }
        .main { background-color: #ffffff; width: 100%; max-width: 600px; margin: 0 auto; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05); }
        .header { background-color: #22c55e; padding: 30px; text-align: center; }
        .logo { font-size: 28px; font-weight: 900; color: #ffffff; letter-spacing: -1px; text-decoration: none; }
        .content { padding: 40px; text-align: left; }
        .title { font-size: 24px; font-weight: 800; color: #111827; margin: 0 0 16px; line-height: 1.2; }
        .text { font-size: 16px; line-height: 1.6; color: #4b5563; margin: 0 0 32px; }
        .button-container { text-align: center; margin-bottom: 8px; }
        .button { display: inline-block; background-color: #22c55e; color: #ffffff !important; padding: 18px 40px; border-radius: 10px; text-decoration: none; font-weight: 700; font-size: 16px; transition: all 0.2s; }
        .footer { padding: 30px; text-align: center; font-size: 12px; color: #9ca3af; line-height: 1.5; }
        .footer a { color: #22c55e; text-decoration: none; font-weight: 600; }
        @media screen and (max-width: 480px) { .content { padding: 30px 20px; } .title { font-size: 20px; } .main { border-radius: 0; } }
    </style>
</head>
<body>
    <div class="wrapper">
        <div class="main">
            <div class="header">
                <a href="${APP_URL}" class="logo">ProFit</a>
            </div>
            <div class="content">
                <h1 class="title">${title}</h1>
                <p class="text">${personalizedMessage}</p>
                ${ctaText && ctaLink ? `
                <div class="button-container">
                    <a href="${ctaLink}" class="button">${ctaText}</a>
                </div>` : ''}
            </div>
            <div class="footer">
                <strong>ProFit AI</strong> &copy; 2026<br>
                Sua jornada fitness profissional.<br><br>
                <a href="${APP_URL}/unsubscribe">Descadastrar (Unsubscribe)</a>
            </div>
        </div>
    </div>
</body>
</html>
    `;
};

const logEmail = async (userId, type, status, details = null) => {
    try {
        await db.query(`
            INSERT INTO email_logs (user_id, email_type, status, details)
            VALUES ($1, $2, $3, $4)
        `, [userId || null, type, status, details]);
    } catch (err) {
        console.error('Failed to log email:', err);
    }
};

// --- AUTH EMAILS ---

exports.sendAccountConfirmationEmail = async (user, token) => {
    const confirmationLink = `${APP_URL}/confirm?token=${token}`;
    const name = user.name || 'Atleta';
    const title = 'Confirme sua conta ProFit ✔️';
    const message = `Olá {{nome}}! Seja bem-vindo à elite. Para começar sua transformação e acessar todas as ferramentas de IA, confirme seu e-mail no botão abaixo.`;

    const html = getMasterTemplate(title, message, 'Confirmar Conta', confirmationLink, user);
    const text = `Olá ${name}! Confirme sua conta ProFit clicando aqui: ${confirmationLink}`;

    try {
        await resend.emails.send({
            from: FROM_EMAIL,
            to: user.email,
            subject: 'Confirmação de conta: ProFit',
            text,
            html,
            headers: {
                'List-Unsubscribe': `<${APP_URL}/unsubscribe>`,
                'Precedence': 'bulk'
            }
        });
        await logEmail(user.id, 'confirmation', 'sent');
    } catch (err) {
        await logEmail(user.id, 'confirmation', 'failed', err.message);
    }
};

exports.sendWelcomeEmail = async (user) => {
    const startLink = `${APP_URL}/quiz`;
    const name = user.name || 'Atleta';
    const title = 'Bem-vindo ao ProFit 💚';
    const message = `Olá {{nome}}! Sua jornada para uma vida mais saudável e produtiva começa agora. Estamos felizes em ter você a bordo. Vamos configurar seu plano personalizado?`;

    const html = getMasterTemplate(title, message, 'Começar Agora', startLink, user);
    const text = `Olá ${name}! Bem-vindo ao ProFit. Comece aqui: ${startLink}`;

    try {
        await resend.emails.send({
            from: FROM_EMAIL,
            to: user.email,
            subject: 'Bem-vindo ao ProFit',
            text,
            html,
            headers: {
                'List-Unsubscribe': `<${APP_URL}/unsubscribe>`,
                'Precedence': 'bulk'
            }
        });
        await logEmail(user.id, 'welcome', 'sent');
    } catch (err) {
        await logEmail(user.id, 'welcome', 'failed', err.message);
    }
};

exports.sendResetPasswordEmail = async (user, token) => {
    const resetLink = `${APP_URL}/reset-password?token=${token}`;
    const name = user.name || 'atleta';
    const title = 'Recupere seu acesso 🔐';
    const message = `Olá {{nome}}! Recebemos um pedido de recuperação de senha para sua conta. Se foi você, utilize o botão abaixo. O link é válido por apenas 1 hora por motivos de segurança.`;

    const html = getMasterTemplate(title, message, 'Redefinir Senha', resetLink, user);
    const text = `Olá ${name}! Recupere sua senha ProFit aqui: ${resetLink}`;

    try {
        await resend.emails.send({
            from: FROM_EMAIL,
            to: user.email,
            subject: 'Instruções para nova senha: ProFit',
            text,
            html,
            headers: {
                'List-Unsubscribe': `<${APP_URL}/unsubscribe>`,
                'Precedence': 'bulk'
            }
        });
        await logEmail(user.id, 'reset_password', 'sent');
    } catch (err) {
        await logEmail(user.id, 'reset_password', 'failed', err.message);
        throw err;
    }
};

exports.sendPasswordChangedEmail = async (user) => {
    const loginLink = `${APP_URL}/login`;
    const title = 'Senha alterada com sucesso ✅';
    const message = `Olá {{nome}}! Sua senha do ProFit foi alterada com sucesso. Se você não reconhece esta ação, entre em contato com nosso suporte imediatamente para proteger sua conta.`;

    const html = getMasterTemplate(title, message, 'Acessar Conta', loginLink, user);
    const text = `Olá! Sua senha foi alterada. Se não foi você, contate o suporte.`;

    try {
        await resend.emails.send({
            from: FROM_EMAIL,
            to: user.email,
            subject: 'Segurança: Sua senha foi alterada',
            text,
            html,
            headers: {
                'List-Unsubscribe': `<${APP_URL}/unsubscribe>`,
                'Precedence': 'bulk'
            }
        });
        await logEmail(user.id, 'password_changed', 'sent');
    } catch (err) {
        await logEmail(user.id, 'password_changed', 'failed', err.message);
    }
};

// --- BILLING EMAILS ---

exports.sendBillingEmail = async (user, paymentLink) => {
    const title = 'Assinatura ProFit: Atenção Necessária 💳';
    const name = user.name || 'Atleta';
    const message = `Olá {{nome}}! Notamos que sua assinatura ProFit precisa de atenção para continuar ativa. Regularize seu acesso agora para não perder o acompanhamento da sua evolução.`;

    const html = getMasterTemplate(title, message, 'Regularizar Agora', paymentLink, user);
    const text = `Olá ${name}! Regularize sua assinatura ProFit aqui: ${paymentLink}`;

    try {
        await resend.emails.send({
            from: FROM_EMAIL,
            to: user.email,
            subject: 'Atualização importante da sua assinatura',
            text,
            html,
            headers: {
                'List-Unsubscribe': `<${APP_URL}/unsubscribe>`,
                'Precedence': 'bulk'
            }
        });
        await logEmail(user.id, 'billing_reminder', 'sent');
        return true;
    } catch (err) {
        await logEmail(user.id, 'billing_reminder', 'failed', err.message);
        throw err;
    }
};




exports.sendPaymentApprovedEmail = async (user) => {
    const dashboardLink = `${APP_URL}/dashboard`;
    const title = 'Pagamento confirmado - Seu acesso está liberado 🎉';
    const message = `Olá {{nome}}! Seu acesso ao ProFit foi ativado com sucesso. Agora você já pode entrar e começar sua jornada.`;

    const html = getMasterTemplate(title, message, 'Acessar app', dashboardLink, user);
    const text = `Seu acesso ao ProFit foi ativado com sucesso. Acesse aqui: ${dashboardLink}`;

    try {
        await resend.emails.send({
            from: FROM_EMAIL,
            to: user.email,
            subject: 'Pagamento confirmado - Seu acesso está liberado 🎉',
            text,
            html,
            headers: {
                'List-Unsubscribe': `<${APP_URL}/unsubscribe>`,
                'Precedence': 'bulk'
            }
        });
        await logEmail(user.id, 'payment_success', 'sent');
    } catch (err) {
        await logEmail(user.id, 'payment_success', 'failed', err.message);
    }
};

exports.sendPaymentFailedEmail = async (user, reason) => {
    const checkoutLink = `${APP_URL}/checkout`;
    const title = 'Pagamento não concluído ⚠️';
    const message = `Olá {{nome}}! Tentamos processar sua assinatura mas houve um problema. Motivo: ${reason || 'Erro na transação'}. Por favor, verifique seus dados de pagamento para manter seu acesso Pro.`;

    const html = getMasterTemplate(title, message, 'Tentar Novamente', checkoutLink, user);
    const text = `Olá! Não conseguimos processar seu pagamento. Tente novamente em: ${checkoutLink}`;

    try {
        await resend.emails.send({
            from: FROM_EMAIL,
            to: user.email,
            subject: 'Aviso de transação não concluída',
            text,
            html,
            headers: {
                'List-Unsubscribe': `<${APP_URL}/unsubscribe>`,
                'Precedence': 'bulk'
            }
        });
        await logEmail(user.id, 'payment_failed', 'sent');
    } catch (err) {
        await logEmail(user.id, 'payment_failed', 'failed', err.message);
    }
};

// --- ENGAGEMENT EMAILS ---

exports.sendUsageReminderEmail = async (user) => {
    const dashboardLink = `${APP_URL}/dashboard`;
    const title = 'Não quebre sua sequência! 🔥';
    const message = `Olá {{nome}}! Notamos que você ainda não registrou suas refeições hoje. Manter a constância é o segredo para atingir seu objetivo. Vamos registrar agora?`;

    const html = getMasterTemplate(title, message, 'Abrir ProFit', dashboardLink, user);
    const text = `Olá! Não esqueça de registrar suas refeições de hoje no ProFit.`;

    try {
        await resend.emails.send({
            from: FROM_EMAIL,
            to: user.email,
            subject: 'Lembrete de registro diário: ProFit',
            text,
            html,
            headers: {
                'List-Unsubscribe': `<${APP_URL}/unsubscribe>`,
                'Precedence': 'bulk'
            }
        });
        await logEmail(user.id, 'usage_reminder', 'sent');
    } catch (err) {
        await logEmail(user.id, 'usage_reminder', 'failed', err.message);
    }
};

exports.sendProgressReportEmail = async (user) => {
    const statsLink = `${APP_URL}/stats`;
    const title = 'Seu progresso da semana chegou! 📊';
    const message = `Olá {{nome}}! Seus dados foram processados e seu relatório de evolução está pronto. Venha ver como você se saiu e quais são os próximos passos.`;

    const html = getMasterTemplate(title, message, 'Ver Meu Progresso', statsLink, user);
    const text = `Olá! Seu relatório de progresso está pronto.`;

    try {
        await resend.emails.send({
            from: FROM_EMAIL,
            to: user.email,
            subject: 'Relatório Semanal de Evolução',
            text,
            html,
            headers: {
                'List-Unsubscribe': `<${APP_URL}/unsubscribe>`,
                'Precedence': 'bulk'
            }
        });
        await logEmail(user.id, 'progress_report', 'sent');
    } catch (err) {
        await logEmail(user.id, 'progress_report', 'failed', err.message);
    }
};

exports.sendWorkoutPlanEmail = async (user, planTitle) => {
    const workoutLink = `${APP_URL}/workout/active`;
    const title = 'Seu Plano de Treino está Pronto! 🔥';
    const message = `Olá {{nome}}! Nossa inteligência criou um plano focado em: ${planTitle}. O treino foi personalizado para o seu nível e objetivo atual.`;

    const html = getMasterTemplate(title, message, 'Ver Treino', workoutLink, user);
    const text = `Olá! Seu novo plano de treino (${planTitle}) está pronto.`;

    try {
        await resend.emails.send({
            from: FROM_EMAIL,
            to: user.email,
            subject: 'Atualização: Plano de Treino',
            text,
            html,
            headers: {
                'List-Unsubscribe': `<${APP_URL}/unsubscribe>`,
                'Precedence': 'bulk'
            }
        });
        await logEmail(user.id, 'workout_plan_ready', 'sent');
    } catch (err) {
        await logEmail(user.id, 'workout_plan_ready', 'failed', err.message);
    }
};

// --- OTHERS ---

exports.sendInviteEmail = async (email, inviterName, inviteLink) => {
    const title = 'Você foi convidado para o ProFit 🎁';
    const message = `Olá! Você recebeu um convite especial de **${inviterName}** para se juntar ao ProFit. Prepare-se para transformar sua saúde com a ajuda da nossa Inteligência Artificial acadêmica.`;

    // Passing empty user object as we only have email here, but getMasterTemplate handles it
    const html = getMasterTemplate(title, message, 'Aceitar Convite', inviteLink, { name: 'Atleta' });
    const text = `Olá! Você foi convidado para o ProFit por ${inviterName}. Ative sua conta aqui: ${inviteLink}`;

    try {
        await resend.emails.send({
            from: FROM_EMAIL,
            to: email,
            subject: 'Seu convite exclusivo para o ProFit',
            text,
            html
        });
        await logEmail(null, 'invite', 'sent');
    } catch (err) {
        await logEmail(null, 'invite', 'failed', err.message);
    }
};

exports.sendReferralMilestoneEmail = async (user, percentage = 50) => {
    const checkoutLink = `${APP_URL}/plans`;
    const title = '🎉 Recompensa Ativada: Você ganhou um bônus!';
    const name = user.name || 'Atleta';
    const message = `Parabéns {{nome}}! Você atingiu a meta de indicações e, como prometido, liberamos um bônus exclusivo de **${percentage}% de desconto** para sua próxima renovação Pro.`;

    const html = getMasterTemplate(title, message, 'Ver Meus Planos', checkoutLink, user);
    const text = `Parabéns ${name}! Você ganhou ${percentage}% de desconto.`;

    try {
        await resend.emails.send({
            from: FROM_EMAIL,
            to: user.email,
            subject: 'Recompensa ProFit: Seu desconto chegou!',
            text,
            html
        });
        await logEmail(user.id, 'referral_milestone', 'sent');
    } catch (err) {
        await logEmail(user.id, 'referral_milestone', 'failed', err.message);
    }
};

exports.sendSubscriptionReminderEmail = async (user, daysLeft, expirationDate) => {
    const formattedDate = dayjs(expirationDate).tz('Africa/Maputo').format('DD/MM/YYYY');
    const plansLink = `${APP_URL}/plans`;
    const title = 'Seu Acesso Pro expirará em breve ⏳';
    const message = `Olá {{nome}}! Notamos que seu plano ProFit Pro expira no dia **${formattedDate}** (${daysLeft} dias restantes). Renove agora para garantir que sua evolução não seja interrompida.`;

    const html = getMasterTemplate(title, message, 'Renovar Plano', plansLink, user);
    const text = `Seu plano ProFit expira em ${daysLeft} dias (${formattedDate}).`;

    try {
        await resend.emails.send({
            from: FROM_EMAIL,
            to: user.email,
            subject: 'Aviso: Sua assinatura Pro está chegando ao fim',
            text,
            html
        });
        await logEmail(user.id, 'subscription_reminder', 'sent');
    } catch (err) {
        await logEmail(user.id, 'subscription_reminder', 'failed', err.message);
    }
};

exports.sendSubscriptionExpiredEmail = async (user) => {
    const plansLink = `${APP_URL}/plans`;
    const title = 'Sentimos sua falta no ProFit Pro 😢';
    const message = `Olá {{nome}}! Seu plano Pro expirou e as funções premium de análise por IA foram bloqueadas. Não se preocupe, seus dados continuam seguros! Basta renovar seu acesso para voltar ao topo.`;

    const html = getMasterTemplate(title, message, 'Renovar Agora', plansLink, user);
    const text = `Seu plano ProFit Pro expirou. Renove em: ${plansLink}`;

    try {
        await resend.emails.send({
            from: FROM_EMAIL,
            to: user.email,
            subject: 'Acesso ProFit Pro Expirado',
            text,
            html
        });
        await logEmail(user.id, 'subscription_expired', 'sent');
    } catch (err) {
        await logEmail(user.id, 'subscription_expired', 'failed', err.message);
    }
};

exports.sendGroupEmail = async (target, subject, content, buttonText, buttonLink, userIds = []) => {
    let query = 'SELECT id, name, email, country FROM users WHERE is_active = true';
    const params = [];

    if (userIds && userIds.length > 0) {
        query += " AND id = ANY($1::uuid[])";
        params.push(userIds);
    } else if (target === 'pro') {
        query += " AND plan_type = 'pro'";
    } else if (target === 'active') {
        query += " AND last_active_at > NOW() - INTERVAL '7 days'";
    } else if (target === 'inactive') {
        query += " AND (last_active_at IS NULL OR last_active_at < NOW() - INTERVAL '7 days')";
    }

    const { rows: users } = await db.query(query, params);
    const totalUsers = users.length;
    
    console.log(`[EmailService] Sending group email to ${totalUsers} users (Target: ${target})`);

    const results = { 
        success: true, 
        sent: 0, 
        failed: 0, 
        errors: [],
        total: totalUsers 
    };

    if (totalUsers === 0) {
        return { ...results, success: false, message: 'Nenhum usuário encontrado para este público.' };
    }

    for (const user of users) {
        const finalSubject = parseMessage(subject, user);
        const finalContent = parseMessage(content, user);
        
        const html = getMasterTemplate(finalSubject, finalContent, buttonText || null, buttonLink || null, user);
        const text = `${finalSubject}\n\n${finalContent}\n\n${buttonLink ? `Acesse: ${buttonLink}` : ''}`;

        try {
            const response = await resend.emails.send({
                from: FROM_EMAIL,
                to: user.email,
                subject: finalSubject,
                text,
                html,
                headers: {
                    'List-Unsubscribe': `<${APP_URL}/unsubscribe>`,
                    'Precedence': 'bulk'
                }
            });

            if (response.error) {
                throw new Error(response.error.message || 'Resend error');
            }

            await logEmail(user.id, 'marketing_email', 'sent', `Target: ${target}`);
            results.sent++;
        } catch (err) {
            console.error(`[EmailService] Failed to send to ${user.email}:`, err.message);
            await logEmail(user.id, 'marketing_email', 'failed', err.message);
            results.failed++;
            if (!results.errors.includes(err.message)) {
                results.errors.push(err.message);
            }
        }
    }

    // Professional Summary Log
    await logEmail(null, 'marketing_summary', results.failed === 0 ? 'success' : 'partial', JSON.stringify({
        status: results.failed === 0 ? 'success' : 'error',
        date: getMaputoNow().format('YYYY-MM-DD'),
        total: results.total,
        sent: results.sent,
        failed: results.failed,
        target: target
    }));

    return results;
};

/**
 * Envia convite especial para Influenciadores
 */
exports.sendInfluencerInviteEmail = async (email, name, inviteLink) => {
    try {
        const subject = "Você foi selecionado para o ProFit 🚀";
        const message = `Parabéns! 🎉<br/><br/>Você foi selecionado para fazer parte do grupo exclusivo de influenciadores do ProFit.<br/><br/>Agora você terá acesso <b>TOTAL</b> ao aplicativo de forma gratuita, sem limitações.<br/><br/>Estamos confiantes de que juntos teremos grandes resultados 🚀`;
        
        const html = getMasterTemplate(subject, message, "Ativar Acesso VIP", inviteLink, { name });

        const { data, error } = await resend.emails.send({
            from: FROM_EMAIL,
            to: email,
            subject,
            html,
            headers: {
                'List-Unsubscribe': `<${APP_URL}/unsubscribe>`,
                'Precedence': 'bulk'
            }
        });

        if (error) throw error;
        return data;
    } catch (error) {
        console.error('[EmailService] Error sending influencer invite:', error);
        throw error;
    }
};
