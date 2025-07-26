-- ===============================================
-- CORREÇÃO DA TABELA USUARIOS - PASSO A PASSO
-- ===============================================
-- Execute UM comando por vez no SQL Editor do Supabase
-- Se der erro, pare e me informe qual linha deu erro

-- PASSO 1: Ver estrutura atual (para diagnóstico)
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'usuarios' 
ORDER BY ordinal_position;

-- PASSO 2: Backup da tabela (IMPORTANTE)
-- CREATE TABLE usuarios_backup_passo_a_passo AS SELECT * FROM usuarios;

-- PASSO 3: Adicionar coluna departamento
-- ALTER TABLE usuarios ADD COLUMN departamento TEXT;

-- PASSO 4: Adicionar coluna permissoes  
-- ALTER TABLE usuarios ADD COLUMN permissoes JSONB;

-- PASSO 5: Adicionar coluna status
-- ALTER TABLE usuarios ADD COLUMN status TEXT;

-- PASSO 6: Adicionar coluna ultimo_acesso
-- ALTER TABLE usuarios ADD COLUMN ultimo_acesso TIMESTAMP WITH TIME ZONE;

-- PASSO 7: Preencher dados padrão
-- UPDATE usuarios SET departamento = 'Geral' WHERE departamento IS NULL;

-- PASSO 8: Preencher permissões padrão
-- UPDATE usuarios SET permissoes = '{}' WHERE permissoes IS NULL;

-- PASSO 9: Preencher status padrão
-- UPDATE usuarios SET status = 'ativo' WHERE status IS NULL;

-- PASSO 10: Tornar colunas obrigatórias
-- ALTER TABLE usuarios ALTER COLUMN departamento SET NOT NULL;
-- ALTER TABLE usuarios ALTER COLUMN permissoes SET NOT NULL;
-- ALTER TABLE usuarios ALTER COLUMN status SET NOT NULL;

-- PASSO 11: Remover coluna cargo (se existir)
-- ALTER TABLE usuarios DROP COLUMN IF EXISTS cargo;

-- PASSO 12: Verificação final
-- SELECT * FROM usuarios LIMIT 3;