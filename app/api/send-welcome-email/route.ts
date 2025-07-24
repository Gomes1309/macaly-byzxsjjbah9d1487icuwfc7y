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
    
    // NEW: More robust production detection (consistent with debug-env)
    const isOnVercel = process.env.VERCEL === '1'
    const isVercelProduction = process.env.VERCEL_ENV === 'production'
    const isNodeProduction = process.env.NODE_ENV === 'production'
    
    // Consider production if any of these conditions are met:
    const isProductionEnvironment = (
      isNodeProduction || 
      isVercelProduction ||
      (isOnVercel && process.env.VERCEL_ENV !== 'development')
    )
    
    const isProduction = isProductionEnvironment && resendApiKey

    console.log('📧 Email environment check:', {
      isOnVercel,
      isVercelProduction,
      isNodeProduction,
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
            body { font-family: Arial, sans-serif; line-height: 1.6; margin: 0; padding: 0; background-color: #f4f4f4; }
            .container { max-width: 600px; margin: 0 auto; background: white; padding: 20px; border-radius: 10px; box-shadow: 0 0 10px rgba(0,0,0,0.1); }
            .header { text-align: center; margin-bottom: 30px; padding: 20px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 10px; color: white; }
            .logo { font-size: 24px; font-weight: bold; margin-bottom: 10px; }
            .subtitle { font-size: 14px; opacity: 0.9; }
            .content { padding: 20px 0; }
            .credentials-box { background: #f8f9ff; border: 2px solid #667eea; border-radius: 8px; padding: 20px; margin: 20px 0; text-align: center; }
            .password { font-family: 'Courier New', monospace; font-size: 18px; font-weight: bold; color: #333; background: white; padding: 10px; border: 1px solid #ddd; border-radius: 4px; margin: 10px 0; display: inline-block; letter-spacing: 2px; }
            .companies-list { background: #f0f8ff; padding: 15px; margin: 15px 0; border-radius: 8px; border-left: 4px solid #667eea; }
            .company-item { padding: 5px 0; color: #333; }
            .button { display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; margin: 20px 0; font-weight: bold; }
            .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; text-align: center; color: #666; font-size: 12px; }
            .warning { background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 15px 0; color: #856404; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">🏢 AG ASSESSORIA CONTÁBIL</div>
              <div class="subtitle">Portal do Cliente - Credenciais de Acesso</div>
            </div>
            
            <div class="content">
              <h2 style="color: #333;">Bem-vindo(a), ${nome}!</h2>
              
              <p>É um prazer tê-lo(a) como cliente da AG Assessoria. Criamos seu acesso ao nosso Portal do Cliente, onde você poderá acompanhar documentos, serviços e informações importantes de forma segura e conveniente.</p>
              
              <div class="credentials-box">
                <h3 style="color: #667eea; margin-top: 0;">🔐 Suas Credenciais de Acesso</h3>
                <p><strong>Email de acesso:</strong><br>${email}</p>
                <p><strong>Senha inicial:</strong></p>
                <div class="password">${senha}</div>
                <p style="font-size: 12px; color: #666; margin-top: 15px;">
                  ⚠️ <strong>Por segurança:</strong> Você será solicitado a criar uma nova senha personalizada no primeiro acesso.
                </p>
              </div>
              
              <div class="companies-list">
                <h4 style="color: #333; margin: 0 0 10px 0;">🏢 Empresas que você pode acessar:</h4>
                ${empresas.map(empresa => `<div class="company-item">• ${empresa}</div>`).join('')}
              </div>
              
              <div style="text-align: center;">
                <a href="https://mk2of4l6b3c7h8aflcpq3h6w.macaly.dev/portal-cliente" class="button">
                  🚀 Acessar Portal do Cliente
                </a>
              </div>
              
              <div class="warning">
                <h4 style="margin: 0 0 10px 0;">📋 Instruções Importantes:</h4>
                <ul style="margin: 0; padding-left: 20px;">
                  <li>Guarde suas credenciais em local seguro</li>
                  <li>Não compartilhe sua senha com terceiros</li>
                  <li>Troque sua senha no primeiro acesso</li>
                  <li>Entre em contato conosco em caso de dúvidas</li>
                </ul>
              </div>
              
              <p>Estamos à disposição para ajudá-lo(a) em qualquer questão. Nossa equipe está sempre pronta para oferecer o melhor atendimento.</p>
              
              <p>Seja bem-vindo(a) ao futuro da gestão contábil!</p>
            </div>
            
            <div class="footer">
              <strong>AG Assessoria Contábil</strong><br>
              📞 (16) 3987-3829<br>
              📧 agassessoriacontrole@gmail.com<br>
              <br>
              <em>Este é um email automático. Em caso de dúvidas, entre em contato conosco.</em>
            </div>
          </div>
        </body>
        </html>
        `

        const data = await resend.emails.send({
          from: 'AG Assessoria <agassessoriacontrole@gmail.com>',
          to: [email],
          subject: `🎉 Bem-vindo ao Portal do Cliente - Suas Credenciais de Acesso`,
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