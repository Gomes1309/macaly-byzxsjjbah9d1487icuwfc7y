-- ============================================
-- SCRIPT SUPER SIMPLES - DELETAR APENAS DADOS
-- Execute este script no Supabase SQL Editor
-- ============================================

-- 1. DELETAR TODOS OS DADOS DAS TABELAS (SE EXISTIREM)
-- A ordem é importante por causa das foreign keys

-- Primeiro as tabelas dependentes
DELETE FROM client_users;
DELETE FROM documentos;
DELETE FROM obrigacoes;
DELETE FROM alvaras;
DELETE FROM responsaveis;

-- Por último a tabela principal
DELETE FROM clientes;
DELETE FROM users;

-- Mensagem de confirmação
SELECT 'TODOS OS DADOS FORAM DELETADOS!' as resultado;

-- Verificar se ficou vazio
SELECT 
    'clientes' as tabela, 
    COUNT(*) as registros 
FROM clientes
UNION ALL
SELECT 
    'alvaras' as tabela, 
    COUNT(*) as registros 
FROM alvaras
UNION ALL
SELECT 
    'responsaveis' as tabela, 
    COUNT(*) as registros 
FROM responsaveis
UNION ALL
SELECT 
    'obrigacoes' as tabela, 
    COUNT(*) as registros 
FROM obrigacoes
UNION ALL
SELECT 
    'documentos' as tabela, 
    COUNT(*) as registros 
FROM documentos
UNION ALL
SELECT 
    'users' as tabela, 
    COUNT(*) as registros 
FROM users
UNION ALL
SELECT 
    'client_users' as tabela, 
    COUNT(*) as registros 
FROM client_users;