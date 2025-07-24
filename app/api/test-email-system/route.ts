import { NextResponse } from 'next/server'

export async function POST() {
  try {
    console.log('🧪 Testando sistema de email...')
    
    // Verificar ambiente
    const resendApiKey = process.env.RESEND_API_KEY
    const isOnVercel = process.env.VERCEL === '1'
    const isVercelProduction = process.env.VERCEL_ENV === 'production'
    const isNodeProduction = process.env.NODE_ENV === 'production'
    
    // ULTRA AGGRESSIVE: Check for any signs we're on Vercel/Production
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
    
    const isProductionEnvironment = (
      isNodeProduction || 
      isVercelProduction ||
      isVercelDeployment ||
      hasVercelDomain ||
      hasProductionDomain ||
      (!!resendApiKey && isDeployedEnvironment && notLocalhost) ||
      forceProductionMode // 🔥 FORCE PRODUCTION if API key exists
    )
    
    const isFullyProduction = isProductionEnvironment && !!resendApiKey
    
    console.log('🔍 Environment Check:', {
      NODE_ENV: process.env.NODE_ENV,
      VERCEL_ENV: process.env.VERCEL_ENV,
      VERCEL: process.env.VERCEL,
      isOnVercel,
      isVercelProduction,
      isNodeProduction,
      isProductionEnvironment,
      hasResendKey: !!resendApiKey,
      isFullyProduction
    })
    
    if (isFullyProduction) {
      // Testar email real
      try {
        const { Resend } = await import('resend')
        const resend = new Resend(resendApiKey)

        const data = await resend.emails.send({
          from: 'AG Assessoria <noreply@resend.dev>', // Usar domínio padrão do Resend que sempre funciona
          to: ['gomes1309@gmail.com'], // Email verificado no Resend (do dono da conta)
          replyTo: 'agassessoriacontrole@gmail.com', // Email real para respostas
          subject: '🧪 Teste do Sistema de Email - AG Assessoria',
          html: `
            <div style="font-family: Arial; padding: 20px; max-width: 600px;">
              <h2 style="color: #2563eb;">✅ Sistema de Email Funcionando!</h2>
              <p>Este é um email de teste do sistema AG Assessoria.</p>
              <div style="background: #f0f8ff; padding: 15px; border-radius: 8px; margin: 15px 0;">
                <h4>Detalhes do Ambiente:</h4>
                <ul>
                  <li><strong>NODE_ENV:</strong> ${process.env.NODE_ENV}</li>
                  <li><strong>VERCEL_ENV:</strong> ${process.env.VERCEL_ENV}</li>
                  <li><strong>VERCEL:</strong> ${process.env.VERCEL}</li>
                  <li><strong>Data/Hora:</strong> ${new Date().toLocaleString('pt-BR')}</li>
                </ul>
              </div>
              <p style="color: #16a34a; font-weight: bold;">🎉 O sistema de email está funcionando corretamente!</p>
            </div>
          `
        })

        console.log('✅ Email de teste enviado:', data)
        
        return NextResponse.json({
          success: true,
          message: 'Email de teste enviado com sucesso!',
          environment: {
            NODE_ENV: process.env.NODE_ENV,
            VERCEL_ENV: process.env.VERCEL_ENV,
            VERCEL: process.env.VERCEL,
            isProductionEnvironment,
            isFullyProduction
          },
          emailData: data
        })
      } catch (emailError) {
        console.error('❌ Erro ao testar email:', emailError)
        return NextResponse.json({
          success: false,
          message: 'Erro ao enviar email de teste',
          error: emailError instanceof Error ? emailError.message : 'Erro desconhecido',
          environment: {
            NODE_ENV: process.env.NODE_ENV,
            VERCEL_ENV: process.env.VERCEL_ENV,
            VERCEL: process.env.VERCEL,
            isProductionEnvironment,
            isFullyProduction
          }
        })
      }
    } else {
      return NextResponse.json({
        success: false,
        message: 'Sistema não está em produção ou RESEND_API_KEY não configurada',
        environment: {
          NODE_ENV: process.env.NODE_ENV,
          VERCEL_ENV: process.env.VERCEL_ENV,
          VERCEL: process.env.VERCEL,
          isProductionEnvironment,
          isFullyProduction,
          hasResendKey: !!resendApiKey
        }
      })
    }
  } catch (error) {
    console.error('❌ Erro geral no teste de email:', error)
    return NextResponse.json({
      success: false,
      message: 'Erro interno no teste',
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 })
  }
}