import { NextResponse } from 'next/server'

export async function POST() {
  try {
    console.log('🔧 Corrigindo estrutura da tabela alvaras...')
    
    // Lista de comandos SQL para corrigir a estrutura
    const repairCommands = [
      // 1. Adicionar as colunas que faltam
      "ALTER TABLE alvaras ADD COLUMN IF NOT EXISTS contato TEXT NOT NULL DEFAULT 'contato@exemplo.com';",
      "ALTER TABLE alvaras ADD COLUMN IF NOT EXISTS responsavel TEXT NOT NULL DEFAULT 'Responsável';",
      
      // 2. Renomear colunas incorretas (se existirem)
      "ALTER TABLE alvaras RENAME COLUMN numero_alvara TO numero_protocolo;",
      "ALTER TABLE alvaras RENAME COLUMN tipo_alvara TO tipo;",
      
      // 3. Remover colunas desnecessárias do schema antigo
      "ALTER TABLE alvaras DROP COLUMN IF EXISTS orgao_emissor;",
      "ALTER TABLE alvaras DROP COLUMN IF EXISTS status;",
      "ALTER TABLE alvaras DROP COLUMN IF EXISTS valor;",
      
      // 4. Ajustar constraints se necessário
      "ALTER TABLE alvaras DROP CONSTRAINT IF EXISTS alvaras_tipo_check;",
      "ALTER TABLE alvaras ADD CONSTRAINT alvaras_tipo_check CHECK (tipo IN ('vigilancia_sanitaria', 'bombeiro', 'municipal'));",
      
      // 5. Criar índices úteis
      "CREATE INDEX IF NOT EXISTS idx_alvaras_cliente_id ON alvaras(cliente_id);",
      "CREATE INDEX IF NOT EXISTS idx_alvaras_data_vencimento ON alvaras(data_vencimento);",
      "CREATE INDEX IF NOT EXISTS idx_alvaras_tipo ON alvaras(tipo);",
      
      // 6. Remover valores padrão temporários
      "ALTER TABLE alvaras ALTER COLUMN contato DROP DEFAULT;",
      "ALTER TABLE alvaras ALTER COLUMN responsavel DROP DEFAULT;"
    ]
    
    return NextResponse.json({
      success: true,
      action: 'SQL_COMMANDS_READY',
      commands: repairCommands,
      instructions: {
        step1: 'Copie os comandos SQL abaixo',
        step2: 'Cole no Supabase SQL Editor',
        step3: 'Execute um por vez ou todos juntos',
        step4: 'Teste a aplicação após execução'
      },
      sqlScript: repairCommands.join('\n\n'),
      warning: '⚠️ Execute no Supabase SQL Editor. Teste primeiro em ambiente de desenvolvimento.',
      note: 'Os valores padrão temporários serão removidos após a adição das colunas.'
    })
    
  } catch (error: any) {
    console.error('❌ Erro:', error)
    return NextResponse.json({
      success: false,
      error: error.message || 'Erro desconhecido'
    })
  }
}

// Endpoint GET para verificar o status
export async function GET() {
  return NextResponse.json({
    message: 'Use POST para obter os comandos de correção da tabela alvaras',
    usage: 'POST /api/repair-alvaras-table'
  })
}