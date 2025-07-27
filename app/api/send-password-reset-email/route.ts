import { NextRequest, NextResponse } from 'next/server'

// Interface para os dados do email de reset de senha
interface PasswordResetEmailData {
  name: string
  email: string
  newPassword: string
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log('Dados recebidos para reset de senha:', body)
    
    const { email, name, newPassword } = body
    
    // Validar dados obrigatórios
    if (!email || !name || !newPassword) {
      console.error('Dados incompletos:', { email, name, newPassword })
      return NextResponse.json(
        { 
          error: 'Dados incompletos',
          message: 'Email, name e nova senha são obrigatórios'
        }, 
        { status: 400 }
      )
    }

    console.log(`Enviando email de reset de senha para: ${email} (${name})`)

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
              font-family: Arial, sans-serif; 
              line-height: 1.6; 
              margin: 0; 
              padding: 20px;
              background: #f5f5f5;
            }
            
            .container { 
              max-width: 600px; 
              margin: 0 auto; 
              background: white; 
              border-radius: 10px; 
              overflow: hidden;
              border: 2px solid #9ACD32;
            }
            
            .header { 
              text-align: center; 
              padding: 30px 20px; 
              background: #5a3b92;
              color: white;
            }
            
            .logo-image {
              max-width: 150px;
              height: auto;
              margin-bottom: 15px;
            }
            
            .header-title { 
              font-size: 24px; 
              margin: 15px 0;
              color: #9ACD32;
            }
            
            .subtitle { 
              font-size: 16px;
            }
            
            .content { 
              padding: 30px; 
            }
            
            .greeting {
              font-size: 22px;
              color: #5a3b92;
              margin-bottom: 20px;
              text-align: center;
            }
            
            .message-section {
              font-size: 16px;
              color: #333;
              margin-bottom: 25px;
              text-align: center;
              background: #f8f9fa;
              padding: 20px;
              border-radius: 8px;
              border: 1px solid #9ACD32;
            }
            
            .credentials-box { 
              background: #f8f9fa;
              border: 2px solid #5a3b92; 
              border-radius: 8px; 
              padding: 25px; 
              margin: 25px 0; 
              text-align: center;
            }
            
            .credentials-title {
              color: #5a3b92;
              margin-bottom: 20px;
              font-size: 18px;
            }
            
            .credential-item {
              background: white;
              margin: 15px 0;
              padding: 15px;
              border-radius: 5px;
              border: 1px solid #ddd;
            }
            
            .credential-label {
              font-size: 14px;
              color: #666;
              margin-bottom: 5px;
            }
            
            .password { 
              font-family: monospace; 
              font-size: 20px; 
              font-weight: bold; 
              color: #333; 
              background: #fff8dc;
              padding: 10px; 
              border: 2px solid #9ACD32;
              border-radius: 5px; 
              display: inline-block;
              letter-spacing: 2px;
            }
            
            .cta-button { 
              display: inline-block; 
              background: #5a3b92;
              color: white; 
              padding: 15px 30px; 
              text-decoration: none; 
              border-radius: 5px; 
              margin: 20px 0; 
              font-weight: bold;
            }
            
            .security-info {
              background: #fff8dc;
              padding: 20px;
              border-radius: 8px;
              margin: 20px 0;
              border: 1px solid #ddd;
            }
            
            .security-info h4 {
              margin-top: 0;
              color: #333;
            }
            
            .security-info ul {
              margin: 10px 0;
              padding-left: 20px;
            }
            
            .security-info li {
              margin: 5px 0;
            }
            
            .footer { 
              padding: 20px; 
              background: #5a3b92;
              text-align: center; 
              color: white; 
              font-size: 14px;
            }
            
            .footer-company {
              font-size: 16px;
              color: #9ACD32;
              margin-bottom: 10px;
            }
            
            @media only screen and (max-width: 600px) {
              .container { margin: 10px; }
              .header, .content { padding: 20px 15px; }
              .password { font-size: 18px; }
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <img src="https://assets.macaly-user-data.dev/vu6uteof0g2skav7mwkttz9h/mk2of4l6b3c7h8aflcpq3h6w/o-h2__8-krHhyceVQM4UJ/image.png" alt="AG Assessoria Logo" class="logo-image">
              <div class="header-title">🔐 Nova Senha Gerada</div>
              <div class="subtitle">AG Assessoria em Gestão Empresarial Contábil</div>
            </div>
            
            <div class="content">
              <div class="greeting">Olá, ${name}!</div>
              
              <div class="message-section">
                <strong>Uma nova senha foi gerada para seu acesso ao Portal do Cliente da AG Assessoria.</strong><br><br>
                Esta alteração foi realizada por nossa equipe de suporte para garantir a segurança da sua conta.
              </div>
              
              <div class="credentials-box">
                <h3 class="credentials-title">🔑 Sua Nova Senha Temporária</h3>
                <div class="credential-item">
                  <div class="credential-label">📧 Email de acesso</div>
                  <strong>${email}</strong>
                </div>
                <div class="credential-item">
                  <div class="credential-label">🔑 Nova senha</div>
                  <div class="password">${newPassword}</div>
                </div>
                <p style="margin-top: 15px; color: #666; font-size: 14px;">
                  <strong>⚠️ Por segurança:</strong> Você será solicitado a criar uma nova senha no primeiro acesso.
                </p>
              </div>
              
              <div style="text-align: center;">
                <a href="https://agassessoria.vercel.app/portal-cliente" class="cta-button">
                  🚀 Acessar Portal do Cliente
                </a>
              </div>
              
              <div class="security-info">
                <h4>🛡️ Informações de Segurança</h4>
                <ul>
                  <li>Esta senha foi gerada por um administrador do sistema</li>
                  <li>Recomendamos alterar para uma senha personalizada no primeiro acesso</li>
                  <li>Se você não solicitou esta alteração, entre em contato conosco</li>
                  <li>Nunca compartilhe suas credenciais com terceiros</li>
                </ul>
              </div>
              
              <div style="text-align: center; margin: 30px 0; color: #666;">
                Nossa equipe está sempre à disposição para ajudá-lo(a).
                <br><strong style="color: #9ACD32;">Sua segurança é nossa prioridade!</strong>
              </div>
            </div>
            
            <div class="footer">
              <div class="footer-company">AG Assessoria em Gestão Empresarial Contábil LTDA</div>
              <div>📞 (16) 3987-3829</div>
              <div>📧 agassessoriacontrole@gmail.com</div>
              <div style="margin-top: 15px; font-size: 12px; opacity: 0.8;">
                Este é um email automático. Em caso de dúvidas, entre em contato conosco.
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
        console.log(`Nome: ${name}`)
        console.log(`Nova Senha: ${newPassword}`)
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
      console.log(`Olá ${name},`)
      console.log('')
      console.log(`Uma nova senha foi gerada para seu acesso ao Portal do Cliente da AG Assessoria.`)
      console.log('')
      console.log(`🔐 Email: ${email}`)
      console.log(`🔐 Nova senha: ${newPassword}`)
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