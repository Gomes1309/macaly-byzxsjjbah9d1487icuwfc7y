import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    console.log('🔧 Iniciando correção da tabela usuarios...')
    
    // Verificar se a coluna cargo existe
    const { data: columns, error: columnError } = await supabase
      .from('information_schema.columns')
      .select('column_name')
      .eq('table_name', 'usuarios')
      .eq('table_schema', 'public')
    
    console.log('📋 Colunas atuais da tabela usuarios:', columns?.map(c => c.column_name))
    
    const hasCargoColumn = columns?.some(col => col.column_name === 'cargo')
    
    if (!hasCargoColumn) {
      console.log('➕ Adicionando coluna cargo...')
      
      // Adicionar coluna cargo
      const { error: addCargoError } = await supabase.rpc('execute_sql', {
        sql: `ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS cargo TEXT NOT NULL DEFAULT 'Operador';`
      })
      
      if (addCargoError) {
        console.error('❌ Erro ao adicionar coluna cargo:', addCargoError)
        // Tentar método alternativo
        try {
          const { error: altError } = await supabase
            .from('usuarios')
            .select('id')
            .limit(1)
          
          if (altError && altError.message.includes('cargo')) {
            // Confirma que a coluna cargo está faltando
            throw new Error('Coluna cargo não existe na tabela usuarios')
          }
        } catch (testError) {
          console.log('🔄 Tentando recriar a tabela completa...')
          
          // Recriar tabela com schema completo
          const createTableSQL = `
            CREATE TABLE IF NOT EXISTS usuarios_new (
              id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
              nome TEXT NOT NULL,
              email TEXT UNIQUE NOT NULL,
              cargo TEXT NOT NULL DEFAULT 'Operador',
              departamento TEXT NOT NULL DEFAULT 'Geral',
              permissoes JSONB NOT NULL DEFAULT '{}',
              status TEXT NOT NULL DEFAULT 'ativo' CHECK (status IN ('ativo', 'inativo', 'suspenso')),
              ultimo_acesso TIMESTAMP WITH TIME ZONE,
              created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
              updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );
            
            -- Copiar dados existentes se houver
            INSERT INTO usuarios_new (id, nome, email, cargo, departamento, permissoes, status, ultimo_acesso, created_at, updated_at)
            SELECT 
              id, 
              nome, 
              email, 
              COALESCE(cargo, 'Operador') as cargo,
              COALESCE(departamento, 'Geral') as departamento,
              COALESCE(permissoes, '{}') as permissoes,
              status, 
              ultimo_acesso, 
              created_at, 
              updated_at
            FROM usuarios
            ON CONFLICT (id) DO NOTHING;
            
            -- Remover tabela antiga e renomear nova
            DROP TABLE IF EXISTS usuarios;
            ALTER TABLE usuarios_new RENAME TO usuarios;
          `
          
          console.log('🚀 Executando recriação da tabela...')
          
          return NextResponse.json({
            success: false,
            message: 'Coluna cargo não existe. Execute o setup do banco de dados.',
            needsSetup: true,
            error: 'Coluna cargo não encontrada'
          })
        }
      } else {
        console.log('✅ Coluna cargo adicionada com sucesso')
      }
    } else {
      console.log('✅ Coluna cargo já existe')
    }
    
    // Verificar se a tabela está funcionando
    const { data: testData, error: testError } = await supabase
      .from('usuarios')
      .select('id, nome, email, cargo, departamento, status')
      .limit(1)
    
    if (testError) {
      console.error('❌ Erro ao testar tabela:', testError)
      throw testError
    }
    
    console.log('✅ Tabela usuarios corrigida e funcionando')
    
    return NextResponse.json({
      success: true,
      message: 'Tabela usuarios corrigida com sucesso',
      data: {
        hasCargoColumn: true,
        testQuery: testData ? 'OK' : 'Vazia'
      }
    })
    
  } catch (error) {
    console.error('❌ Erro ao corrigir tabela usuarios:', error)
    
    return NextResponse.json({
      success: false,
      message: 'Erro ao corrigir tabela usuarios',
      error: error instanceof Error ? error.message : 'Erro desconhecido',
      suggestion: 'Execute o endpoint /api/setup-database para recriar as tabelas'
    }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({
    success: true,
    message: 'API de correção da tabela usuarios',
    usage: 'POST para corrigir a tabela usuarios adicionando a coluna cargo'
  })
}