-- ===============================================
-- CORREÇÃO SIMPLES DA TABELA USUARIOS
-- ===============================================
-- Execute este script linha por linha no SQL Editor do Supabase

-- 1. BACKUP (IMPORTANTE - Execute primeiro)
CREATE TABLE usuarios_backup_simples AS SELECT * FROM usuarios;

-- 2. ADICIONAR COLUNAS NECESSÁRIAS
ALTER TABLE usuarios ADD COLUMN departamento TEXT DEFAULT 'Geral';
ALTER TABLE usuarios ADD COLUMN permissoes JSONB DEFAULT '{}';
ALTER TABLE usuarios ADD COLUMN ultimo_acesso TIMESTAMP WITH TIME ZONE;

-- 3. AJUSTAR COLUNA STATUS (se não existir)
ALTER TABLE usuarios ADD COLUMN status TEXT DEFAULT 'ativo';

-- 4. DEFINIR VALORES PADRÃO PARA REGISTROS EXISTENTES
UPDATE usuarios SET departamento = 'Geral' WHERE departamento IS NULL;
UPDATE usuarios SET permissoes = '{}' WHERE permissoes IS NULL;
UPDATE usuarios SET status = 'ativo' WHERE status IS NULL;

-- 5. TORNAR COLUNAS OBRIGATÓRIAS
ALTER TABLE usuarios ALTER COLUMN departamento SET NOT NULL;
ALTER TABLE usuarios ALTER COLUMN permissoes SET NOT NULL;
ALTER TABLE usuarios ALTER COLUMN status SET NOT NULL;

-- 6. REMOVER COLUNAS DESNECESSÁRIAS (se existirem)
ALTER TABLE usuarios DROP COLUMN IF EXISTS cargo;
ALTER TABLE usuarios DROP COLUMN IF EXISTS senha_hash;
ALTER TABLE usuarios DROP COLUMN IF EXISTS tipo_usuario;

-- 7. CRIAR ÍNDICES
CREATE INDEX IF NOT EXISTS idx_usuarios_departamento ON usuarios(departamento);
CREATE INDEX IF NOT EXISTS idx_usuarios_status ON usuarios(status);

-- 8. VERIFICAÇÃO FINAL
SELECT 'Estrutura da tabela usuarios:' as verificacao;
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'usuarios' 
ORDER BY ordinal_position;