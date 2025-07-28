-- ========================================
-- SCRIPT PARA LIMPAR APENAS OS DADOS
-- ========================================
-- Use este script se as tabelas já existem e você quer apenas remover os dados
-- CUIDADO: Este script apaga TODOS OS DADOS das tabelas

-- Desabilitar verificações de chave estrangeira temporariamente
SET session_replication_role = replica;

-- Limpar todas as tabelas (na ordem correta para evitar conflitos de FK)
DELETE FROM obrigacoes;
DELETE FROM documentos;
DELETE FROM empresas;
DELETE FROM responsavel_cliente;
DELETE FROM responsaveis;
DELETE FROM clientes;
DELETE FROM usuarios;
DELETE FROM alvaras;

-- Reabilitar verificações de chave estrangeira
SET session_replication_role = DEFAULT;

-- Resetar sequências (se existirem)
-- Nota: UUIDs não precisam de reset pois são gerados aleatoriamente

-- Verificar se as tabelas estão vazias
SELECT 
  'alvaras' as tabela, COUNT(*) as registros FROM alvaras
UNION ALL
SELECT 
  'clientes' as tabela, COUNT(*) as registros FROM clientes
UNION ALL
SELECT 
  'responsaveis' as tabela, COUNT(*) as registros FROM responsaveis
UNION ALL
SELECT 
  'responsavel_cliente' as tabela, COUNT(*) as registros FROM responsavel_cliente
UNION ALL
SELECT 
  'usuarios' as tabela, COUNT(*) as registros FROM usuarios
UNION ALL
SELECT 
  'empresas' as tabela, COUNT(*) as registros FROM empresas
UNION ALL
SELECT 
  'documentos' as tabela, COUNT(*) as registros FROM documentos
UNION ALL
SELECT 
  'obrigacoes' as tabela, COUNT(*) as registros FROM obrigacoes;