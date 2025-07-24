import { NextRequest, NextResponse } from 'next/server'

// Interface para os dados do email de boas-vindas
interface WelcomeEmailData {
  nome: string
  email: string
  senha: string
  empresas: string[]
}

export async function POST(request: NextRequest) {
  try {
    const { nome, email, senha, empresas }: WelcomeEmailData = await request.json()

    console.log('📧 Enviando email de boas-vindas para:', email)

    // Verificar se estamos em produção e temos a API key do Resend
    const resendApiKey = process.env.RESEND_API_KEY
    
    // Standard checks
    const isOnVercel = process.env.VERCEL === '1'
    const isVercelProduction = process.env.VERCEL_ENV === 'production'
    const isNodeProduction = process.env.NODE_ENV === 'production'
    
    // Domain and deployment checks
    const hasVercelDomain = process.env.VERCEL_URL?.includes('.vercel.app') || process.env.VERCEL_URL?.includes('macaly.dev')
    const isVercelDeployment = !!process.env.VERCEL_URL || isOnVercel
    const hasProductionDomain = process.env.VERCEL_URL?.includes('macaly.dev')
    const notLocalhost = !process.env.VERCEL_URL?.includes('localhost') && 
                         !process.env.VERCEL_URL?.includes('127.0.0.1') &&
                         !process.env.VERCEL_URL?.includes('.local')
    const hasCloudflareHeaders = process.env.CF_RAY || process.env.CF_VISITOR
    const isDeployedEnvironment = isVercelDeployment || hasProductionDomain || hasCloudflareHeaders
    
    // 🚨 FORCE PRODUCTION MODE: If we have RESEND_API_KEY, assume production
    const forceProductionMode = !!resendApiKey
    
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

    console.log('📧 Email environment check (FORCE PRODUCTION):', {
      isOnVercel,
      isVercelProduction,
      isNodeProduction,
      isVercelDeployment,
      hasVercelDomain,
      hasProductionDomain,
      notLocalhost,
      hasCloudflareHeaders,
      isDeployedEnvironment,
      forceProductionMode,
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
          <title>Bem-vindo ao Portal do Cliente - AG Assessoria</title>
          <style>
            body { 
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
              line-height: 1.6; 
              margin: 0; 
              padding: 0; 
              background: linear-gradient(135deg, #f8f4ff 0%, #e8f5e8 100%);
            }
            .container { 
              max-width: 650px; 
              margin: 20px auto; 
              background: white; 
              border-radius: 20px; 
              box-shadow: 0 25px 50px rgba(90, 59, 146, 0.15);
              overflow: hidden;
              border: 3px solid #9ACD32;
            }
            .header { 
              text-align: center; 
              padding: 40px 30px 30px; 
              background: linear-gradient(135deg, #5a3b92 0%, #4a2d7c 50%, #7a5bb2 100%);
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
              background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="grain" width="100" height="100" patternUnits="userSpaceOnUse"><circle cx="25" cy="25" r="1" fill="%239ACD32" opacity="0.1"/><circle cx="75" cy="75" r="1" fill="%239ACD32" opacity="0.15"/><circle cx="50" cy="10" r="0.5" fill="%23b8dc52" opacity="0.1"/></pattern></defs><rect width="100" height="100" fill="url(%23grain)"/></svg>');
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
              background: rgba(154, 205, 50, 0.1);
            }
            .welcome-title { 
              font-size: 32px; 
              font-weight: 800; 
              margin: 25px 0 15px; 
              text-shadow: 0 3px 6px rgba(0,0,0,0.3);
              position: relative;
              z-index: 2;
              color: #9ACD32;
            }
            .subtitle { 
              font-size: 18px; 
              opacity: 0.95; 
              font-weight: 500;
              position: relative;
              z-index: 2;
              background: rgba(154, 205, 50, 0.2);
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
            .welcome-message {
              font-size: 18px;
              color: #4a2d7c;
              line-height: 1.9;
              margin-bottom: 35px;
              text-align: center;
              background: linear-gradient(135deg, #f8f4ff 0%, #e8f5e8 100%);
              padding: 30px;
              border-radius: 20px;
              border: 2px solid #9ACD32;
              box-shadow: 0 8px 25px rgba(154, 205, 50, 0.1);
              position: relative;
            }
            .welcome-message::before {
              content: '🎉';
              position: absolute;
              top: -15px;
              left: 50%;
              transform: translateX(-50%);
              background: white;
              padding: 10px;
              font-size: 24px;
              border-radius: 50%;
              border: 3px solid #9ACD32;
            }
            .credentials-box { 
              background: linear-gradient(135deg, #faf9ff 0%, #f0f8f0 100%);
              border: 3px solid #5a3b92; 
              border-radius: 20px; 
              padding: 35px; 
              margin: 35px 0; 
              text-align: center;
              box-shadow: 0 12px 35px rgba(90, 59, 146, 0.15);
              position: relative;
            }
            .credentials-box::before {
              content: '';
              position: absolute;
              top: -2px;
              left: -2px;
              right: -2px;
              bottom: -2px;
              background: linear-gradient(135deg, #9ACD32 0%, #b8dc52 100%);
              border-radius: 22px;
              z-index: -1;
            }
            .credentials-title {
              color: #5a3b92;
              margin: 0 0 25px;
              font-size: 24px;
              font-weight: 800;
              display: flex;
              align-items: center;
              justify-content: center;
              gap: 12px;
              text-shadow: 0 2px 4px rgba(90, 59, 146, 0.1);
            }
            .credential-item {
              background: white;
              margin: 20px 0;
              padding: 20px;
              border-radius: 15px;
              border: 2px solid #9ACD32;
              box-shadow: 0 6px 20px rgba(154, 205, 50, 0.1);
            }
            .credential-label {
              font-size: 16px;
              color: #5a3b92;
              font-weight: 700;
              margin-bottom: 8px;
            }
            .password { 
              font-family: 'Courier New', monospace; 
              font-size: 22px; 
              font-weight: bold; 
              color: #4a2d7c; 
              background: linear-gradient(135deg, #fff8dc 0%, #f0f8f0 100%);
              padding: 18px 25px; 
              border: 3px solid #9ACD32;
              border-radius: 12px; 
              margin: 12px 0; 
              display: inline-block; 
              letter-spacing: 4px;
              box-shadow: 0 6px 20px rgba(154, 205, 50, 0.2);
            }
            .companies-section { 
              background: linear-gradient(135deg, #f0f8f0 0%, #e8f5e8 100%);
              padding: 30px; 
              margin: 30px 0; 
              border-radius: 20px; 
              border: 3px solid #9ACD32;
              box-shadow: 0 8px 25px rgba(154, 205, 50, 0.15);
            }
            .companies-title {
              color: #4a2d7c;
              margin: 0 0 20px;
              font-size: 22px;
              font-weight: 800;
              display: flex;
              align-items: center;
              justify-content: center;
              gap: 12px;
              text-shadow: 0 2px 4px rgba(74, 45, 124, 0.1);
            }
            .company-item { 
              padding: 12px 0; 
              color: #5a3b92;
              font-weight: 600;
              font-size: 17px;
              display: flex;
              align-items: center;
              gap: 10px;
            }
            .company-item::before {
              content: '🏢';
              background: #9ACD32;
              padding: 5px;
              border-radius: 50%;
              font-size: 14px;
            }
            .cta-button { 
              display: inline-block; 
              background: linear-gradient(135deg, #5a3b92 0%, #9ACD32 100%);
              color: white; 
              padding: 20px 40px; 
              text-decoration: none; 
              border-radius: 50px; 
              margin: 35px 0; 
              font-weight: 800;
              font-size: 18px;
              box-shadow: 0 12px 35px rgba(90, 59, 146, 0.4);
              transition: all 0.3s ease;
              text-shadow: 0 2px 4px rgba(0,0,0,0.2);
            }
            .instructions-box {
              background: linear-gradient(135deg, #fff8dc 0%, #faf9ff 100%);
              border: 3px solid #7a5bb2;
              padding: 30px;
              border-radius: 20px;
              margin: 30px 0;
              box-shadow: 0 8px 25px rgba(122, 91, 178, 0.15);
            }
            .instructions-title {
              margin: 0 0 20px;
              color: #4a2d7c;
              font-size: 22px;
              font-weight: 800;
              display: flex;
              align-items: center;
              justify-content: center;
              gap: 12px;
            }
            .instructions-list {
              margin: 0;
              padding-left: 25px;
              color: #5a3b92;
            }
            .instructions-list li {
              margin: 12px 0;
              font-weight: 600;
              font-size: 16px;
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
              color: #9ACD32;
              font-weight: 800;
              text-shadow: 0 2px 4px rgba(154, 205, 50, 0.2);
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
              <div class="welcome-title">Bem-vindo ao Portal do Cliente</div>
              <div class="subtitle">AG Assessoria em Gestão Empresarial Contábil</div>
            </div>
            
            <div class="content">
              <div class="greeting">Olá, ${nome}! 👋</div>
              
              <div class="welcome-message">
                <strong>É um prazer tê-lo(a) como cliente da AG Assessoria em Gestão Empresarial Contábil LTDA!</strong> 
                <br><br>
                Informamos que seu acesso ao nosso Portal do Cliente foi criado com sucesso. Por meio dele, você poderá acompanhar 
                documentos, serviços e todas as informações importantes de forma prática, segura e totalmente online.
                <br><br>
                <em class="highlight-text">Seja bem-vindo(a) à excelência em gestão contábil! 🚀</em>
              </div>
              
              <div class="credentials-box">
                <h3 class="credentials-title">🔐 Suas Credenciais de Acesso</h3>
                <div class="credential-item">
                  <div class="credential-label">📧 Email de acesso</div>
                  <strong style="color: #4a2d7c; font-size: 18px;">${email}</strong>
                </div>
                <div class="credential-item">
                  <div class="credential-label">🔑 Senha inicial</div>
                  <div class="password">${senha}</div>
                </div>
                <p style="font-size: 16px; color: #5a3b92; margin-top: 25px; background: #fff8dc; padding: 20px; border-radius: 12px; border: 2px solid #9ACD32; font-weight: 600;">
                  <strong>⚠️ Por segurança:</strong> Você será solicitado a criar uma nova senha personalizada no primeiro acesso.
                </p>
              </div>
              
              <div class="companies-section">
                <h4 class="companies-title">🏢 Empresas que você pode acessar</h4>
                ${empresas.map(empresa => `<div class="company-item">${empresa}</div>`).join('')}
              </div>
              
              <div style="text-align: center;">
                <a href="https://mk2of4l6b3c7h8aflcpq3h6w.macaly.dev/portal-cliente" class="cta-button">
                  🚀 Acessar Portal do Cliente
                </a>
              </div>
              
              <div class="instructions-box">
                <h4 class="instructions-title">📋 Instruções Importantes</h4>
                <ul class="instructions-list">
                  <li>Guarde suas credenciais em local seguro</li>
                  <li>Não compartilhe sua senha com terceiros</li>
                  <li>Altere sua senha no primeiro acesso</li>
                  <li>Entre em contato conosco para qualquer dúvida</li>
                </ul>
              </div>
              
              <div class="closing-message">
                Nossa equipe está sempre à disposição para oferecer o melhor atendimento e suporte em gestão empresarial. 
                <br><br>
                <strong class="highlight-text">Bem-vindo(a) ao futuro da contabilidade digital! 🌟</strong>
              </div>
            </div>
            
            <div class="footer">
              <div class="footer-company">AG Assessoria em Gestão Empresarial Contábil LTDA</div>
              <div class="footer-contact">📞 (16) 3987-3829</div>
              <div class="footer-contact">📧 agassessoriacontrole@gmail.com</div>
              <div class="footer-disclaimer">
                Este é um email automático. Em caso de dúvidas, entre em contato conosco.
              </div>
            </div>
          </div>
        </body>
        </html>
        `

        const data = await resend.emails.send({
          from: 'AG Assessoria <noreply@resend.dev>', // Usar domínio padrão do Resend que sempre funciona
          to: [email],
          replyTo: 'agassessoriacontrole@gmail.com', // Email real para respostas
          subject: '🎉 Bem-vindo ao Portal AG Assessoria - Suas credenciais de acesso',
          html: emailHtml,
        })

        console.log('✅ Email de boas-vindas enviado com sucesso:', data)
        
        return NextResponse.json({
          success: true,
          message: 'Email de boas-vindas enviado com sucesso',
          data
        })

      } catch (error) {
        console.error('❌ Erro ao enviar email via Resend:', error)
        
        // Fallback: Log detalhado em caso de erro
        console.log('📧 SIMULAÇÃO DE EMAIL DE BOAS-VINDAS (Erro no Resend) 📧')
        console.log(`Para: ${email}`)
        console.log(`Assunto: 🎉 Bem-vindo ao Portal do Cliente - Suas Credenciais de Acesso`)
        console.log(`Nome: ${nome}`)
        console.log(`Senha: ${senha}`)
        console.log(`Empresas: ${empresas.join(', ')}`)
        console.log('📧 FIM DA SIMULAÇÃO 📧')
        
        return NextResponse.json({
          success: false,
          message: 'Erro ao enviar email, mas usuário foi criado. Verifique as configurações do Resend.',
          error: error instanceof Error ? error.message : 'Erro desconhecido'
        })
      }
    } else {
      // Desenvolvimento: Simular envio de email
      console.log('📧 SIMULAÇÃO DE EMAIL DE BOAS-VINDAS (Desenvolvimento) 📧')
      console.log(`Para: ${email}`)
      console.log(`Assunto: 🎉 Bem-vindo ao Portal do Cliente - Suas Credenciais de Acesso`)
      console.log('')
      console.log(`Prezado(a) ${nome},`)
      console.log('')
      console.log(`É um prazer tê-lo(a) como cliente da AG Assessoria!`)
      console.log('')
      console.log(`Criamos seu acesso ao nosso Portal do Cliente:`)
      console.log(`🔐 Email: ${email}`)
      console.log(`🔐 Senha inicial: ${senha}`)
      console.log('')
      console.log(`🏢 Empresas que você pode acessar:`)
      empresas.forEach(empresa => {
        console.log(`   • ${empresa}`)
      })
      console.log('')
      console.log(`⚠️ IMPORTANTE: Você será solicitado a criar uma nova senha personalizada no primeiro acesso.`)
      console.log('')
      console.log(`🚀 Acesse: https://mk2of4l6b3c7h8aflcpq3h6w.macaly.dev/portal-cliente`)
      console.log('')
      console.log(`Atenciosamente,`)
      console.log(`Equipe AG Assessoria Contábil`)
      console.log(`📞 (16) 3987-3829`)
      console.log('📧 FIM DA SIMULAÇÃO 📧')
      
      return NextResponse.json({
        success: true,
        message: 'Email de boas-vindas simulado com sucesso (modo desenvolvimento)',
        simulated: true
      })
    }

  } catch (error) {
    console.error('❌ Erro geral no envio de email de boas-vindas:', error)
    
    return NextResponse.json({
      success: false,
      message: 'Erro interno ao processar envio de email',
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 })
  }
}