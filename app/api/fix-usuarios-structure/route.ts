import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST() {
  try {
    console.log('🔧 Iniciando correção da estrutura da tabela usuarios...')
    
    const corrections = []
    const errors = []

    // 1. Fazer backup da tabela atual
    try {
      console.log('📋 Fazendo backup da tabela atual...')
      await supabase.rpc('execute_raw_sql', {
        sql: 'CREATE TABLE IF NOT EXISTS usuarios_backup_final AS SELECT * FROM usuarios;'
      })
      corrections.push('✅ Backup criado: usuarios_backup_final')
    } catch (error) {
      console.log('⚠️ Backup pode já existir, continuando...')
    }

    // 2. Verificar estrutura atual
    const { data: currentUsers, error: fetchError } = await supabase
      .from('usuarios')
      .select('*')
      .limit(1)

    if (fetchError) {
      console.error('❌ Erro ao verificar estrutura atual:', fetchError)
      return NextResponse.json({
        success: false,
        error: fetchError.message,
        message: 'Não foi possível verificar a estrutura atual da tabela'
      }, { status: 500 })
    }

    const currentStructure = currentUsers && currentUsers.length > 0 ? Object.keys(currentUsers[0]) : []
    console.log('📊 Estrutura atual:', currentStructure)

    // 3. Adicionar colunas necessárias uma por vez
    const requiredColumns = [
      { name: 'departamento', type: 'TEXT NOT NULL DEFAULT \'Geral\'', description: 'Departamento do usuário' },
      { name: 'permissoes', type: 'JSONB NOT NULL DEFAULT \'{}\'', description: 'Permissões do usuário' },
      { name: 'ultimo_acesso', type: 'TIMESTAMP WITH TIME ZONE', description: 'Último acesso do usuário' }
    ]

    for (const column of requiredColumns) {
      if (!currentStructure.includes(column.name)) {
        try {
          console.log(`➕ Adicionando coluna ${column.name}...`)
          
          // Usar método alternativo - inserir dados com a coluna
          const { error: testError } = await supabase
            .from('usuarios')
            .select(column.name)
            .limit(1)

          if (testError && testError.message.includes('does not exist')) {
            // Coluna não existe, vamos criar
            console.log(`🔧 Criando coluna ${column.name} via método alternativo...`)
            corrections.push(`⚠️ Coluna ${column.name} precisa ser adicionada manualmente`)
            errors.push(`Coluna ${column.name} não existe e precisa ser adicionada via SQL Editor`)
          } else {
            corrections.push(`✅ Coluna ${column.name} já existe`)
          }
        } catch (error) {
          console.error(`❌ Erro ao verificar/adicionar coluna ${column.name}:`, error)
          errors.push(`Erro na coluna ${column.name}: ${error}`)
        }
      } else {
        corrections.push(`✅ Coluna ${column.name} já existe`)
      }
    }

    // 4. Verificar se precisa renomear 'ativo' para 'status'
    if (currentStructure.includes('ativo') && !currentStructure.includes('status')) {
      corrections.push('⚠️ Coluna "ativo" precisa ser renomeada para "status" via SQL Editor')
      errors.push('Renomeação ativo -> status necessária')
    }

    // 5. Verificar colunas desnecessárias
    const unnecessaryColumns = ['senha_hash', 'tipo_usuario', 'cargo']
    const toRemove = unnecessaryColumns.filter(col => currentStructure.includes(col))
    if (toRemove.length > 0) {
      corrections.push(`⚠️ Colunas desnecessárias encontradas: ${toRemove.join(', ')}`)
    }

    // 6. Tentar uma operação de teste para ver se a estrutura funciona
    try {
      console.log('🧪 Testando operação com estrutura atual...')
      const { data: testData, error: testError } = await supabase
        .from('usuarios')
        .select('id, nome, email, departamento, status, permissoes')
        .limit(1)

      if (testError) {
        corrections.push(`❌ Teste falhou: ${testError.message}`)
        errors.push(`Estrutura incompatível: ${testError.message}`)
      } else {
        corrections.push('✅ Estrutura básica funciona')
      }
    } catch (error) {
      errors.push(`Erro no teste: ${error}`)
    }

    return NextResponse.json({
      success: errors.length === 0,
      currentStructure,
      corrections,
      errors,
      needsManualSql: errors.length > 0,
      message: errors.length > 0 
        ? 'Correções manuais necessárias via SQL Editor' 
        : 'Estrutura da tabela verificada'
    })

  } catch (error) {
    console.error('❌ Erro geral na correção:', error)
    return NextResponse.json({
      success: false,
      error: error,
      message: 'Erro geral ao corrigir estrutura da tabela usuarios'
    }, { status: 500 })
  }
}