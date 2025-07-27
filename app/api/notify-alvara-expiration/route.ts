import { NextRequest, NextResponse } from 'next/server'

// Interface para dados de notificação de alvará
interface AlvaraNotificationData {
  clienteEmail: string
  clienteNome: string
  empresa: string
  cnpj: string
  tipo: string
  numeroProtocolo: string
  dataVencimento: string
  status: 'vencendo' | 'vencido'
  responsavel: string
  daysToExpire?: number
}

// Function to get type label
function getTypeLabel(tipo: string) {
  switch (tipo) {
    case 'vigilancia_sanitaria': return 'Vigilância Sanitária'
    case 'bombeiro': return 'Bombeiros' 
    case 'municipal': return 'Municipal'
    default: return tipo
  }
}

export async function POST(request: NextRequest) {
  console.log('🔔 API notify-alvara-expiration chamada')
  
  try {
    const data: AlvaraNotificationData = await request.json()
    console.log('📧 Dados recebidos para notificação:', data)
    
    const { 
      clienteEmail, 
      clienteNome, 
      empresa, 
      cnpj, 
      tipo, 
      numeroProtocolo, 
      dataVencimento, 
      status, 
      responsavel,
      daysToExpire 
    } = data

    // Validar dados obrigatórios
    if (!clienteEmail || !clienteNome || !empresa || !numeroProtocolo) {
      console.error('❌ Dados obrigatórios faltando')
      return NextResponse.json({ 
        success: false, 
        message: 'Dados obrigatórios faltando: email, nome, empresa ou protocolo' 
      }, { status: 400 })
    }

    // Determinar mensagem baseada no status
    const isExpired = status === 'vencido'
    const urgencyMessage = isExpired 
      ? `⚠️ VENCIDO há ${Math.abs(daysToExpire || 0)} dias` 
      : `⏰ Vence em ${daysToExpire || 0} dias`

    const subjectPrefix = isExpired ? '🚨 URGENTE' : '⚠️ ATENÇÃO'
    const actionRequired = isExpired 
      ? 'RENOVAÇÃO IMEDIATA NECESSÁRIA' 
      : 'PROVIDÊNCIAS NECESSÁRIAS'

    // Preparar conteúdo do email
    const emailSubject = `${subjectPrefix}: Alvará ${empresa} - ${actionRequired}`
    
    const emailContent = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Notificação de Alvará - AG Assessoria</title>
    <style>
        body { 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
            line-height: 1.6; 
            margin: 0; 
            padding: 0; 
            background-color: #f8fafc; 
        }
        .container { 
            max-width: 650px; 
            margin: 20px auto; 
            background: white; 
            border-radius: 12px; 
            overflow: hidden; 
            box-shadow: 0 10px 25px rgba(0,0,0,0.1);
            border: 1px solid #e2e8f0;
        }
        .header { 
            background: linear-gradient(135deg, ${isExpired ? '#dc2626 0%, #991b1b 100%' : '#f59e0b 0%, #d97706 100%'}); 
            color: white; 
            padding: 30px; 
            text-align: center; 
            position: relative;
        }
        .header::after {
            content: '';
            position: absolute;
            bottom: -10px;
            left: 50%;
            transform: translateX(-50%);
            width: 0;
            height: 0;
            border-left: 15px solid transparent;
            border-right: 15px solid transparent;
            border-top: 10px solid ${isExpired ? '#dc2626' : '#f59e0b'};
        }
        .header h1 { 
            margin: 0; 
            font-size: 28px; 
            font-weight: 700;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
        }
        .header .subtitle {
            margin: 8px 0 0 0; 
            opacity: 0.95; 
            font-size: 16px;
            font-weight: 500;
        }
        .content { 
            padding: 40px 30px; 
        }
        .greeting {
            font-size: 20px;
            color: #1f2937;
            margin-bottom: 25px;
            font-weight: 600;
        }
        .alert-box { 
            background: ${isExpired ? '#fef2f2' : '#fefbf2'}; 
            border: 2px solid ${isExpired ? '#dc2626' : '#f59e0b'}; 
            border-radius: 12px; 
            padding: 25px; 
            margin: 25px 0;
            position: relative;
        }
        .alert-box::before {
            content: '${isExpired ? '🚨' : '⚠️'}';
            position: absolute;
            top: -15px;
            left: 25px;
            background: white;
            padding: 5px 10px;
            border-radius: 50%;
            font-size: 24px;
            border: 2px solid ${isExpired ? '#dc2626' : '#f59e0b'};
        }
        .alert-title {
            margin: 10px 0 15px 0; 
            color: ${isExpired ? '#dc2626' : '#f59e0b'};
            font-size: 20px;
            font-weight: 700;
        }
        .info-grid { 
            display: grid; 
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); 
            gap: 20px; 
            margin: 30px 0; 
        }
        .info-item { 
            background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%); 
            padding: 20px; 
            border-radius: 10px; 
            border-left: 4px solid #3b82f6;
            transition: transform 0.2s ease;
        }
        .info-item:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        }
        .info-label { 
            font-weight: 700; 
            color: #374151; 
            font-size: 13px; 
            text-transform: uppercase; 
            letter-spacing: 0.5px;
            margin-bottom: 8px;
        }
        .info-value { 
            color: #1f2937; 
            font-size: 16px; 
            font-weight: 600;
        }
        .contact-section {
            background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
            border-radius: 12px;
            padding: 25px;
            margin: 30px 0;
            border: 1px solid #0ea5e9;
        }
        .contact-title {
            margin-top: 0;
            color: #0c4a6e;
            font-size: 20px;
            font-weight: 700;
            display: flex;
            align-items: center;
            gap: 10px;
        }
        .whatsapp-button { 
            display: inline-block; 
            background: linear-gradient(135deg, #25d366 0%, #20ba5a 100%); 
            color: white; 
            padding: 15px 25px; 
            text-decoration: none; 
            border-radius: 25px; 
            font-weight: bold; 
            margin: 15px 0;
            transition: all 0.3s ease;
            box-shadow: 0 4px 15px rgba(37, 211, 102, 0.3);
        }
        .whatsapp-button:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(37, 211, 102, 0.4);
        }
        .footer { 
            background: linear-gradient(135deg, #1e293b 0%, #334155 100%); 
            padding: 30px; 
            text-align: center; 
            color: white;
        }
        .footer-logo {
            height: 50px;
            margin-bottom: 15px;
            filter: brightness(0) invert(1);
        }
        .footer-company {
            font-size: 18px;
            color: #94a3b8;
            margin-bottom: 15px;
            font-weight: 600;
        }
        .footer-info {
            margin: 8px 0;
            color: #cbd5e1;
            font-size: 14px;
        }
        .footer-disclaimer {
            margin: 20px 0 0 0;
            color: #94a3b8;
            font-size: 12px;
            opacity: 0.8;
            border-top: 1px solid #475569;
            padding-top: 15px;
        }
        .urgent { color: #dc2626; font-weight: bold; }
        .warning { color: #f59e0b; font-weight: bold; }
        .status-badge {
            display: inline-block;
            background: ${isExpired ? '#dc2626' : '#f59e0b'};
            color: white;
            padding: 8px 16px;
            border-radius: 20px;
            font-size: 14px;
            font-weight: 600;
            margin: 10px 0;
        }
        
        @media only screen and (max-width: 600px) {
            .container { margin: 10px; border-radius: 8px; }
            .header, .content { padding: 25px 20px; }
            .info-grid { grid-template-columns: 1fr; gap: 15px; }
            .info-item { padding: 15px; }
            .header h1 { font-size: 24px; }
            .contact-section, .alert-box { padding: 20px; }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>${isExpired ? '🚨 ALVARÁ VENCIDO' : '⚠️ ALVARÁ VENCENDO'}</h1>
            <div class="subtitle">${urgencyMessage}</div>
            <div class="status-badge">${isExpired ? 'RENOVAÇÃO URGENTE' : 'AÇÃO NECESSÁRIA'}</div>
        </div>
        
        <div class="content">
            <div class="greeting">Prezado(a) <strong>${clienteNome}</strong>,</div>
            
            <div class="alert-box">
                <h3 class="alert-title">
                    ${isExpired ? '🚨 AÇÃO IMEDIATA NECESSÁRIA' : '⚠️ ATENÇÃO NECESSÁRIA'}
                </h3>
                <p style="margin: 0; font-size: 16px; line-height: 1.6;">
                    O alvará da empresa <strong>${empresa}</strong> 
                    ${isExpired ? '<span class="urgent">está VENCIDO</span>' : '<span class="warning">está próximo do vencimento</span>'} 
                    e requer ${isExpired ? '<strong>renovação imediata</strong>' : '<strong>providências urgentes</strong>'}.
                </p>
                <p style="margin: 15px 0 0 0; font-size: 14px; color: #6b7280;">
                    ${isExpired ? 
                      '⏰ Cada dia de atraso pode resultar em multas e complicações legais.' : 
                      '📅 Recomendamos iniciar o processo de renovação o quanto antes.'}
                </p>
            </div>
            
            <div class="info-grid">
                <div class="info-item">
                    <div class="info-label">🏢 Empresa</div>
                    <div class="info-value">${empresa}</div>
                </div>
                <div class="info-item">
                    <div class="info-label">📄 CNPJ</div>
                    <div class="info-value">${cnpj}</div>
                </div>
                <div class="info-item">
                    <div class="info-label">📋 Tipo de Alvará</div>
                    <div class="info-value">${getTypeLabel(tipo)}</div>
                </div>
                <div class="info-item">
                    <div class="info-label">🔢 Protocolo</div>
                    <div class="info-value">${numeroProtocolo}</div>
                </div>
                <div class="info-item">
                    <div class="info-label">📅 Data de Vencimento</div>
                    <div class="info-value ${isExpired ? 'urgent' : 'warning'}">${dataVencimento}</div>
                </div>
                <div class="info-item">
                    <div class="info-label">⏱️ Status Atual</div>
                    <div class="info-value ${isExpired ? 'urgent' : 'warning'}">${urgencyMessage}</div>
                </div>
            </div>
            
            <div class="contact-section">
                <h4 class="contact-title">
                    📞 Entre em contato conosco
                </h4>
                <p style="margin: 15px 0; font-size: 16px; color: #0c4a6e;">
                    Para iniciar o processo de ${isExpired ? 'renovação urgente' : 'renovação antecipada'}, 
                    nossa equipe especializada está à sua disposição:
                </p>
                <p style="margin: 15px 0; font-size: 16px; color: #1e40af;">
                    <strong>👨‍💼 ${responsavel}</strong><br>
                    <span style="color: #64748b;">Especialista em Licenciamento</span>
                </p>
                
                <div style="text-align: center; margin: 25px 0;">
                    <a href="https://wa.me/5516991098966?text=Olá! Preciso ${isExpired ? 'renovar URGENTEMENTE' : 'renovar'} o alvará da empresa ${encodeURIComponent(empresa)} (Protocolo: ${numeroProtocolo}). Pode me ajudar?" 
                       class="whatsapp-button">
                        📱 Falar no WhatsApp Agora
                    </a>
                </div>
                
                <div style="text-align: center; font-size: 14px; color: #64748b; margin-top: 15px;">
                    <p>📞 <strong>(16) 99109-8966</strong> | 📧 <strong>contato@agassessoria.com.br</strong></p>
                </div>
            </div>
            
            ${isExpired ? `
            <div style="background: #fef2f2; border: 2px solid #dc2626; border-radius: 8px; padding: 20px; margin: 25px 0; text-align: center;">
                <h4 style="color: #dc2626; margin-top: 0;">⚠️ IMPORTANTE - ALVARÁ VENCIDO</h4>
                <p style="color: #7f1d1d; margin: 10px 0; font-weight: 600;">
                    Seu alvará está vencido há ${Math.abs(daysToExpire || 0)} dias. 
                    É fundamental regularizar a situação imediatamente para evitar:
                </p>
                <ul style="color: #7f1d1d; text-align: left; margin: 15px 0; padding-left: 20px;">
                    <li>Multas e penalidades</li>
                    <li>Suspensão das atividades</li>
                    <li>Problemas com fiscalização</li>
                    <li>Complicações legais</li>
                </ul>
            </div>
            ` : ''}
        </div>
        
        <div class="footer">
            <img src="https://assets.macaly-user-data.dev/vu6uteof0g2skav7mwkttz9h/mk2of4l6b3c7h8aflcpq3h6w/o-h2__8-krHhyceVQM4UJ/image.png" 
                 alt="AG Assessoria" class="footer-logo">
            <div class="footer-company">AG Assessoria - Gestão Empresarial</div>
            <div class="footer-info">📞 (16) 99109-8966</div>
            <div class="footer-info">📧 contato@agassessoria.com.br</div>
            <div class="footer-info">🌐 Especialistas em Licenciamento e Regularização</div>
            <div class="footer-disclaimer">
                Este é um email automático do sistema de gestão de alvarás. Para dúvidas, entre em contato conosco.<br>
                <strong>AG Assessoria em Gestão Empresarial</strong> - Seu parceiro em conformidade legal.
            </div>
        </div>
    </div>
</body>
</html>`

    // Verificar ambiente
const isProduction = process.env.NODE_ENV === 'production'
console.log(`🌍 Ambiente: ${isProduction ? 'Produção' : 'Desenvolvimento'}`)

if (isProduction) {
  // Produção: Usar Resend para envio real
  const RESEND_API_KEY = process.env.RESEND_API_KEY
  
  if (!RESEND_API_KEY) {
    console.error('❌ RESEND_API_KEY não configurada')
    return NextResponse.json({ 
      success: false, 
      message: 'Configuração de email não encontrada' 
    }, { status: 500 })
  }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'AG Assessoria <notificacoes@agassessoria.com.br>',
      to: [clienteEmail],
      subject: emailSubject,
      html: emailContent,
    }),
  })

  if (!response.ok) {
    const errorData = await response.text()
    console.error('❌ Erro Resend:', errorData)
    throw new Error(`Erro Resend: ${response.status}`)
  }

  const result = await response.json()
  console.log('✅ Email enviado via Resend:', result.id)
  
  return NextResponse.json({ 
    success: true, 
    message: `Notificação enviada para ${clienteEmail}`,
    emailId: result.id 
  })
  
} else {
  // Desenvolvimento: Simular envio e mostrar conteúdo
  console.log('📧 EMAIL SIMULADO (Desenvolvimento)')
  console.log('Para:', clienteEmail)
  console.log('Assunto:', emailSubject)
  console.log('Conteúdo:', emailContent.substring(0, 200) + '...')
  
  // Simular delay de envio
  await new Promise(resolve => setTimeout(resolve, 1000))
  
  return NextResponse.json({ 
    success: true, 
    message: `Notificação simulada para ${clienteEmail}`,
    development: true 
  })
}

  } catch (error) {
    console.error('❌ Erro ao enviar notificação de alvará:', error)
    return NextResponse.json({ 
      success: false, 
      message: error instanceof Error ? error.message : 'Erro interno do servidor' 
    }, { status: 500 })
  }
}