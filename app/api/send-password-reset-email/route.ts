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
    const isProduction = process.env.NODE_ENV === 'production' && resendApiKey

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
            body { font-family: Arial, sans-serif; line-height: 1.6; margin: 0; padding: 0; background-color: #f4f4f4; }
            .container { max-width: 600px; margin: 0 auto; background: white; padding: 20px; border-radius: 10px; box-shadow: 0 0 10px rgba(0,0,0,0.1); }
            .header { text-align: center; margin-bottom: 30px; padding: 20px; background: linear-gradient(135deg, #f39c12 0%, #e67e22 100%); border-radius: 10px; color: white; }
            .logo { font-size: 24px; font-weight: bold; margin-bottom: 10px; }
            .subtitle { font-size: 14px; opacity: 0.9; }
            .content { padding: 20px 0; }
            .credentials-box { background: #fff3cd; border: 2px solid #f39c12; border-radius: 8px; padding: 20px; margin: 20px 0; text-align: center; }
            .password { font-family: 'Courier New', monospace; font-size: 18px; font-weight: bold; color: #333; background: white; padding: 10px; border: 1px solid #ddd; border-radius: 4px; margin: 10px 0; display: inline-block; letter-spacing: 2px; }
            .button { display: inline-block; background: linear-gradient(135deg, #f39c12 0%, #e67e22 100%); color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; margin: 20px 0; font-weight: bold; }
            .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; text-align: center; color: #666; font-size: 12px; }
            .warning { background: #f8d7da; border: 1px solid #f5c6cb; padding: 15px; border-radius: 5px; margin: 15px 0; color: #721c24; }
            .security-info { background: #d1ecf1; border: 1px solid #bee5eb; padding: 15px; border-radius: 5px; margin: 15px 0; color: #0c5460; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">🔐 AG ASSESSORIA CONTÁBIL</div>
              <div class="subtitle">Portal do Cliente - Nova Senha Gerada</div>
            </div>
            
            <div class="content">
              <h2 style="color: #333;">Olá, ${nome}!</h2>
              
              <p>Uma nova senha foi gerada para seu acesso ao Portal do Cliente da AG Assessoria.</p>
              
              <div class="credentials-box">
                <h3 style="color: #f39c12; margin-top: 0;">🔑 Sua Nova Senha Temporária</h3>
                <p><strong>Email de acesso:</strong><br>${email}</p>
                <p><strong>Nova senha:</strong></p>
                <div class="password">${novaSenha}</div>
                <p style="font-size: 12px; color: #666; margin-top: 15px;">
                  ⚠️ <strong>Por segurança:</strong> Você será solicitado a criar uma nova senha personalizada no próximo acesso.
                </p>
              </div>
              
              <div style="text-align: center;">
                <a href="https://mk2of4l6b3c7h8aflcpq3h6w.macaly.dev/portal-cliente" class="button">
                  🚀 Acessar Portal do Cliente
                </a>
              </div>
              
              <div class="security-info">
                <h4 style="margin: 0 0 10px 0;">🛡️ Informações de Segurança:</h4>
                <ul style="margin: 0; padding-left: 20px;">
                  <li>Esta senha foi gerada por um administrador do sistema</li>
                  <li>Recomendamos alterar para uma senha personalizada no primeiro acesso</li>
                  <li>Se você não solicitou esta alteração, entre em contato conosco imediatamente</li>
                  <li>Nunca compartilhe suas credenciais com terceiros</li>
                </ul>
              </div>
              
              <div class="warning">
                <h4 style="margin: 0 0 10px 0;">⚠️ Atenção:</h4>
                <p style="margin: 0;">Se você não solicitou a alteração de senha, entre em contato conosco <strong>imediatamente</strong> pelo telefone <strong>(16) 3987-3829</strong>.</p>
              </div>
              
              <p>Nossa equipe está sempre à disposição para ajudá-lo(a) com qualquer dúvida sobre o sistema.</p>
            </div>
            
            <div class="footer">
              <strong>AG Assessoria Contábil</strong><br>
              📞 (16) 3987-3829<br>
              📧 agassessoriacontrole@gmail.com<br>
              <br>
              <em>Este é um email automático de segurança. Em caso de dúvidas, entre em contato conosco.</em>
            </div>
          </div>
        </body>
        </html>
        `

        const data = await resend.emails.send({
          from: 'AG Assessoria <agassessoriacontrole@gmail.com>',
          to: [email],
          subject: `🔐 Nova Senha Gerada - Portal do Cliente AG Assessoria`,
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
      console.log(`🚀 Acesse: https://mk2of4l6b3c7h8aflcpq3h6w.macaly.dev/portal-cliente`)
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