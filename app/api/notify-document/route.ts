import { NextRequest, NextResponse } from 'next/server'

// Interface para os dados de notificação de documentos
interface DocumentNotificationData {
  clienteEmail: string
  clienteNome: string
  empresa: string
  documentos: {
    nome: string
    categoria: string
    pasta: string
  }[]
  contadorNome?: string
}

export async function POST(request: NextRequest) {
  try {
    const { clienteEmail, clienteNome, empresa, documentos, contadorNome }: DocumentNotificationData = await request.json()

    console.log('📧 Enviando notificação de novos documentos para:', clienteEmail)

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

    console.log('📧 Document notification environment check (ULTRA AGGRESSIVE):', {
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
          <title>Novos Documentos Disponíveis - AG Assessoria</title>
          <style>
            body { 
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
              line-height: 1.6; 
              margin: 0; 
              padding: 0; 
              background: linear-gradient(135deg, #f0f8f0 0%, #f8f4ff 100%);
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
              background: linear-gradient(135deg, #9ACD32 0%, #7fb812 50%, #b8dc52 100%);
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
              background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="grain" width="100" height="100" patternUnits="userSpaceOnUse"><circle cx="25" cy="25" r="1" fill="%235a3b92" opacity="0.1"/><circle cx="75" cy="75" r="1" fill="%235a3b92" opacity="0.15"/><circle cx="50" cy="10" r="0.5" fill="%237a5bb2" opacity="0.1"/></pattern></defs><rect width="100" height="100" fill="url(%23grain)"/></svg>');
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
              background: rgba(90, 59, 146, 0.1);
            }
            .header-title { 
              font-size: 32px; 
              font-weight: 800; 
              margin: 25px 0 15px; 
              text-shadow: 0 3px 6px rgba(0,0,0,0.3);
              position: relative;
              z-index: 2;
              color: #5a3b92;
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
              background: rgba(90, 59, 146, 0.2);
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
              color: #4a2d7c;
              line-height: 1.9;
              margin-bottom: 35px;
              text-align: center;
              background: linear-gradient(135deg, #f0f8f0 0%, #e8f5e8 100%);
              padding: 30px;
              border-radius: 20px;
              border: 2px solid #9ACD32;
              box-shadow: 0 8px 25px rgba(154, 205, 50, 0.1);
              position: relative;
            }
            .message-section::before {
              content: '📂';
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
            .documents-box { 
              background: linear-gradient(135deg, #f0f8f0 0%, #e8f5e8 100%);
              border: 3px solid #9ACD32; 
              border-radius: 20px; 
              padding: 35px; 
              margin: 35px 0;
              box-shadow: 0 12px 35px rgba(154, 205, 50, 0.15);
              position: relative;
            }
            .documents-box::before {
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
            .documents-title {
              color: #4a2d7c;
              margin: 0 0 25px;
              font-size: 24px;
              font-weight: 800;
              display: flex;
              align-items: center;
              justify-content: center;
              gap: 12px;
              text-shadow: 0 2px 4px rgba(74, 45, 124, 0.1);
            }
            .document-item { 
              background: white; 
              padding: 25px; 
              margin: 20px 0; 
              border-radius: 15px; 
              border: 2px solid #9ACD32;
              box-shadow: 0 6px 20px rgba(154, 205, 50, 0.1);
              transition: transform 0.2s ease;
            }
            .document-item:hover {
              transform: translateY(-3px);
            }
            .document-name { 
              font-weight: 800; 
              color: #5a3b92;
              font-size: 18px;
              margin-bottom: 12px;
              display: flex;
              align-items: center;
              gap: 12px;
            }
            .document-name::before {
              content: '📄';
              background: #9ACD32;
              padding: 8px;
              border-radius: 50%;
              font-size: 16px;
            }
            .document-details { 
              font-size: 16px; 
              color: #4a2d7c; 
              background: linear-gradient(135deg, #f8f4ff 0%, #f0f8f0 100%);
              padding: 15px;
              border-radius: 10px;
              border: 1px solid #9ACD32;
            }
            .detail-item {
              display: inline-block;
              margin-right: 20px;
            }
            .detail-label {
              font-weight: 700;
              color: #5a3b92;
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
              text-shadow: 0 2px 4px rgba(0,0,0,0.2);
            }
            .info-box { 
              background: linear-gradient(135deg, #f8f4ff 0%, #e8f5e8 100%);
              border: 3px solid #7a5bb2; 
              padding: 30px; 
              border-radius: 20px; 
              margin: 30px 0;
              box-shadow: 0 8px 25px rgba(122, 91, 178, 0.15);
            }
            .info-title {
              margin: 0 0 20px;
              color: #4a2d7c;
              font-size: 22px;
              font-weight: 800;
              display: flex;
              align-items: center;
              justify-content: center;
              gap: 12px;
            }
            .info-list {
              margin: 0;
              padding-left: 25px;
              color: #5a3b92;
            }
            .info-list li {
              margin: 12px 0;
              font-weight: 600;
              font-size: 16px;
            }
            .sender-info {
              background: linear-gradient(135deg, #fff8dc 0%, #f0f8f0 100%);
              padding: 25px;
              border-radius: 20px;
              border: 2px solid #9ACD32;
              margin: 30px 0;
              text-align: center;
              box-shadow: 0 6px 20px rgba(154, 205, 50, 0.1);
            }
            .sender-info strong {
              color: #5a3b92;
              font-weight: 800;
              font-size: 18px;
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
              <div class="header-title">📄 Novos Documentos</div>
              <div class="subtitle">Portal do Cliente - Notificação</div>
            </div>
            
            <div class="content">
              <div class="greeting">Olá, ${clienteNome}! 📂</div>
              
              <div class="message-section">
                <strong>Temos uma excelente notícia!</strong>
                <br><br>
                Informamos que ${documentos.length > 1 ? 'novos documentos foram' : 'um novo documento foi'} ${documentos.length > 1 ? 'adicionados' : 'adicionado'} 
                ao seu portal do cliente para a empresa <strong>${empresa}</strong>.
                <br><br>
                <em>Acesse agora e mantenha-se sempre atualizado com a AG Assessoria! 📈</em>
              </div>
              
              <div class="documents-box">
                <h3 class="documents-title">📁 ${documentos.length > 1 ? 'Documentos Adicionados' : 'Documento Adicionado'} (${documentos.length})</h3>
                ${documentos.map(doc => `
                  <div class="document-item">
                    <div class="document-name">${doc.nome}</div>
                    <div class="document-details">
                      <span class="detail-item">
                        <span class="detail-label">Categoria:</span> ${doc.categoria}
                      </span>
                      <span class="detail-item">
                        <span class="detail-label">Pasta:</span> ${doc.pasta}
                      </span>
                    </div>
                  </div>
                `).join('')}
              </div>
              
              <div style="text-align: center;">
                <a href="https://mk2of4l6b3c7h8aflcpq3h6w.macaly.dev/portal-cliente" class="cta-button">
                  🚀 Acessar Portal do Cliente
                </a>
              </div>
              
              <div class="info-box">
                <h4 class="info-title">📋 Como Acessar seus Documentos</h4>
                <ul class="info-list">
                  <li>Acesse o Portal do Cliente usando suas credenciais</li>
                  <li>Navegue até a seção "Documentos"</li>
                  <li>Selecione a categoria correspondente ao documento</li>
                  <li>Baixe ou visualize os novos documentos disponíveis</li>
                </ul>
              </div>
              
              ${contadorNome ? `
                <div class="sender-info">
                  <strong>📤 Enviado por:</strong> ${contadorNome} - Equipe AG Assessoria
                </div>
              ` : ''}
              
              <div class="closing-message">
                Se tiver alguma dúvida sobre os documentos ou precisar de esclarecimentos, nossa equipe está sempre à disposição para oferecer o melhor suporte.
                <br><br>
                <strong class="highlight-text">Obrigado por confiar na AG Assessoria! 🌟</strong>
              </div>
            </div>
            
            <div class="footer">
              <div class="footer-company">AG Assessoria em Gestão Empresarial Contábil LTDA</div>
              <div class="footer-contact">📞 (16) 3987-3829</div>
              <div class="footer-contact">📧 agassessoriacontrole@gmail.com</div>
              <div class="footer-disclaimer">
                Este é um email automático de notificação. Em caso de dúvidas, entre em contato conosco.
              </div>
            </div>
          </div>
        </body>
        </html>
        `

        const data = await resend.emails.send({
          from: 'AG Assessoria <noreply@resend.dev>',
          to: [clienteEmail],
          replyTo: 'agassessoriacontrole@gmail.com',
          subject: `📄 ${documentos.length > 1 ? 'Novos documentos disponíveis' : 'Novo documento disponível'} - ${empresa}`,
          html: emailHtml,
        })

        console.log('✅ Email de notificação de documentos enviado com sucesso:', data)
        
        return NextResponse.json({
          success: true,
          message: 'Email de notificação enviado com sucesso',
          data
        })

      } catch (error) {
        console.error('❌ Erro ao enviar email via Resend:', error)
        
        // Fallback: Log detalhado em caso de erro
        console.log('📧 SIMULAÇÃO DE EMAIL DE DOCUMENTOS (Erro no Resend) 📧')
        console.log(`Para: ${clienteEmail}`)
        console.log(`Assunto: 📄 ${documentos.length > 1 ? 'Novos documentos disponíveis' : 'Novo documento disponível'} - ${empresa}`)
        console.log(`Cliente: ${clienteNome}`)
        console.log(`Empresa: ${empresa}`)
        console.log(`Documentos: ${documentos.map(d => d.nome).join(', ')}`)
        console.log('📧 FIM DA SIMULAÇÃO 📧')
        
        return NextResponse.json({
          success: false,
          message: 'Erro ao enviar email, mas documentos foram salvos. Verifique as configurações do Resend.',
          error: error instanceof Error ? error.message : 'Erro desconhecido'
        })
      }
    } else {
      // Desenvolvimento: Simular envio de email
      console.log('📧 SIMULAÇÃO DE EMAIL DE DOCUMENTOS (Desenvolvimento) 📧')
      console.log(`Para: ${clienteEmail}`)
      console.log(`Assunto: 📄 ${documentos.length > 1 ? 'Novos documentos disponíveis' : 'Novo documento disponível'} - ${empresa}`)
      console.log('')
      console.log(`Prezado(a) ${clienteNome},`)
      console.log('')
      console.log(`Informamos que ${documentos.length > 1 ? 'novos documentos foram adicionados' : 'um novo documento foi adicionado'} ao seu portal do cliente para a empresa ${empresa}:`)
      console.log('')
      documentos.forEach((doc, index) => {
        console.log(`${index + 1}. 📄 ${doc.nome}`)
        console.log(`   Categoria: ${doc.categoria} | Pasta: ${doc.pasta}`)
      })
      console.log('')
      console.log(`🚀 Acesse: https://mk2of4l6b3c7h8aflcpq3h6w.macaly.dev/portal-cliente`)
      console.log('')
      if (contadorNome) {
        console.log(`Enviado por: ${contadorNome} - Equipe AG Assessoria`)
        console.log('')
      }
      console.log(`Atenciosamente,`)
      console.log(`Equipe AG Assessoria Contábil`)
      console.log(`📞 (16) 3987-3829`)
      console.log('📧 FIM DA SIMULAÇÃO 📧')
      
      return NextResponse.json({
        success: true,
        message: 'Email de notificação simulado com sucesso (modo desenvolvimento)',
        simulated: true
      })
    }

  } catch (error) {
    console.error('❌ Erro geral no envio de notificação de documentos:', error)
    
    return NextResponse.json({
      success: false,
      message: 'Erro interno ao processar notificação de documentos',
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 })
  }
}