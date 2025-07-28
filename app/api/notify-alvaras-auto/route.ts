import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { differenceInDays, format } from 'date-fns'

// Configuração do Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

interface AlvaraData {
  id: string
  empresa: string
  cnpj: string
  tipo: 'vigilancia_sanitaria' | 'bombeiro' | 'municipal'
  numeroProtocolo: string
  dataVencimento: string
  responsavel: string
  contato: string
  clienteId?: string
  status: 'em_dia' | 'vencendo' | 'vencido'
  dataEmissao: string
  observacoes?: string
}

interface NotificationLog {
  alvara_id: string
  email_enviado: string
  data_envio: string
  tipo_notificacao: 'vencendo_15' | 'vencendo_7' | 'vencendo_3' | 'vencido_1' | 'vencido_7'
  status: 'sucesso' | 'erro'
}

export async function POST(request: NextRequest) {
  console.log('🤖 Sistema automático de notificação de alvarás iniciado')
  
  try {
    // 1. Buscar todos os alvarás ativos
    const { data: alvaras, error: alvarasError } = await supabase
      .from('alvaras')
      .select('*')
      .order('dataVencimento', { ascending: true })

    if (alvarasError) {
      console.error('❌ Erro ao buscar alvarás:', alvarasError)
      throw new Error('Erro ao buscar alvarás')
    }

    if (!alvaras || alvaras.length === 0) {
      console.log('ℹ️ Nenhum alvará encontrado para verificação')
      return NextResponse.json({
        success: true,
        message: 'Nenhum alvará encontrado para verificação',
        processados: 0,
        enviados: 0
      })
    }

    console.log(`📋 Verificando ${alvaras.length} alvarás`)

    // 2. Buscar clientes para nomes
    const { data: clientes } = await supabase
      .from('clientes')
      .select('id, nome, email')

    const clientesMap = new Map(clientes?.map(c => [c.id, c]) || [])

    // 3. Buscar logs de notificações já enviadas
    const { data: logs } = await supabase
      .from('notification_logs')
      .select('*')
      .gte('data_envio', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()) // Últimos 30 dias

    const logsMap = new Map()
    logs?.forEach(log => {
      const key = `${log.alvara_id}_${log.tipo_notificacao}`
      logsMap.set(key, log)
    })

    let processados = 0
    let enviados = 0
    const results: Array<{
      alvara: string
      email: string
      tipo: NotificationLog['tipo_notificacao']
      status: string
      erro?: string
    }> = []

    // 4. Processar cada alvará
    for (const alvara of alvaras as AlvaraData[]) {
      processados++
      
      const today = new Date()
      const vencimento = new Date(alvara.dataVencimento)
      const diasParaVencimento = differenceInDays(vencimento, today)
      
      console.log(`📅 Alvará ${alvara.empresa}: ${diasParaVencimento} dias para vencimento`)

      // Determinar tipo de notificação necessária
      let tipoNotificacao: NotificationLog['tipo_notificacao'] | null = null
      let shouldNotify = false

      if (diasParaVencimento === 15) {
        tipoNotificacao = 'vencendo_15'
        shouldNotify = true
      } else if (diasParaVencimento === 7) {
        tipoNotificacao = 'vencendo_7'
        shouldNotify = true
      } else if (diasParaVencimento === 3) {
        tipoNotificacao = 'vencendo_3'
        shouldNotify = true
      } else if (diasParaVencimento === -1) {
        tipoNotificacao = 'vencido_1'
        shouldNotify = true
      } else if (diasParaVencimento === -7) {
        tipoNotificacao = 'vencido_7'
        shouldNotify = true
      }

      if (!shouldNotify || !tipoNotificacao) {
        continue
      }

      // Verificar se já foi enviada notificação deste tipo
      const logKey = `${alvara.id}_${tipoNotificacao}`
      if (logsMap.has(logKey)) {
        console.log(`✅ Notificação ${tipoNotificacao} já enviada para ${alvara.empresa}`)
        continue
      }

      // Preparar dados para envio
      const isExpired = diasParaVencimento < 0
      const clienteNome = alvara.clienteId ? 
        (clientesMap.get(alvara.clienteId)?.nome || 'Cliente') : 
        'Cliente'

      const notificationData = {
        clienteEmail: alvara.contato,
        clienteNome,
        empresa: alvara.empresa,
        cnpj: alvara.cnpj,
        tipo: alvara.tipo,
        numeroProtocolo: alvara.numeroProtocolo,
        dataVencimento: format(vencimento, 'dd/MM/yyyy'),
        status: isExpired ? 'vencido' as const : 'vencendo' as const,
        responsavel: alvara.responsavel,
        daysToExpire: Math.abs(diasParaVencimento),
        tipoNotificacao,
        urgencia: diasParaVencimento <= 3 ? 'alta' : diasParaVencimento <= 7 ? 'media' : 'baixa'
      }

      try {
        console.log(`📧 Enviando ${tipoNotificacao} para ${alvara.contato}`)

        // Chamar API de notificação
        const response = await fetch(`${process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000'}/api/notify-alvara-expiration`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(notificationData)
        })

        const result = await response.json()

        if (response.ok) {
          console.log(`✅ Email enviado com sucesso para ${alvara.empresa}`)
          
          // Registrar log de sucesso
          await supabase
            .from('notification_logs')
            .insert({
              alvara_id: alvara.id,
              email_enviado: alvara.contato,
              data_envio: new Date().toISOString(),
              tipo_notificacao: tipoNotificacao,
              status: 'sucesso',
              response_data: result
            })

          enviados++
          results.push({
            alvara: alvara.empresa,
            email: alvara.contato,
            tipo: tipoNotificacao,
            status: 'enviado'
          })
        } else {
          throw new Error(result.message || 'Erro no envio')
        }

      } catch (emailError) {
        console.error(`❌ Erro ao enviar email para ${alvara.empresa}:`, emailError)
        
        // Registrar log de erro
        await supabase
          .from('notification_logs')
          .insert({
            alvara_id: alvara.id,
            email_enviado: alvara.contato,
            data_envio: new Date().toISOString(),
            tipo_notificacao: tipoNotificacao,
            status: 'erro',
            error_message: emailError instanceof Error ? emailError.message : 'Erro desconhecido'
          })

        results.push({
          alvara: alvara.empresa,
          email: alvara.contato,
          tipo: tipoNotificacao,
          status: 'erro',
          erro: emailError instanceof Error ? emailError.message : 'Erro desconhecido'
        })
      }

      // Delay entre envios para evitar rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000))
    }

    console.log(`🎉 Processamento concluído: ${processados} verificados, ${enviados} emails enviados`)

    return NextResponse.json({
      success: true,
      message: `Verificação automática concluída: ${enviados} notificações enviadas de ${processados} alvarás verificados`,
      processados,
      enviados,
      detalhes: results
    })

  } catch (error) {
    console.error('❌ Erro no sistema automático de notificação:', error)
    return NextResponse.json({
      success: false,
      message: error instanceof Error ? error.message : 'Erro interno do servidor',
      error: error instanceof Error ? error.stack : 'Erro desconhecido'
    }, { status: 500 })
  }
}

// GET para status do sistema
export async function GET() {
  try {
    // Buscar estatísticas dos últimos 30 dias
    const { data: logs } = await supabase
      .from('notification_logs')
      .select('*')
      .gte('data_envio', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
      .order('data_envio', { ascending: false })

    const stats = {
      total_enviados: logs?.filter(l => l.status === 'sucesso').length || 0,
      total_erros: logs?.filter(l => l.status === 'erro').length || 0,
      ultimo_envio: logs?.[0]?.data_envio || null,
      tipos_notificacao: {}
    }

    // Contar por tipo
    logs?.forEach(log => {
      if (!stats.tipos_notificacao[log.tipo_notificacao]) {
        stats.tipos_notificacao[log.tipo_notificacao] = 0
      }
      stats.tipos_notificacao[log.tipo_notificacao]++
    })

    return NextResponse.json({
      success: true,
      message: 'Status do sistema de notificação automática',
      stats,
      logs: logs?.slice(0, 10) // Últimos 10 logs
    })

  } catch (error) {
    console.error('❌ Erro ao buscar status:', error)
    return NextResponse.json({
      success: false,
      message: 'Erro ao buscar status do sistema'
    }, { status: 500 })
  }
}