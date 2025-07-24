import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'

// Configuração do Resend
const resend = new Resend(process.env.RESEND_API_KEY || 'demo-key')

// Verificar se estamos em ambiente de desenvolvimento
const isDevelopment = process.env.NODE_ENV === 'development' || !process.env.RESEND_API_KEY

interface EmailData {
  clienteNome: string
  clienteEmail: string
  nomeDocumento: string
  tipoDocumento: string
  categoria: string
  dataUpload: string
}

export async function POST(request: NextRequest) {
  try {
    const body: EmailData = await request.json()
    
    console.log('Enviando email de notificação:', body)
    
    // Template HTML do email
    const htmlTemplate = `
      <!DOCTYPE html>
      <html lang="pt-BR">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Documento Disponível - AG Assessoria</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            text-align: center;
            border-radius: 10px 10px 0 0;
          }
          .header h1 {
            margin: 0;
            font-size: 24px;
          }
          .content {
            background: #f9f9f9;
            padding: 30px;
            border-radius: 0 0 10px 10px;
            border: 1px solid #ddd;
          }
          .document-info {
            background: white;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
            border-left: 4px solid #667eea;
          }
          .document-info h3 {
            color: #667eea;
            margin-top: 0;
          }
          .info-row {
            margin: 10px 0;
          }
          .info-label {
            font-weight: bold;
            color: #555;
          }
          .cta-button {
            background: #667eea;
            color: white;
            padding: 12px 30px;
            text-decoration: none;
            border-radius: 5px;
            display: inline-block;
            margin: 20px 0;
          }
          .footer {
            text-align: center;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #ddd;
            color: #666;
            font-size: 14px;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>🗂️ AG ASSESSORIA CONTÁBIL</h1>
          <p>Documento Disponível para Download</p>
        </div>
        
        <div class="content">
          <p>Prezado(a) <strong>${body.clienteNome}</strong>,</p>
          
          <p>Cordialmente informamos que há um novo documento disponível para download em nossa plataforma.</p>
          
          <div class="document-info">
            <h3>📄 Informações do Documento</h3>
            <div class="info-row">
              <span class="info-label">Nome do arquivo:</span> ${body.nomeDocumento}
            </div>
            <div class="info-row">
              <span class="info-label">Tipo:</span> ${body.tipoDocumento.replace('_', ' ').toUpperCase()}
            </div>
            <div class="info-row">
              <span class="info-label">Categoria:</span> ${body.categoria}
            </div>
            <div class="info-row">
              <span class="info-label">Data de envio:</span> ${body.dataUpload}
            </div>
          </div>
          
          <p>Para acessar o documento, faça login em nossa plataforma utilizando suas credenciais.</p>
          
          <div style="text-align: center;">
            <a href="https://mk2of4l6b3c7h8aflcpq3h6w.macaly.dev/clientes" class="cta-button">
              Acessar Portal do Cliente
            </a>
          </div>
          
          <p><strong>Importante:</strong> Por questões de segurança, mantenha suas credenciais de acesso sempre atualizadas e não compartilhe com terceiros.</p>
          
          <p>Em caso de dúvidas ou dificuldades para acessar o documento, entre em contato conosco.</p>
          
          <p>Atenciosamente,<br>
          <strong>Equipe AG Assessoria Contábil</strong></p>
        </div>
        
        <div class="footer">
          <p>Este é um email automático. Por favor, não responda a esta mensagem.</p>
          <p>AG Assessoria Contábil | Desenvolvimento e Gestão Empresarial</p>
        </div>
      </body>
      </html>
    `

    // Em desenvolvimento, simular envio de email
    if (isDevelopment) {
      console.log('🚀 MODO DESENVOLVIMENTO: Email simulado enviado')
      console.log('📧 Para:', body.clienteEmail)
      console.log('📄 Documento:', body.nomeDocumento)
      console.log('📝 Template HTML renderizado com sucesso')
      
      return NextResponse.json({ 
        success: true, 
        message: 'Email simulado enviado com sucesso (desenvolvimento)',
        data: { 
          to: body.clienteEmail,
          subject: `📄 Novo documento disponível - ${body.nomeDocumento}`,
          mode: 'development'
        }
      })
    }

    // Em produção, enviar email real
    const { data, error } = await resend.emails.send({
      from: 'AG Assessoria <agassessoriacontrole@gmail.com>',
      to: [body.clienteEmail],
      subject: `📄 Novo documento disponível - ${body.nomeDocumento}`,
      html: htmlTemplate,
    })

    if (error) {
      console.error('Erro ao enviar email:', error)
      return NextResponse.json({ error: 'Erro ao enviar email' }, { status: 500 })
    }

    console.log('Email enviado com sucesso:', data)
    return NextResponse.json({ success: true, data })
    
  } catch (error) {
    console.error('Erro na API de email:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}