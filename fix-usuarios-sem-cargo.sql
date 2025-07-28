-- ===============================================
-- CORREÇÃO DA TABELA USUARIOS - REMOVER CARGO
-- ===============================================
-- Execute este script no Supabase SQL Editor

-- 1. Fazer backup da tabela atual
CREATE TABLE IF NOT EXISTS usuarios_backup AS SELECT * FROM usuarios;

-- 2. Remover a coluna 'cargo' da tabela usuarios
-- (A coluna está sendo removida porque o frontend não usa mais esse campo)
ALTER TABLE usuarios DROP COLUMN IF EXISTS cargo;

-- 3. Remover índice relacionado ao cargo (se existir)
DROP INDEX IF EXISTS idx_usuarios_cargo;

-- 4. Verificação final - mostrar estrutura da tabela
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'usuarios' 
ORDER BY ordinal_position;

-- ✅ Após executar, a tabela usuarios deve ter apenas:
-- id, nome, email, departamento, permissoes, status, ultimo_acesso, created_at, updated_at
-- (SEM a coluna 'cargo')

-- 🔧 MOTIVO DA CORREÇÃO:
-- O frontend foi atualizado para não incluir mais o campo 'cargo' no cadastro
-- Mas o banco ainda exigia esse campo como NOT NULL
-- Isso causava erro ao tentar criar novos usuários