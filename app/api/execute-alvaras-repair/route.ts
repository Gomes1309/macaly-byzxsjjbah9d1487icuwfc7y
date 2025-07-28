import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST() {
  try {
    console.log('🔧 Executando correção automática da tabela alvaras...')
    
    const results: any[] = []
    
    // 1. Verificar estrutura atual primeiro
    console.log('🔍 Verificando estrutura atual...')
    const { data: testData, error: testError } = await supabase
      .from('alvaras')
      .select('contato')
      .limit(1)
    
    if (!testError) {
      return NextResponse.json({
        success: true,
        message: '✅ A tabela já tem a estrutura correta!',
        alreadyFixed: true
      })
    }
    
    console.log('❌ Estrutura incorreta confirmada:', testError.message)
    
    // 2. Como não podemos executar DDL diretamente via REST API,
    // vamos tentar uma abordagem alternativa: recriar via código
    
    console.log('🔄 Tentando recrear tabela via DROP/CREATE...')
    
    try {
      // Primeiro tentar fazer backup dos dados existentes
      const { data: existingData, error: backupError } = await supabase
        .from('alvaras')
        .select('*')
      
      if (backupError) {
        console.log('⚠️ Erro ao fazer backup, mas continuando:', backupError.message)
      } else {
        console.log(`📦 Backup de ${existingData?.length || 0} registros realizado`)
      }
      
      results.push({
        step: 'backup',
        success: !backupError,
        message: `Backup de ${existingData?.length || 0} registros`,
        data: existingData
      })
      
      // Agora vamos tentar usar o endpoint de setup do banco
      console.log('🔧 Executando setup do banco...')
      
      // Fazer uma requisição interna para o setup
      const setupUrl = `${process.env.VERCEL_URL || 'http://localhost:3000'}/api/setup-database-auto`
      
      try {
        const setupResponse = await fetch(setupUrl, { 
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          }
        })
        
        const setupResult = await setupResponse.json()
        
        results.push({
          step: 'database-setup',
          success: setupResponse.ok,
          message: setupResult.message || 'Setup executado',
          details: setupResult
        })
        
        console.log('✅ Setup do banco executado:', setupResult)
        
      } catch (setupError: any) {
        console.error('❌ Erro no setup:', setupError)
        results.push({
          step: 'database-setup',
          success: false,
          error: setupError.message
        })
      }
      
      // 3. Verificar se a correção funcionou
      console.log('🧪 Testando estrutura corrigida...')
      
      const { data: verifyData, error: verifyError } = await supabase
        .from('alvaras')
        .select('contato, responsavel')
        .limit(1)
      
      const isFixed = !verifyError
      
      results.push({
        step: 'verification',
        success: isFixed,
        message: isFixed ? '✅ Estrutura corrigida com sucesso!' : `❌ Ainda há problemas: ${verifyError?.message}`,
        error: verifyError?.message
      })
      
      return NextResponse.json({
        success: isFixed,
        message: isFixed ? 
          '🎉 Tabela alvaras corrigida com sucesso! Teste a aplicação agora.' :
          '❌ Correção não foi completamente bem-sucedida. Veja os detalhes.',
        results: results,
        nextSteps: isFixed ? [
          'Teste a página /alvaras',
          'Tente criar um novo alvará',
          'Verifique se o erro desapareceu'
        ] : [
          'Execute os comandos SQL manualmente no Supabase',
          'Use o endpoint /api/repair-alvaras-table para obter os comandos'
        ]
      })
      
    } catch (error: any) {
      console.error('❌ Erro na execução:', error)
      return NextResponse.json({
        success: false,
        error: error.message,
        results: results,
        recommendation: 'Execute os comandos SQL manualmente no Supabase SQL Editor'
      })
    }
    
  } catch (error: any) {
    console.error('❌ Erro geral:', error)
    return NextResponse.json({
      success: false,
      error: error.message || 'Erro desconhecido'
    })
  }
}