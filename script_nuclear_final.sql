-- ============================================
-- SCRIPT NUCLEAR 🚨 - ZERAR TUDO DEFINITIVAMENTE
-- ============================================

-- 1. DESATIVAR TODOS OS CONSTRAINTS E FOREIGN KEYS
SET session_replication_role = 'replica';

-- 2. DELETAR TUDO - SEM PIEDADE!
DO $$
DECLARE
    table_name TEXT;
    sequence_name TEXT;
BEGIN
    -- Buscar e deletar dados de TODAS as tabelas do esquema public
    FOR table_name IN 
        SELECT t.table_name FROM information_schema.tables t WHERE t.table_schema = 'public'
    LOOP
        EXECUTE 'TRUNCATE TABLE public.' || quote_ident(table_name) || ' CASCADE';
        RAISE NOTICE 'Tabela % zerada!', table_name;
    END LOOP;
    
    -- Resetar TODAS as sequences para começar do 1
    FOR sequence_name IN 
        SELECT s.sequence_name FROM information_schema.sequences s WHERE s.sequence_schema = 'public'
    LOOP
        EXECUTE 'ALTER SEQUENCE public.' || quote_ident(sequence_name) || ' RESTART WITH 1';
        RAISE NOTICE 'Sequence % resetada!', sequence_name;
    END LOOP;
END $$;

-- 3. DELETAR DADOS DE AUTENTICAÇÃO TAMBÉM
DELETE FROM auth.users WHERE TRUE;
DELETE FROM auth.identities WHERE TRUE;
DELETE FROM auth.sessions WHERE TRUE;

-- 4. DELETAR DADOS DE STORAGE SE EXISTIR
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'storage' AND table_name = 'objects') THEN
        DELETE FROM storage.objects WHERE TRUE;
        RAISE NOTICE 'Storage objects deletados!';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'storage' AND table_name = 'buckets') THEN
        DELETE FROM storage.buckets WHERE TRUE;
        RAISE NOTICE 'Storage buckets deletados!';
    END IF;
END $$;

-- 5. REATIVAR CONSTRAINTS
SET session_replication_role = 'origin';

-- 7. VERIFICAÇÃO FINAL - TODAS AS TABELAS DEVEM ESTAR VAZIAS
SELECT 
    schemaname,
    relname as tablename,
    n_tup_ins as inserts,
    n_tup_upd as updates,
    n_tup_del as deletes,
    n_live_tup as live_rows,
    n_dead_tup as dead_rows
FROM pg_stat_user_tables 
WHERE schemaname = 'public'
ORDER BY relname;

-- 8. CONTAGEM DETALHADA DE REGISTROS
DO $$
DECLARE
    table_name TEXT;
    row_count INTEGER;
    total_records INTEGER := 0;
BEGIN
    RAISE NOTICE '=== CONTAGEM FINAL DE REGISTROS ===';
    
    FOR table_name IN 
        SELECT t.table_name FROM information_schema.tables t WHERE t.table_schema = 'public'
    LOOP
        EXECUTE 'SELECT COUNT(*) FROM public.' || quote_ident(table_name) INTO row_count;
        RAISE NOTICE 'Tabela %: % registros', table_name, row_count;
        total_records := total_records + row_count;
    END LOOP;
    
    RAISE NOTICE '=== TOTAL GERAL: % registros ===', total_records;
    
    IF total_records = 0 THEN
        RAISE NOTICE '🎉 SUCESSO! BANCO COMPLETAMENTE ZERADO! 🎉';
    ELSE
        RAISE NOTICE '❌ ATENÇÃO! Ainda existem % registros!', total_records;
    END IF;
END $$;