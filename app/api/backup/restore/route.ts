import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    console.log('🔄 Iniciando restauração de backup do banco de dados')
    
    const body = await request.json()
    const { backupData, mode = 'append', confirmReplace = false } = body
    
    if (!backupData || !backupData.data) {
      return NextResponse.json({
        success: false,
        error: 'Dados de backup inválidos',
        message: 'O arquivo de backup deve conter os dados válidos'
      }, { status: 400 })
    }
    
    const startTime = Date.now()
    const restoreResults: Record<string, any> = {}
    
    // Verificar modo de restauração
    if (mode === 'replace' && !confirmReplace) {
      return NextResponse.json({
        success: false,
        error: 'Confirmação necessária',
        message: 'Para substituir dados existentes, confirme com confirmReplace: true',
        warning: 'ATENÇÃO: Modo REPLACE irá APAGAR todos os dados existentes!'
      }, { status: 400 })
    }
    
    const metadata = backupData.metadata || {}
    const data = backupData.data || {}
    
    console.log('📋 Informações do backup:', {
      timestamp: metadata.timestamp,
      version: metadata.version,
      totalRecords: metadata.totalRecords,
      mode: mode
    })
    
    // Processar cada tabela
    for (const [tableName, tableData] of Object.entries(data)) {
      try {
        console.log(`📊 Restaurando tabela: ${tableName}`)
        
        if (!Array.isArray(tableData)) {
          console.warn(`⚠️ Dados inválidos para tabela ${tableName}`)
          restoreResults[tableName] = {
            success: false,
            error: 'Dados inválidos',
            records: 0
          }
          continue
        }
        
        if (tableData.length === 0) {
          console.log(`⚠️ Tabela ${tableName} vazia no backup`)
          restoreResults[tableName] = {
            success: true,
            records: 0,
            message: 'Tabela vazia'
          }
          continue
        }
        
        // Modo REPLACE: Limpar tabela primeiro
        if (mode === 'replace') {
          console.log(`🗑️ Limpando tabela ${tableName} (modo REPLACE)`)
          
          const { error: deleteError } = await supabaseAdmin
            .from(tableName)
            .delete()
            .neq('id', 'impossible-id') // Apagar todos os registros
          
          if (deleteError) {
            console.error(`❌ Erro ao limpar tabela ${tableName}:`, deleteError)
            restoreResults[tableName] = {
              success: false,
              error: `Erro ao limpar: ${deleteError.message}`,
              records: 0
            }
            continue
          }
        }
        
        // Inserir dados em lotes (para performance)
        const batchSize = 100
        let insertedCount = 0
        const errors: string[] = []
        
        for (let i = 0; i < tableData.length; i += batchSize) {
          const batch = tableData.slice(i, i + batchSize)
          
          const { data: insertedData, error: insertError, count } = await supabaseAdmin
            .from(tableName)
            .upsert(batch, { 
              onConflict: mode === 'append' ? 'id' : undefined,
              count: 'exact'
            })
            .select()
          
          if (insertError) {
            console.error(`❌ Erro ao inserir lote na tabela ${tableName}:`, insertError)
            errors.push(insertError.message || 'Erro desconhecido')
          } else {
            insertedCount += insertedData?.length || 0
            console.log(`✅ Inseridos ${insertedData?.length || 0} registros na tabela ${tableName}`)
          }
        }
        
        restoreResults[tableName] = {
          success: errors.length === 0,
          records: insertedCount,
          totalBackupRecords: tableData.length,
          errors: errors.length > 0 ? errors : undefined,
          message: errors.length === 0 ? 'Restaurado com sucesso' : 'Restaurado com alguns erros'
        }
        
        console.log(`📊 Resultado ${tableName}: ${insertedCount}/${tableData.length} registros`)
        
      } catch (tableError: any) {
        console.error(`❌ Erro crítico na tabela ${tableName}:`, tableError)
        restoreResults[tableName] = {
          success: false,
          error: tableError.message,
          records: 0
        }
      }
    }
    
    const endTime = Date.now()
    const duration = (endTime - startTime) / 1000
    
    const totalRestored = Object.values(restoreResults)
      .reduce((sum: number, result: any) => sum + (result.records || 0), 0)
    
    const successfulTables = Object.values(restoreResults)
      .filter((result: any) => result.success).length
    
    console.log('📋 Resumo da restauração:', {
      totalTables: Object.keys(data).length,
      successfulTables,
      totalRestored,
      duration: duration + 's',
      mode
    })
    
    return NextResponse.json({
      success: successfulTables > 0,
      message: `Restauração concluída: ${successfulTables}/${Object.keys(data).length} tabelas`,
      results: restoreResults,
      summary: {
        mode,
        totalTables: Object.keys(data).length,
        successfulTables,
        totalRestored,
        duration: duration + 's',
        backupInfo: {
          timestamp: metadata.timestamp,
          version: metadata.version,
          originalRecords: metadata.totalRecords
        }
      }
    })
    
  } catch (error: any) {
    console.error('❌ Erro fatal ao restaurar backup:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Erro ao restaurar backup',
      message: error.message,
      details: error.stack
    }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Use POST para restaurar backup',
    example: {
      method: 'POST',
      endpoint: '/api/backup/restore',
      body: {
        backupData: '{ metadata: {}, data: {} }',
        mode: 'append | replace',
        confirmReplace: 'true (apenas para mode replace)'
      },
      modes: {
        append: 'Adiciona dados sem apagar existentes (padrão)',
        replace: 'APAGA todos os dados e substitui pelo backup'
      }
    }
  })
}