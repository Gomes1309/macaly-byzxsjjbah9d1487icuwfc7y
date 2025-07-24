-- ============================================
-- SCRIPT FINAL - ZERAR COMPLETAMENTE O BANCO
-- Execute este script no Supabase SQL Editor
-- ============================================

-- 1. DESATIVAR TEMPORARIAMENTE TODAS AS FOREIGN KEYS
SET session_replication_role = 'replica';

-- 2. DELETAR TODOS OS DADOS DE TODAS AS TABELAS
-- (Em qualquer ordem, já que foreign keys estão desabilitadas)

TRUNCATE TABLE IF EXISTS alvaras CASCADE;
TRUNCATE TABLE IF EXISTS clientes CASCADE;
TRUNCATE TABLE IF EXISTS responsaveis CASCADE;
TRUNCATE TABLE IF EXISTS obrigacoes CASCADE;
TRUNCATE TABLE IF EXISTS documentos CASCADE;
TRUNCATE TABLE IF EXISTS users CASCADE;
TRUNCATE TABLE IF EXISTS client_users CASCADE;

-- Deletar também de tabelas de sistema se existirem
DELETE FROM auth.users WHERE email LIKE '%@%';

-- 3. REATIVAR AS FOREIGN KEYS
SET session_replication_role = 'origin';

-- 4. RESETAR AS SEQUENCES DOS IDs (para começar do 1 novamente)
SELECT setval(pg_get_serial_sequence('clientes', 'id'), 1, false);
SELECT setval(pg_get_serial_sequence('alvaras', 'id'), 1, false);
SELECT setval(pg_get_serial_sequence('responsaveis', 'id'), 1, false);
SELECT setval(pg_get_serial_sequence('obrigacoes', 'id'), 1, false);
SELECT setval(pg_get_serial_sequence('documentos', 'id'), 1, false);
SELECT setval(pg_get_serial_sequence('users', 'id'), 1, false);

-- 5. CONFIRMAÇÃO - VERIFICAR SE TUDO ESTÁ VAZIO
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

-- 6. MENSAGEM FINAL
SELECT '🎉 BANCO DE DADOS COMPLETAMENTE ZERADO! 🎉' as resultado;