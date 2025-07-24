import { NextRequest, NextResponse } from 'next/server'

// Interface para os dados do email de reset de senha
interface PasswordResetEmailData {
  nome: string
  email: string
  novaSenha: string
}

export async function POST(request: NextRequest) {
  try {
    const { nome, email, novaSenha }: PasswordResetEmailData = await request.json()

    console.log('📧 Enviando email de reset de senha para:', email)

    // Verificar se estamos em produção e temos a API key do Resend
    const resendApiKey = process.env.RESEND_API_KEY
    
    // ULTRA AGGRESSIVE: Check for any signs we're on Vercel/Production
    const isOnVercel = process.env.VERCEL === '1'
    const isVercelProduction = process.env.VERCEL_ENV === 'production'
    const isNodeProduction = process.env.NODE_ENV === 'production'
    
    // NEW: Check for domain patterns and deployment indicators
    const hasVercelDomain = process.env.VERCEL_URL?.includes('.vercel.app') || process.env.VERCEL_URL?.includes('macaly.dev')
    const isVercelDeployment = !!process.env.VERCEL_URL || isOnVercel
    const hasProductionDomain = process.env.VERCEL_URL?.includes('macaly.dev')
    
    // OVERRIDE: If we have RESEND_API_KEY and we're NOT on localhost, assume production
    const notLocalhost = !process.env.VERCEL_URL?.includes('localhost') && 
                         !process.env.VERCEL_URL?.includes('127.0.0.1') &&
                         !process.env.VERCEL_URL?.includes('.local')
    
    const hasCloudflareHeaders = process.env.CF_RAY || process.env.CF_VISITOR
    const isDeployedEnvironment = isVercelDeployment || hasProductionDomain || hasCloudflareHeaders
    
    // 🚨 FORCE PRODUCTION MODE: If we have RESEND_API_KEY, assume production
    const forceProductionMode = !!resendApiKey
    
    // FINAL DECISION: Consider production if we have API key and we're deployed
    const isProductionEnvironment = (
      isNodeProduction || 
      isVercelProduction ||
      isVercelDeployment ||
      hasVercelDomain ||
      hasProductionDomain ||
      (!!resendApiKey && isDeployedEnvironment && notLocalhost) ||
      forceProductionMode // 🔥 FORCE PRODUCTION if API key exists
    )
    
    const isProduction = isProductionEnvironment && resendApiKey

    console.log('📧 Password reset email environment check (ULTRA AGGRESSIVE):', {
      isOnVercel,
      isVercelProduction,
      isNodeProduction,
      isVercelDeployment,
      hasVercelDomain,
      hasProductionDomain,
      notLocalhost,
      hasCloudflareHeaders,
      isDeployedEnvironment,
      isProductionEnvironment,
      hasResendKey: !!resendApiKey,
      finalIsProduction: isProduction
    })

    if (isProduction) {
      // Produção: Enviar email real via Resend
      try {
        const { Resend } = await import('resend')
        const resend = new Resend(resendApiKey)

        const emailHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Nova Senha - Portal do Cliente AG Assessoria</title>
          <style>
            body { 
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
              line-height: 1.6; 
              margin: 0; 
              padding: 0; 
              background: linear-gradient(135deg, #fff8f8 0%, #f8f4ff 100%);
            }
            .container { 
              max-width: 650px; 
              margin: 20px auto; 
              background: white; 
              border-radius: 20px; 
              box-shadow: 0 25px 50px rgba(90, 59, 146, 0.15);
              overflow: hidden;
              border: 3px solid #dc2626;
            }
            .header { 
              text-align: center; 
              padding: 40px 30px 30px; 
              background: linear-gradient(135deg, #dc2626 0%, #991b1b 50%, #ef4444 100%);
              color: white;
              position: relative;
            }
            .header::before {
              content: '';
              position: absolute;
              top: 0;
              left: 0;
              right: 0;
              bottom: 0;
              background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="grain" width="100" height="100" patternUnits="userSpaceOnUse"><circle cx="25" cy="25" r="1" fill="%23f87171" opacity="0.1"/><circle cx="75" cy="75" r="1" fill="%23f87171" opacity="0.15"/><circle cx="50" cy="10" r="0.5" fill="%23fca5a5" opacity="0.1"/></pattern></defs><rect width="100" height="100" fill="url(%23grain)"/></svg>');
            }
            .logo-container {
              position: relative;
              z-index: 2;
              margin-bottom: 20px;
            }
            .logo-image {
              max-width: 240px;
              height: auto;
              display: block;
              margin: 0 auto;
              filter: brightness(0) invert(1);
              border-radius: 10px;
              padding: 10px;
              background: rgba(248, 113, 113, 0.1);
            }
            .header-title { 
              font-size: 32px; 
              font-weight: 800; 
              margin: 25px 0 15px; 
              text-shadow: 0 3px 6px rgba(0,0,0,0.3);
              position: relative;
              z-index: 2;
              color: #fca5a5;
              display: flex;
              align-items: center;
              justify-content: center;
              gap: 12px;
            }
            .subtitle { 
              font-size: 18px; 
              opacity: 0.95; 
              font-weight: 500;
              position: relative;
              z-index: 2;
              background: rgba(248, 113, 113, 0.2);
              padding: 8px 20px;
              border-radius: 25px;
              display: inline-block;
            }
            .content { 
              padding: 45px 35px; 
              background: white;
            }
            .greeting {
              font-size: 26px;
              color: #5a3b92;
              font-weight: 700;
              margin-bottom: 30px;
              text-align: center;
              text-shadow: 0 2px 4px rgba(90, 59, 146, 0.1);
            }
            .message-section {
              font-size: 18px;
              color: #991b1b;
              line-height: 1.9;
              margin-bottom: 35px;
              text-align: center;
              background: linear-gradient(135deg, #fff5f5 0%, #fef2f2 100%);
              padding: 30px;
              border-radius: 20px;
              border: 2px solid #dc2626;
              box-shadow: 0 8px 25px rgba(220, 38, 38, 0.1);
              position: relative;
            }
            .message-section::before {
              content: '🔐';
              position: absolute;
              top: -15px;
              left: 50%;
              transform: translateX(-50%);
              background: white;
              padding: 10px;
              font-size: 24px;
              border-radius: 50%;
              border: 3px solid #dc2626;
            }
            .credentials-box { 
              background: linear-gradient(135deg, #fff8f8 0%, #fef2f2 100%);
              border: 3px solid #dc2626; 
              border-radius: 20px; 
              padding: 35px; 
              margin: 35px 0; 
              text-align: center;
              box-shadow: 0 12px 35px rgba(220, 38, 38, 0.15);
              position: relative;
            }
            .credentials-box::before {
              content: '';
              position: absolute;
              top: -2px;
              left: -2px;
              right: -2px;
              bottom: -2px;
              background: linear-gradient(135deg, #ef4444 0%, #f87171 100%);
              border-radius: 22px;
              z-index: -1;
            }
            .credentials-title {
              color: #991b1b;
              margin: 0 0 25px;
              font-size: 24px;
              font-weight: 800;
              display: flex;
              align-items: center;
              justify-content: center;
              gap: 12px;
              text-shadow: 0 2px 4px rgba(153, 27, 27, 0.1);
            }
            .credential-item {
              background: white;
              margin: 20px 0;
              padding: 20px;
              border-radius: 15px;
              border: 2px solid #dc2626;
              box-shadow: 0 6px 20px rgba(220, 38, 38, 0.1);
            }
            .credential-label {
              font-size: 16px;
              color: #991b1b;
              font-weight: 700;
              margin-bottom: 8px;
            }
            .password { 
              font-family: 'Courier New', monospace; 
              font-size: 22px; 
              font-weight: bold; 
              color: #991b1b; 
              background: linear-gradient(135deg, #fff8f8 0%, #fef2f2 100%);
              padding: 18px 25px; 
              border: 3px solid #dc2626;
              border-radius: 12px; 
              margin: 12px 0; 
              display: inline-block; 
              letter-spacing: 4px;
              box-shadow: 0 6px 20px rgba(220, 38, 38, 0.2);
            }
            .cta-button { 
              display: inline-block; 
              background: linear-gradient(135deg, #5a3b92 0%, #dc2626 100%);
              color: white; 
              padding: 20px 40px; 
              text-decoration: none; 
              border-radius: 50px; 
              margin: 35px 0; 
              font-weight: 800;
              font-size: 18px;
              box-shadow: 0 12px 35px rgba(220, 38, 38, 0.4);
              text-shadow: 0 2px 4px rgba(0,0,0,0.2);
            }
            .security-info { 
              background: linear-gradient(135deg, #f0f8f0 0%, #e8f5e8 100%);
              border: 3px solid #9ACD32;
              padding: 30px; 
              border-radius: 20px; 
              margin: 30px 0; 
              box-shadow: 0 8px 25px rgba(154, 205, 50, 0.15);
            }
            .security-title {
              margin: 0 0 20px;
              color: #4a2d7c;
              font-size: 22px;
              font-weight: 800;
              display: flex;
              align-items: center;
              justify-content: center;
              gap: 12px;
            }
            .security-list {
              margin: 0;
              padding-left: 25px;
              color: #5a3b92;
            }
            .security-list li {
              margin: 12px 0;
              font-weight: 600;
              font-size: 16px;
            }
            .warning-box { 
              background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%);
              border: 3px solid #dc2626; 
              padding: 30px; 
              border-radius: 20px; 
              margin: 30px 0;
              box-shadow: 0 8px 25px rgba(220, 38, 38, 0.15);
            }
            .warning-title {
              margin: 0 0 20px;
              color: #991b1b;
              font-size: 22px;
              font-weight: 800;
              display: flex;
              align-items: center;
              justify-content: center;
              gap: 12px;
            }
            .warning-text {
              margin: 0;
              color: #991b1b;
              font-weight: 600;
              font-size: 16px;
              text-align: center;
              line-height: 1.8;
            }
            .closing-message {
              text-align: center;
              font-size: 20px;
              color: #5a3b92;
              margin: 40px 0;
              padding: 25px;
              background: linear-gradient(135deg, #f8f4ff 0%, #e8f5e8 100%);
              border-radius: 20px;
              border: 2px solid #9ACD32;
              font-weight: 600;
              line-height: 1.8;
            }
            .highlight-text {
              color: #dc2626;
              font-weight: 800;
            }
            .footer { 
              margin-top: 40px; 
              padding: 35px; 
              background: linear-gradient(135deg, #5a3b92 0%, #4a2d7c 100%);
              text-align: center; 
              color: white; 
              font-size: 16px;
            }
            .footer-company {
              font-size: 22px;
              font-weight: 800;
              color: #9ACD32;
              margin-bottom: 15px;
              text-shadow: 0 2px 4px rgba(0,0,0,0.2);
            }
            .footer-contact {
              margin: 8px 0;
              font-weight: 600;
              font-size: 16px;
            }
            .footer-disclaimer {
              margin-top: 25px;
              font-style: italic;
              color: #b8dc52;
              font-size: 15px;
              opacity: 0.9;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo-container">
                <img src="https://assets.macaly-user-data.dev/vu6uteof0g2skav7mwkttz9h/mk2of4l6b3c7h8aflcpq3h6w/briosZ3rPCqNLWMV5onaM/logo-ag-2025.png" alt="AG Assessoria Logo" class="logo-image">
              </div>
              <div class="header-title">🔐 Nova Senha Gerada</div>
              <div class="subtitle">Portal do Cliente - Segurança</div>
            </div>
            
            <div class="content">
              <div class="greeting">Olá, ${nome}! 🔒</div>
              
              <div class="message-section">
                <strong>Uma nova senha foi gerada para seu acesso ao Portal do Cliente da AG Assessoria.</strong>
                <br><br>
                Esta alteração foi realizada por nossa equipe de suporte para garantir a segurança da sua conta e manter seus dados sempre protegidos.
                <br><br>
                <em>Sua segurança é nossa prioridade máxima! 🛡️</em>
              </div>
              
              <div class="credentials-box">
                <h3 class="credentials-title">🔑 Sua Nova Senha Temporária</h3>
                <div class="credential-item">
                  <div class="credential-label">📧 Email de acesso</div>
                  <strong style="color: #991b1b; font-size: 18px;">${email}</strong>
                </div>
                <div class="credential-item">
                  <div class="credential-label">🔑 Nova senha</div>
                  <div class="password">${novaSenha}</div>
                </div>
                <p style="font-size: 16px; color: #991b1b; margin-top: 25px; background: #fff8f8; padding: 20px; border-radius: 12px; border: 2px solid #dc2626; font-weight: 600;">
                  <strong>⚠️ Por segurança:</strong> Você será solicitado a criar uma nova senha personalizada no próximo acesso.
                </p>
              </div>
              
              <div style="text-align: center;">
                <a href="https://agassessoria.vercel.app/portal-cliente" class="cta-button">
                  🚀 Acessar Portal do Cliente
                </a>
              </div>
              
              <div class="security-info">
                <h4 class="security-title">🛡️ Informações de Segurança</h4>
                <ul class="security-list">
                  <li>Esta senha foi gerada por um administrador do sistema</li>
                  <li>Recomendamos alterar para uma senha personalizada no primeiro acesso</li>
                  <li>Se você não solicitou esta alteração, entre em contato conosco imediatamente</li>
                  <li>Nunca compartilhe suas credenciais com terceiros</li>
                </ul>
              </div>
              
              <div class="warning-box">
                <h4 class="warning-title">⚠️ Atenção</h4>
                <p class="warning-text">
                  Se você não solicitou a alteração de senha, entre em contato conosco 
                  <strong>imediatamente</strong> pelo telefone <strong>(16) 3987-3829</strong>.
                </p>
              </div>
              
              <div class="closing-message">
                Nossa equipe está sempre à disposição para ajudá-lo(a) com qualquer dúvida sobre o sistema e manter sua conta sempre segura.
                <br><br>
                <strong class="highlight-text">Sua segurança é nossa prioridade! 🔒</strong>
              </div>
            </div>
            
            <div class="footer">
              <div class="footer-company">AG Assessoria em Gestão Empresarial Contábil LTDA</div>
              <div class="footer-contact">📞 (16) 3987-3829</div>
              <div class="footer-contact">📧 agassessoriacontrole@gmail.com</div>
              <div class="footer-disclaimer">
                Este é um email automático de segurança. Em caso de dúvidas, entre em contato conosco.
              </div>
            </div>
          </div>
        </body>
        </html>
        `

        const data = await resend.emails.send({
          from: 'AG Assessoria <noreply@resend.dev>',
          to: [email],
          replyTo: 'agassessoriacontrole@gmail.com',
          subject: '🔐 Nova senha para acesso ao Portal AG Assessoria',
          html: emailHtml,
        })

        console.log('✅ Email de reset de senha enviado com sucesso:', data)
        
        return NextResponse.json({
          success: true,
          message: 'Email de reset de senha enviado com sucesso',
          data
        })

      } catch (error) {
        console.error('❌ Erro ao enviar email via Resend:', error)
        
        // Fallback: Log detalhado em caso de erro
        console.log('📧 SIMULAÇÃO DE EMAIL DE RESET (Erro no Resend) 📧')
        console.log(`Para: ${email}`)
        console.log(`Assunto: 🔐 Nova Senha Gerada - Portal do Cliente AG Assessoria`)
        console.log(`Nome: ${nome}`)
        console.log(`Nova Senha: ${novaSenha}`)
        console.log('📧 FIM DA SIMULAÇÃO 📧')
        
        return NextResponse.json({
          success: false,
          message: 'Erro ao enviar email, mas senha foi alterada. Verifique as configurações do Resend.',
          error: error instanceof Error ? error.message : 'Erro desconhecido'
        })
      }
    } else {
      // Desenvolvimento: Simular envio de email
      console.log('📧 SIMULAÇÃO DE EMAIL DE RESET DE SENHA (Desenvolvimento) 📧')
      console.log(`Para: ${email}`)
      console.log(`Assunto: 🔐 Nova Senha Gerada - Portal do Cliente AG Assessoria`)
      console.log('')
      console.log(`Olá ${nome},`)
      console.log('')
      console.log(`Uma nova senha foi gerada para seu acesso ao Portal do Cliente da AG Assessoria.`)
      console.log('')
      console.log(`🔐 Email: ${email}`)
      console.log(`🔐 Nova senha: ${novaSenha}`)
      console.log('')
      console.log(`⚠️ IMPORTANTE: Por segurança, você será solicitado a criar uma nova senha personalizada no próximo acesso.`)
      console.log('')
      console.log(`🛡️ Se você não solicitou esta alteração, entre em contato conosco imediatamente pelo telefone (16) 3987-3829.`)
      console.log('')
      console.log(`🚀 Acesse: https://agassessoria.vercel.app/portal-cliente`)
      console.log('')
      console.log(`Atenciosamente,`)
      console.log(`Equipe AG Assessoria Contábil`)
      console.log(`📞 (16) 3987-3829`)
      console.log('📧 FIM DA SIMULAÇÃO 📧')
      
      return NextResponse.json({
        success: true,
        message: 'Email de reset de senha simulado com sucesso (modo desenvolvimento)',
        simulated: true
      })
    }

  } catch (error) {
    console.error('❌ Erro geral no envio de email de reset:', error)
    
    return NextResponse.json({
      success: false,
      message: 'Erro interno ao processar envio de email',
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 })
  }
}