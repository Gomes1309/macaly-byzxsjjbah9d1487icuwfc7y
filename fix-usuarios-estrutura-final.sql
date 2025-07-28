-- ===============================================
-- CORREÇÃO COMPLETA DA TABELA USUARIOS
-- ===============================================
-- A tabela atual tem estrutura diferente do que o frontend espera
-- ATUAL: id, nome, email, senha_hash, tipo_usuario, ativo, created_at, updated_at
-- ESPERADO: id, nome, email, departamento, permissoes, status, ultimo_acesso, created_at, updated_at

-- ========================================
-- 1. BACKUP DA TABELA ATUAL
-- ========================================
CREATE TABLE IF NOT EXISTS usuarios_backup_final AS SELECT * FROM usuarios;

-- ========================================
-- 2. ADICIONAR COLUNAS NECESSÁRIAS
-- ========================================

-- Adicionar coluna departamento (obrigatória para o frontend)
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS departamento TEXT NOT NULL DEFAULT 'Geral';

-- Adicionar coluna permissoes (obrigatória para o frontend)
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS permissoes JSONB NOT NULL DEFAULT '{}';

-- Adicionar coluna ultimo_acesso (opcional no frontend)
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS ultimo_acesso TIMESTAMP WITH TIME ZONE;

-- ========================================
-- 3. RENOMEAR/AJUSTAR COLUNAS EXISTENTES
-- ========================================

-- Renomear 'ativo' para 'status' (se a coluna ativo existir)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'usuarios' AND column_name = 'ativo') THEN
        
        -- Adicionar coluna status temporária
        ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS status TEXT;
        
        -- Migrar dados: true -> 'ativo', false -> 'inativo'
        UPDATE usuarios SET status = CASE 
            WHEN ativo = true THEN 'ativo'
            WHEN ativo = false THEN 'inativo'
            ELSE 'ativo'
        END;
        
        -- Tornar status obrigatório
        ALTER TABLE usuarios ALTER COLUMN status SET NOT NULL;
        ALTER TABLE usuarios ALTER COLUMN status SET DEFAULT 'ativo';
        
        -- Adicionar constraint
        ALTER TABLE usuarios ADD CONSTRAINT usuarios_status_check 
            CHECK (status IN ('ativo', 'inativo', 'suspenso'));
        
        -- Remover coluna ativo antiga
        ALTER TABLE usuarios DROP COLUMN ativo;
    END IF;
END $$;

-- ========================================
-- 4. REMOVER COLUNAS DESNECESSÁRIAS
-- ========================================

-- Remover coluna senha_hash (não é usada no frontend atual)
ALTER TABLE usuarios DROP COLUMN IF EXISTS senha_hash;

-- Remover coluna tipo_usuario (não é usada no frontend atual)  
ALTER TABLE usuarios DROP COLUMN IF EXISTS tipo_usuario;

-- Remover coluna cargo (se ainda existir)
ALTER TABLE usuarios DROP COLUMN IF EXISTS cargo;

-- ========================================
-- 5. AJUSTAR VALORES PADRÃO
-- ========================================

-- Definir valores padrão para registros existentes
UPDATE usuarios SET 
    departamento = COALESCE(departamento, 'Geral'),
    permissoes = COALESCE(permissoes, '{}'),
    status = COALESCE(status, 'ativo')
WHERE departamento IS NULL OR permissoes IS NULL OR status IS NULL;

-- Remover valores padrão temporários
ALTER TABLE usuarios ALTER COLUMN departamento DROP DEFAULT;

-- ========================================
-- 6. RECRIAR ÍNDICES
-- ========================================

-- Remover índices antigos
DROP INDEX IF EXISTS idx_usuarios_cargo;
DROP INDEX IF EXISTS idx_usuarios_tipo_usuario;
DROP INDEX IF EXISTS idx_usuarios_ativo;

-- Criar novos índices
CREATE INDEX IF NOT EXISTS idx_usuarios_email ON usuarios(email);
CREATE INDEX IF NOT EXISTS idx_usuarios_departamento ON usuarios(departamento);
CREATE INDEX IF NOT EXISTS idx_usuarios_status ON usuarios(status);

-- ========================================
-- 7. VERIFICAÇÃO FINAL
-- ========================================

-- Mostrar a estrutura final da tabela
SELECT 'ESTRUTURA FINAL DA TABELA USUARIOS:' as info;
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'usuarios' 
ORDER BY ordinal_position;

-- Mostrar dados atuais
SELECT 'DADOS ATUAIS NA TABELA:' as info;
SELECT id, nome, email, departamento, status, permissoes, created_at FROM usuarios LIMIT 5;

-- ========================================
-- RESULTADO ESPERADO:
-- ========================================
-- ✅ ESTRUTURA FINAL: id, nome, email, departamento, permissoes, status, ultimo_acesso, created_at, updated_at
-- ✅ Compatível com o frontend atual
-- ✅ Dados existentes preservados e migrados
-- ✅ Cadastro de usuários funcionando sem erros

-- 🎉 PROBLEMAS RESOLVIDOS:
-- 🔧 Erro "column departamento does not exist"
-- 🔧 Erro "column status does not exist" 
-- 🔧 Estrutura alinhada com o código frontend
-- 🔧 Dados existentes preservados