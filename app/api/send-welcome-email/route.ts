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
          <title>Bem-vindo ao Sistema AG Assessoria - Acesso Criado</title>
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
            
            .welcome-title { 
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
            
            .welcome-message {
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
            
            .companies-section { 
              background: #f0f8f0;
              padding: 20px; 
              margin: 20px 0; 
              border-radius: 8px; 
              border: 1px solid #9ACD32;
            }
            
            .companies-title {
              color: #333;
              margin-bottom: 15px;
              font-size: 16px;
              text-align: center;
            }
            
            .company-item { 
              padding: 5px 0; 
              color: #333;
              text-align: center;
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
            
            .instructions {
              background: #fff8dc;
              padding: 20px;
              border-radius: 8px;
              margin: 20px 0;
              border: 1px solid #ddd;
            }
            
            .instructions h4 {
              margin-top: 0;
              color: #333;
            }
            
            .instructions ul {
              margin: 10px 0;
              padding-left: 20px;
            }
            
            .instructions li {
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
              <div class="welcome-title">Bem-vindo ao Sistema AG Assessoria</div>
              <div class="subtitle">Sistema de Gestão Empresarial Contábil</div>
            </div>
            
            <div class="content">
              <div class="greeting">Olá, ${nome}!</div>
              
              <div class="welcome-message">
                <strong>Bem-vindo(a) à equipe AG Assessoria!</strong><br><br>
                Sua conta de usuário no sistema foi criada com sucesso. Por meio dela, você poderá gerenciar 
                clientes, documentos, obrigações e todas as informações empresariais de forma prática e segura.
              </div>
              
              <div class="credentials-box">
                <h3 class="credentials-title">🔐 Suas Credenciais de Acesso</h3>
                <div class="credential-item">
                  <div class="credential-label">📧 Email de acesso</div>
                  <strong>${email}</strong>
                </div>
                <div class="credential-item">
                  <div class="credential-label">🔑 Senha inicial</div>
                  <div class="password">${senha}</div>
                </div>
                <p style="margin-top: 15px; color: #666; font-size: 14px;">
                  <strong>⚠️ Por segurança:</strong> Você será solicitado a criar uma nova senha no primeiro acesso.
                </p>
              </div>
              
              <div class="companies-section">
                <h4 class="companies-title">🏢 Empresas que você pode gerenciar</h4>
                ${empresas.map(empresa => `<div class="company-item">• ${empresa}</div>`).join('')}
              </div>
              
              <div style="text-align: center;">
                <a href="https://agassessoria.vercel.app/login" class="cta-button">
                  🚀 Acessar Sistema AG Assessoria
                </a>
              </div>
              
              <div class="instructions">
                <h4>📋 Instruções Importantes</h4>
                <ul>
                  <li>Guarde suas credenciais em local seguro</li>
                  <li>Não compartilhe sua senha com terceiros</li>
                  <li>Altere sua senha no primeiro acesso</li>
                  <li>Entre em contato conosco para qualquer dúvida</li>
                </ul>
              </div>
              
              <div style="text-align: center; margin: 30px 0; color: #666;">
                Nossa equipe está sempre à disposição para suporte técnico e treinamento.
                <br><strong style="color: #9ACD32;">Bem-vindo(a) à equipe AG Assessoria!</strong>
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
          from: 'AG Assessoria <noreply@resend.dev>', // Usar domínio padrão do Resend que sempre funciona
          to: [email],
          replyTo: 'agassessoriacontrole@gmail.com', // Email real para respostas
          subject: '🎉 Bem-vindo ao Sistema AG Assessoria - Suas credenciais de usuário',
          html: emailHtml,
        })

        console.log('📧 Resposta do Resend:', data)
        
        // Verificar se há erro na resposta do Resend
        if (data?.error) {
          console.error('❌ Erro retornado pelo Resend:', data.error)
          
          // Verificar se é limitação de teste
          const errorObj = data.error as any
          const isTestingLimitation = errorObj?.statusCode === 403 || 
                                      errorObj?.error?.includes('You can only send testing emails') ||
                                      errorObj?.error?.includes('verify a domain')
          
          if (isTestingLimitation) {
            console.log('⚠️ LIMITAÇÃO DO RESEND DETECTADA - Modo de Teste Ativo')
            return NextResponse.json({
              success: false,
              message: 'Email não enviado: Conta Resend em modo teste. Apenas emails para gomes1309@gmail.com são permitidos.',
              testingMode: true,
              simulatedEmail: {
                para: email,
                nome: nome,
                senha: senha,
                empresas: empresas
              },
              error: 'Limitação da conta Resend - modo teste ativo'
            })
          }
          
          return NextResponse.json({
            success: false,
            message: 'Erro ao enviar email via Resend',
            error: data.error
          })
        }
        
        console.log('✅ Email de boas-vindas enviado com sucesso:', data)
        
        return NextResponse.json({
          success: true,
          message: 'Email de boas-vindas enviado com sucesso',
          data
        })

      } catch (error) {
        console.error('❌ Erro ao enviar email via Resend:', error)
        
        // Verificar se é erro de limitação do Resend (modo teste)
        const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
        const isTestingLimitation = errorMessage.includes('You can only send testing emails') || 
                                    errorMessage.includes('verify a domain') ||
                                    (error as any)?.statusCode === 403
        
        if (isTestingLimitation) {
          console.log('⚠️ LIMITAÇÃO DO RESEND DETECTADA - Modo de Teste Ativo')
          console.log('📧 SIMULAÇÃO DE EMAIL DE BOAS-VINDAS (Limitação Resend) 📧')
          console.log(`Para: ${email}`)
          console.log(`Assunto: 🎉 Bem-vindo ao Portal do Cliente - Suas Credenciais de Acesso`)
          console.log(`Nome: ${nome}`)
          console.log(`Senha: ${senha}`)
          console.log(`Empresas: ${empresas.join(', ')}`)
          console.log('📧 FIM DA SIMULAÇÃO 📧')
          
          return NextResponse.json({
            success: false,
            message: 'Email não enviado: Conta Resend em modo teste. Apenas emails para gomes1309@gmail.com são permitidos.',
            testingMode: true,
            simulatedEmail: {
              para: email,
              nome: nome,
              senha: senha,
              empresas: empresas
            },
            error: 'Limitação da conta Resend - modo teste ativo'
          })
        }
        
        // Outros erros
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
          error: errorMessage
        })
      }
    } else {
      // Desenvolvimento: Simular envio de email
      console.log('📧 SIMULAÇÃO DE EMAIL DE BOAS-VINDAS (Desenvolvimento) 📧')
      console.log(`Para: ${email}`)
      console.log(`Assunto: 🎉 Bem-vindo ao Sistema AG Assessoria - Suas credenciais de usuário`)
      console.log('')
      console.log(`Prezado(a) ${nome},`)
      console.log('')
      console.log(`Bem-vindo(a) à equipe AG Assessoria!`)
      console.log('')
      console.log(`Criamos seu acesso ao Sistema AG Assessoria:`)
      console.log(`🔐 Email: ${email}`)
      console.log(`🔐 Senha inicial: ${senha}`)
      console.log('')
      console.log(`🏢 Empresas que você pode gerenciar:`)
      empresas.forEach(empresa => {
        console.log(`   • ${empresa}`)
      })
      console.log('')
      console.log(`⚠️ IMPORTANTE: Você será solicitado a criar uma nova senha personalizada no primeiro acesso.`)
      console.log('')
      console.log(`🚀 Acesse: https://agassessoria.vercel.app/login`)
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