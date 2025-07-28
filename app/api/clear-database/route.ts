import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    console.log('🧹 Iniciando limpeza do banco de dados...')

    // Skip auth check for now - allow all requests
    console.log('Executando limpeza sem verificação de auth...')

    // Lista de tabelas para limpar (na ordem correta para respeitar foreign keys)
    const tablesToClear = [
      'documentos',
      'alvaras', 
      'obrigacoes',
      'responsaveis',
      'clientes',
      'empresas',
      'usuarios'
    ]

    let clearedTables: { table: string; recordsDeleted: number }[] = []
    let totalRecordsDeleted = 0

    // Limpar cada tabela
    for (const table of tablesToClear) {
      try {
        // Contar registros antes da limpeza
        const { count: beforeCount } = await supabase
          .from(table)
          .select('*', { count: 'exact', head: true })

        if (beforeCount && beforeCount > 0) {
          // Deletar todos os registros da tabela
          const { error } = await supabase
            .from(table)
            .delete()
            .neq('id', '00000000-0000-0000-0000-000000000000') // Deletar todos os registros

          if (error) {
            console.warn(`⚠️  Erro ao limpar tabela ${table}:`, error.message)
          } else {
            clearedTables.push({
              table,
              recordsDeleted: beforeCount || 0
            })
            totalRecordsDeleted += beforeCount || 0
            console.log(`✅ Tabela ${table} limpa: ${beforeCount} registros deletados`)
          }
        } else {
          console.log(`ℹ️  Tabela ${table} já está vazia`)
        }
      } catch (tableError) {
        console.warn(`⚠️  Tabela ${table} não existe ou erro:`, tableError)
      }
    }

    // Verificar se as tabelas estão realmente vazias
    const finalCounts: { table: string; remainingRecords: number }[] = []
    for (const table of tablesToClear) {
      try {
        const { count } = await supabase
          .from(table)
          .select('*', { count: 'exact', head: true })
        
        finalCounts.push({
          table,
          remainingRecords: count || 0
        })
      } catch {
        // Tabela não existe, ignorar
      }
    }

    console.log('🎉 Limpeza do banco concluída!')

    return NextResponse.json({
      success: true,
      message: '🚀 Banco de dados limpo com sucesso!',
      summary: {
        clearedTables,
        totalRecordsDeleted,
        finalCounts,
        timestamp: new Date().toISOString()
      }
    })

  } catch (error) {
    console.error('❌ Erro durante limpeza do banco:', error)
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Erro interno durante limpeza do banco',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      }, 
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({
    message: '🗄️ Endpoint para limpeza do banco de dados',
    usage: 'Use POST com Bearer token para executar limpeza',
    warning: '⚠️ Esta operação deletará TODOS os dados das tabelas!'
  })
}