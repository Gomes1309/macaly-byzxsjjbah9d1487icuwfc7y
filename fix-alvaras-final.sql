-- ===============================================
-- CORREÇÃO DEFINITIVA DA TABELA ALVARAS
-- ===============================================
-- Execute este script no Supabase SQL Editor

-- 1. Fazer backup da tabela atual
CREATE TABLE IF NOT EXISTS alvaras_backup AS SELECT * FROM alvaras;

-- 2. Adicionar as colunas que faltam
ALTER TABLE alvaras ADD COLUMN IF NOT EXISTS contato TEXT NOT NULL DEFAULT 'contato@exemplo.com';
ALTER TABLE alvaras ADD COLUMN IF NOT EXISTS responsavel TEXT NOT NULL DEFAULT 'Responsável Padrão';

-- 3. Corrigir nomes de colunas (renomear)
DO $$
BEGIN
    -- Verificar se a coluna numero_alvara existe e renomear para numero_protocolo
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'alvaras' AND column_name = 'numero_alvara') THEN
        ALTER TABLE alvaras RENAME COLUMN numero_alvara TO numero_protocolo;
    END IF;
    
    -- Verificar se a coluna tipo_alvara existe e renomear para tipo
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'alvaras' AND column_name = 'tipo_alvara') THEN
        ALTER TABLE alvaras RENAME COLUMN tipo_alvara TO tipo;
    END IF;
END $$;

-- 4. Remover colunas desnecessárias do schema antigo
ALTER TABLE alvaras DROP COLUMN IF EXISTS orgao_emissor;
ALTER TABLE alvaras DROP COLUMN IF EXISTS status;
ALTER TABLE alvaras DROP COLUMN IF EXISTS valor;

-- 5. Ajustar constraints do campo tipo
ALTER TABLE alvaras DROP CONSTRAINT IF EXISTS alvaras_tipo_check;
ALTER TABLE alvaras ADD CONSTRAINT alvaras_tipo_check 
    CHECK (tipo IN ('vigilancia_sanitaria', 'bombeiro', 'municipal'));

-- 6. Criar índices úteis
CREATE INDEX IF NOT EXISTS idx_alvaras_cliente_id ON alvaras(cliente_id);
CREATE INDEX IF NOT EXISTS idx_alvaras_data_vencimento ON alvaras(data_vencimento);
CREATE INDEX IF NOT EXISTS idx_alvaras_tipo ON alvaras(tipo);

-- 7. Remover valores padrão temporários
ALTER TABLE alvaras ALTER COLUMN contato DROP DEFAULT;
ALTER TABLE alvaras ALTER COLUMN responsavel DROP DEFAULT;

-- 8. Verificação final
SELECT 
    column_name, 
    data_type, 
    is_nullable 
FROM information_schema.columns 
WHERE table_name = 'alvaras' 
ORDER BY ordinal_position;

-- ✅ Após executar, você deve ver as colunas: 
-- id, created_at, updated_at, cliente_id, empresa, cnpj, 
-- tipo, numero_protocolo, data_emissao, data_vencimento, 
-- observacoes, contato, responsavel