import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    console.log('🔧 Corrigindo estrutura da tabela usuarios...')

    // Tentar adicionar a coluna senha_hash
    const { error: alterError } = await supabase.rpc('execute_sql', {
      sql: 'ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS senha_hash TEXT;'
    })

    if (alterError) {
      console.log('⚠️ Erro ao adicionar coluna (pode já existir):', alterError.message)
      
      // Tentar método alternativo usando query raw
      try {
        const { error: directError } = await supabase
          .from('usuarios')
          .select('senha_hash')
          .limit(1)

        if (directError && directError.message.includes('column') && directError.message.includes('does not exist')) {
          console.log('❌ Coluna senha_hash realmente não existe e não conseguimos adicioná-la')
          
          return NextResponse.json({
            success: false,
            message: 'Não foi possível adicionar a coluna senha_hash. É necessário fazer isso manualmente no banco.',
            suggestedSQL: 'ALTER TABLE usuarios ADD COLUMN senha_hash TEXT;',
            error: 'Column does not exist and cannot be added automatically'
          })
        }
      } catch (checkError) {
        console.error('❌ Erro ao verificar coluna:', checkError)
      }
    }

    console.log('✅ Estrutura da tabela corrigida')

    // Verificar se a coluna foi adicionada com sucesso
    const { data: testData, error: testError } = await supabase
      .from('usuarios')
      .select('id, nome, email, senha_hash')
      .limit(1)

    if (testError) {
      console.error('❌ Ainda há erro ao acessar senha_hash:', testError.message)
      return NextResponse.json({
        success: false,
        message: 'Coluna senha_hash ainda não está acessível',
        error: testError.message,
        suggestedSQL: 'ALTER TABLE usuarios ADD COLUMN senha_hash TEXT;'
      })
    }

    console.log('✅ Coluna senha_hash está funcionando')

    return NextResponse.json({
      success: true,
      message: 'Estrutura da tabela usuarios corrigida com sucesso',
      testResult: {
        canAccessColumn: true,
        sampleCount: testData?.length || 0
      }
    })

  } catch (error) {
    console.error('💥 Erro interno:', error)
    return NextResponse.json({
      success: false,
      message: 'Erro interno do servidor',
      error: error instanceof Error ? error.message : 'Erro desconhecido',
      suggestedSQL: 'ALTER TABLE usuarios ADD COLUMN senha_hash TEXT;'
    }, { status: 500 })
  }
}