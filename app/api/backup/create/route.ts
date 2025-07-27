import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    console.log('🔄 Iniciando criação de backup completo do banco de dados')
    
    const startTime = Date.now()
    const backupTimestamp = new Date().toISOString().replace(/[:.]/g, '-')
    
    // Lista das tabelas principais do sistema
    const tables = [
      'usuarios',
      'clientes', 
      'empresas',
      'documento',
      'obrigacoes',
      'alvaras',
      'responsaveis',
      'responsavel_cliente'
    ]
    
    const backupData: Record<string, any[]> = {}
    const backupMetadata = {
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      tables: {} as Record<string, any>,
      totalRecords: 0,
      duration: '',
      size: 0
    }
    
    // Fazer backup de cada tabela
    for (const table of tables) {
      try {
        console.log(`📊 Fazendo backup da tabela: ${table}`)
        
        const { data, error, count } = await supabaseAdmin
          .from(table)
          .select('*', { count: 'exact' })
        
        if (error) {
          console.error(`❌ Erro ao fazer backup da tabela ${table}:`, error)
          throw new Error(`Erro na tabela ${table}: ${error.message}`)
        }
        
        backupData[table] = data || []
        backupMetadata.tables[table] = {
          records: data?.length || 0,
          backupTime: new Date().toISOString()
        }
        backupMetadata.totalRecords += data?.length || 0
        
        console.log(`✅ Backup da tabela ${table}: ${data?.length || 0} registros`)
        
      } catch (tableError) {
        console.error(`❌ Erro crítico na tabela ${table}:`, tableError)
        // Continuar com outras tabelas mesmo se uma falhar
        backupData[table] = []
        backupMetadata.tables[table] = {
          records: 0,
          error: `Erro: ${tableError.message}`,
          backupTime: new Date().toISOString()
        }
      }
    }
    
    const endTime = Date.now()
    const duration = (endTime - startTime) / 1000
    
    backupMetadata.duration = `${duration}s`
    backupMetadata.size = JSON.stringify(backupData).length
    
    const completeBackup = {
      metadata: backupMetadata,
      data: backupData
    }
    
    console.log('📋 Resumo do backup:', {
      totalTables: tables.length,
      totalRecords: backupMetadata.totalRecords,
      duration: duration + 's',
      size: (backupMetadata.size / 1024 / 1024).toFixed(2) + ' MB'
    })
    
    return NextResponse.json({
      success: true,
      message: 'Backup criado com sucesso',
      metadata: backupMetadata,
      backup: completeBackup,
      downloadName: `backup-agassessoria-${backupTimestamp}.json`,
      summary: {
        tables: tables.length,
        records: backupMetadata.totalRecords,
        duration: duration + 's',
        size: (backupMetadata.size / 1024 / 1024).toFixed(2) + ' MB'
      }
    })
    
  } catch (error: any) {
    console.error('❌ Erro fatal ao criar backup:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Erro ao criar backup',
      message: error.message,
      details: error.stack
    }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Use POST para criar backup',
    example: {
      method: 'POST',
      endpoint: '/api/backup/create',
      description: 'Cria um backup completo do banco de dados'
    }
  })
}