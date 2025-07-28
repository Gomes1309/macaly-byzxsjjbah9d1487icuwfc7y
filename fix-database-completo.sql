-- ===============================================
-- SCRIPT COMPLETO - CORREÇÃO DE TODAS AS TABELAS
-- ===============================================
-- Execute este script no Supabase SQL Editor para corrigir TODOS os problemas

-- ========================================
-- BACKUP DE SEGURANÇA
-- ========================================
-- Fazer backup de todas as tabelas existentes
CREATE TABLE IF NOT EXISTS usuarios_backup AS SELECT * FROM usuarios;
CREATE TABLE IF NOT EXISTS alvaras_backup AS SELECT * FROM alvaras;
CREATE TABLE IF NOT EXISTS clientes_backup AS SELECT * FROM clientes;
CREATE TABLE IF NOT EXISTS responsaveis_backup AS SELECT * FROM responsaveis;
CREATE TABLE IF NOT EXISTS empresas_backup AS SELECT * FROM empresas;

-- ========================================
-- CORREÇÃO DA TABELA USUARIOS
-- ========================================
-- Remover coluna 'cargo' que não é mais usada
ALTER TABLE usuarios DROP COLUMN IF EXISTS cargo;
DROP INDEX IF EXISTS idx_usuarios_cargo;

-- ========================================
-- CORREÇÃO DA TABELA ALVARAS
-- ========================================
-- Adicionar colunas que faltam
ALTER TABLE alvaras ADD COLUMN IF NOT EXISTS contato TEXT NOT NULL DEFAULT 'contato@exemplo.com';
ALTER TABLE alvaras ADD COLUMN IF NOT EXISTS responsavel TEXT NOT NULL DEFAULT 'Responsável Padrão';

-- Renomear colunas para padronizar
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

-- Remover colunas desnecessárias do schema antigo
ALTER TABLE alvaras DROP COLUMN IF EXISTS orgao_emissor;
ALTER TABLE alvaras DROP COLUMN IF EXISTS status;
ALTER TABLE alvaras DROP COLUMN IF EXISTS valor;

-- Ajustar constraints do campo tipo
ALTER TABLE alvaras DROP CONSTRAINT IF EXISTS alvaras_tipo_check;
ALTER TABLE alvaras ADD CONSTRAINT alvaras_tipo_check 
    CHECK (tipo IN ('vigilancia_sanitaria', 'bombeiro', 'municipal'));

-- Remover valores padrão temporários
ALTER TABLE alvaras ALTER COLUMN contato DROP DEFAULT;
ALTER TABLE alvaras ALTER COLUMN responsavel DROP DEFAULT;

-- ========================================
-- CRIAÇÃO DE ÍNDICES OTIMIZADOS
-- ========================================

-- Índices para usuarios (SEM cargo)
CREATE INDEX IF NOT EXISTS idx_usuarios_email ON usuarios(email);
CREATE INDEX IF NOT EXISTS idx_usuarios_departamento ON usuarios(departamento);
CREATE INDEX IF NOT EXISTS idx_usuarios_status ON usuarios(status);

-- Índices para alvaras
CREATE INDEX IF NOT EXISTS idx_alvaras_cliente_id ON alvaras(cliente_id);
CREATE INDEX IF NOT EXISTS idx_alvaras_data_vencimento ON alvaras(data_vencimento);
CREATE INDEX IF NOT EXISTS idx_alvaras_tipo ON alvaras(tipo);
CREATE INDEX IF NOT EXISTS idx_alvaras_cnpj ON alvaras(cnpj);

-- Índices para clientes
CREATE INDEX IF NOT EXISTS idx_clientes_email ON clientes(email);
CREATE INDEX IF NOT EXISTS idx_clientes_cpf_cnpj ON clientes(cpf_cnpj);
CREATE INDEX IF NOT EXISTS idx_clientes_status ON clientes(status);

-- ========================================
-- VERIFICAÇÃO FINAL
-- ========================================

-- Verificar estrutura da tabela usuarios (sem cargo)
SELECT 'USUARIOS - Estrutura Final:' as tabela;
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'usuarios' 
ORDER BY ordinal_position;

-- Verificar estrutura da tabela alvaras (com contato e responsavel)
SELECT 'ALVARAS - Estrutura Final:' as tabela;
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'alvaras' 
ORDER BY ordinal_position;

-- ========================================
-- RESULTADO ESPERADO:
-- ========================================
-- ✅ USUARIOS: id, nome, email, departamento, permissoes, status, ultimo_acesso, created_at, updated_at
-- ✅ ALVARAS: id, created_at, updated_at, cliente_id, empresa, cnpj, tipo, numero_protocolo, data_emissao, data_vencimento, observacoes, contato, responsavel
-- ✅ Ambas as tabelas funcionando perfeitamente com o frontend

-- 🎉 PROBLEMAS RESOLVIDOS:
-- 🔧 Erro "cargo required" ao criar usuários
-- 🔧 Erro "contato column not found" nos alvarás
-- 🔧 Estrutura do banco alinhada com o frontend