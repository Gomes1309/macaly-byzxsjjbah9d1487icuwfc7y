import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET() {
  try {
    console.log('🔧 Verificando e corrigindo estrutura da tabela alvaras...')
    
    // 1. Primeiro, vamos tentar descobrir a estrutura atual através de SQL
    console.log('📋 Verificando estrutura atual...')
    
    // Fazer um SELECT em uma tabela que provavelmente não tem dados mas existe,
    // para forçar o Supabase a nos dar informações sobre as colunas
    const { data: currentData, error: currentError } = await supabase
      .from('alvaras')
      .select('*')
      .limit(1)
    
    console.log('Resultado consulta atual:', { data: currentData, error: currentError })
    
    // 2. Como a consulta com 'contato' falha, vamos tentar campos que sabemos que provavelmente existem
    let currentStructure: any = {}
    
    // Testar campos um por um
    const possibleFields = [
      'id', 'created_at', 'updated_at',
      'cliente_id', 'numero_alvara', 'tipo_alvara', 
      'orgao_emissor', 'data_emissao', 'data_vencimento',
      'status', 'valor', 'observacoes',
      // Campos esperados:
      'empresa', 'cnpj', 'tipo', 'numero_protocolo', 
      'responsavel', 'contato'
    ]
    
    for (const field of possibleFields) {
      try {
        const { data, error } = await supabase
          .from('alvaras')
          .select(field)
          .limit(1)
        
        if (!error) {
          currentStructure[field] = '✅ EXISTS'
          console.log(`✅ Campo ${field} existe`)
        } else {
          currentStructure[field] = `❌ ${error.message}`
          console.log(`❌ Campo ${field} não existe: ${error.message}`)
        }
      } catch (e) {
        currentStructure[field] = `❌ ERROR: ${e}`
      }
    }
    
    // 3. Se a tabela tem a estrutura errada, vamos corrigi-la
    console.log('🔧 Aplicando correção da estrutura...')
    
    // SQL para recriar a tabela com a estrutura correta
    const correctionSQL = `
      -- Backup da tabela atual se houver dados
      CREATE TABLE IF NOT EXISTS alvaras_backup AS SELECT * FROM alvaras;
      
      -- Remover a tabela atual
      DROP TABLE IF EXISTS alvaras CASCADE;
      
      -- Recriar a tabela com a estrutura correta
      CREATE TABLE alvaras (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        empresa TEXT NOT NULL,
        cnpj TEXT NOT NULL,
        tipo TEXT NOT NULL CHECK (tipo IN ('vigilancia_sanitaria', 'bombeiro', 'municipal')),
        numero_protocolo TEXT NOT NULL,
        data_emissao DATE NOT NULL,
        data_vencimento DATE NOT NULL,
        observacoes TEXT,
        responsavel TEXT NOT NULL,
        contato TEXT NOT NULL,
        cliente_id UUID REFERENCES clientes(id) ON DELETE SET NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
      
      -- Se havia dados na tabela antiga, tentar migrar o que for possível
      -- (isso só funcionará se houver campos compatíveis)
      INSERT INTO alvaras (id, created_at, updated_at, cliente_id, observacoes)
      SELECT id, created_at, updated_at, cliente_id, observacoes 
      FROM alvaras_backup 
      WHERE id IS NOT NULL
      ON CONFLICT (id) DO NOTHING;
      
      -- Criar índices
      CREATE INDEX IF NOT EXISTS idx_alvaras_cliente_id ON alvaras(cliente_id);
      CREATE INDEX IF NOT EXISTS idx_alvaras_data_vencimento ON alvaras(data_vencimento);
      CREATE INDEX IF NOT EXISTS idx_alvaras_tipo ON alvaras(tipo);
    `
    
    // Executar a correção via RPC se possível, ou recomendar execução manual
    return NextResponse.json({
      success: true,
      currentStructure: currentStructure,
      analysis: {
        hasCorrectStructure: currentStructure.contato === '✅ EXISTS',
        missingFields: Object.keys(currentStructure).filter(key => 
          !currentStructure[key].includes('✅')
        ),
        existingFields: Object.keys(currentStructure).filter(key => 
          currentStructure[key].includes('✅')
        )
      },
      recommendedAction: {
        type: 'RECREATE_TABLE',
        sql: correctionSQL,
        warning: 'ATENÇÃO: Este SQL irá recriar a tabela. Execute no Supabase SQL Editor.',
        backupNote: 'Os dados existentes serão preservados em alvaras_backup.'
      },
      message: 'Estrutura da tabela alvaras analisada. Veja recommendedAction para correção.'
    })
    
  } catch (error: any) {
    console.error('❌ Erro geral:', error)
    return NextResponse.json({
      success: false,
      error: error.message || 'Erro desconhecido',
      details: error
    })
  }
}