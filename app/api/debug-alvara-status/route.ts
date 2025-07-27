import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { differenceInDays } from 'date-fns'

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Debug Alvará Status: Iniciando análise...')
    
    // Buscar todos os alvarás
    const { data: alvaras, error } = await supabase
      .from('alvaras')
      .select('*')
      .order('data_vencimento', { ascending: true })

    if (error) {
      console.error('❌ Erro ao buscar alvarás:', error)
      return NextResponse.json({ 
        success: false, 
        error: error.message 
      })
    }

    console.log(`📊 Total de alvarás encontrados: ${alvaras?.length || 0}`)

    if (!alvaras || alvaras.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'Nenhum alvará encontrado no banco de dados',
        alvaras: [],
        statusSummary: {
          total: 0,
          em_dia: 0,
          vencendo: 0,
          vencido: 0
        }
      })
    }

    // Processar cada alvará e calcular status
    const today = new Date()
    const processedAlvaras = alvaras.map((alvara: any) => {
      const dataVencimento = new Date(alvara.data_vencimento)
      const daysToExpire = differenceInDays(dataVencimento, today)
      
      let status: 'em_dia' | 'vencendo' | 'vencido'
      if (daysToExpire < 0) {
        status = 'vencido'
      } else if (daysToExpire <= 30) {
        status = 'vencendo'
      } else {
        status = 'em_dia'
      }

      return {
        id: alvara.id,
        empresa: alvara.empresa,
        cnpj: alvara.cnpj,
        tipo: alvara.tipo,
        numero_protocolo: alvara.numero_protocolo,
        data_vencimento_original: alvara.data_vencimento,
        data_vencimento_parsed: dataVencimento.toISOString().split('T')[0],
        days_to_expire: daysToExpire,
        status_calculado: status,
        hoje: today.toISOString().split('T')[0]
      }
    })

    // Calcular resumo de status
    const statusSummary = {
      total: processedAlvaras.length,
      em_dia: processedAlvaras.filter(a => a.status_calculado === 'em_dia').length,
      vencendo: processedAlvaras.filter(a => a.status_calculado === 'vencendo').length,
      vencido: processedAlvaras.filter(a => a.status_calculado === 'vencido').length
    }

    console.log('📈 Resumo dos status:', statusSummary)

    return NextResponse.json({
      success: true,
      message: `Análise completa de ${processedAlvaras.length} alvarás`,
      alvaras: processedAlvaras,
      statusSummary,
      debug: {
        dataHoje: today.toISOString().split('T')[0],
        timezoneBrasil: new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' }),
        timezoneUTC: new Date().toISOString()
      }
    })

  } catch (error: any) {
    console.error('❌ Erro geral na API debug:', error)
    return NextResponse.json({ 
      success: false, 
      error: error.message || 'Erro interno do servidor',
      stack: error.stack
    }, { status: 500 })
  }
}