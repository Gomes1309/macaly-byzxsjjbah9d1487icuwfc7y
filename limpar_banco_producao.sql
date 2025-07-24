-- Script para limpar todos os dados do banco e preparar para produção
-- Execute este script no Supabase SQL Editor

-- ATENÇÃO: Este script irá deletar TODOS os dados das tabelas!
-- Use apenas para preparar o sistema para produção com banco limpo

BEGIN;

-- Desabilitar verificações de chave estrangeira temporariamente
SET session_replication_role = replica;

-- Limpar todas as tabelas na ordem correta (respeitando foreign keys)
-- 1. Limpar tabelas dependentes primeiro
TRUNCATE TABLE IF EXISTS documentos CASCADE;
TRUNCATE TABLE IF EXISTS alvaras CASCADE; 
TRUNCATE TABLE IF EXISTS obrigacoes CASCADE;
TRUNCATE TABLE IF EXISTS responsaveis CASCADE;

-- 2. Limpar tabela principal
TRUNCATE TABLE IF EXISTS clientes CASCADE;

-- 3. Limpar outras tabelas se existirem
TRUNCATE TABLE IF EXISTS empresas CASCADE;
TRUNCATE TABLE IF EXISTS usuarios CASCADE;

-- Reabilitar verificações de chave estrangeira  
SET session_replication_role = DEFAULT;

-- Reset sequences (auto increment)
-- Ajustar conforme as sequences existentes no seu banco
SELECT setval(pg_get_serial_sequence('clientes', 'id'), 1, false);
SELECT setval(pg_get_serial_sequence('documentos', 'id'), 1, false);  
SELECT setval(pg_get_serial_sequence('alvaras', 'id'), 1, false);
SELECT setval(pg_get_serial_sequence('obrigacoes', 'id'), 1, false);

-- Verificar se as tabelas estão vazias
SELECT 'clientes' as tabela, count(*) as registros FROM clientes
UNION ALL
SELECT 'documentos' as tabela, count(*) as registros FROM documentos  
UNION ALL
SELECT 'alvaras' as tabela, count(*) as registros FROM alvaras
UNION ALL
SELECT 'obrigacoes' as tabela, count(*) as registros FROM obrigacoes;

COMMIT;

-- Mensagem final
SELECT '✅ BANCO DE DADOS LIMPO COM SUCESSO!' as status,
       '🚀 Sistema pronto para produção' as mensagem;

/* 
INSTRUÇÕES DE USO:
==================

1. Abra o Supabase Dashboard
2. Vá para SQL Editor
3. Cole este script
4. Execute o script
5. Verifique se todas as tabelas estão com 0 registros

IMPORTANTE:
- Este script remove TODOS os dados
- Use apenas para preparar produção
- Faça backup antes se necessário
- O sistema ficará completamente limpo

APÓS EXECUTAR:
- Sistema pronto para receber dados reais
- Dashboard mostrará valores zerados
- Todas as funcionalidades operacionais
*/