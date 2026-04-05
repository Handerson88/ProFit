const getBillingEmailTemplate = (userName, paymentLink) => `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #334155; margin: 0; padding: 0; background-color: #f8fafc; }
        .container { max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); border: 1px solid #e2e8f0; }
        .header { background-color: #0f172a; padding: 32px; text-align: center; color: white; }
        .content { padding: 40px; }
        .footer { padding: 24px; text-align: center; font-size: 12px; color: #64748b; background-color: #f1f5f9; }
        .button { display: inline-block; padding: 14px 28px; background-color: #38a169; color: white !important; text-decoration: none; border-radius: 8px; font-weight: 600; margin-top: 24px; }
        .benefit-item { display: flex; align-items: center; margin-bottom: 12px; }
        .check { color: #38a169; margin-right: 8px; font-weight: bold; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1 style="margin:0; font-size: 24px;">ProFit</h1>
        </div>
        <div class="content">
            <h2 style="color: #0f172a; margin-top: 0;">Olá ${userName},</h2>
            <p>Percebemos que o seu plano no <strong>ProFit</strong> encontra-se inativo ou com pagamento pendente.</p>
            <p>Para evitar a interrupção dos seus benefícios, recomendamos atualizar o seu plano agora.</p>
            
            <p>Clique no botão abaixo para ativar:</p>
            
            <div style="text-align: center;">
                <a href="${paymentLink}" class="button">Ativar Meu Plano agora</a>
            </div>

            <p style="margin-top: 24px;">Ao atualizar, você volta a ter acesso imediato a:</p>
            <div class="benefit-item"><span class="check">🔥</span> Plano alimentar personalizado</div>
            <div class="benefit-item"><span class="check">💪</span> Treinos inteligentes com IA</div>
            <div class="benefit-item"><span class="check">📊</span> Acompanhamento completo</div>
            
            <p style="margin-top: 32px; font-size: 14px; color: #64748b;">Caso já tenha efetuado o pagamento, pode ignorar esta mensagem.</p>
            
            <p style="margin-top: 24px; margin-bottom: 0;">Atenciosamente,<br><strong>Equipe ProFit 🚀</strong></p>
        </div>
        <div class="footer">
            <p>Este e-mail foi enviado para você porque você se cadastrou no ProFit.</p>
            <p>Beira, Moçambique — Bairro Central, Rua da Correia, 123.</p>
            <div class="divider" style="height: 1px; background-color: #e2e8f0; margin: 16px 0;"></div>
            <p>© ${new Date().getFullYear()} ProFit AI. Todos os direitos reservados.</p>
            <p style="margin-top: 12px;">
                <a href="${process.env.FRONTEND_URL || 'https://myprofittness.com'}/profile/settings" style="color: #56AB2F;">Configurações da Conta</a> | 
                <a href="${process.env.FRONTEND_URL || 'https://myprofittness.com'}/unsubscribe" style="color: #56AB2F;">Não receber mais e-mails</a>
            </p>
        </div>
    </div>
</body>
</html>
`;

module.exports = { getBillingEmailTemplate };
