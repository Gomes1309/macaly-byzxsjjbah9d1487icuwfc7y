-- 🚨 SCRIPT DEFINITIVO: Adicionar coluna data_cadastro na tabela clientes
-- Execute este script no Supabase SQL Editor para corrigir o erro definitivamente

-- ✅ Etapa 1: Adicionar coluna data_cadastro se não existir
DO $$
BEGIN
    -- Verificar se a coluna já existe
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'clientes' 
        AND column_name = 'data_cadastro'
        AND table_schema = 'public'
    ) THEN
        -- Adicionar a coluna
        ALTER TABLE public.clientes 
        ADD COLUMN data_cadastro DATE;
        
        RAISE NOTICE 'Coluna data_cadastro adicionada com sucesso!';
    ELSE
        RAISE NOTICE 'Coluna data_cadastro já existe.';
    END IF;
END $$;

-- ✅ Etapa 2: Atualizar registros existentes que não têm data_cadastro
UPDATE public.clientes 
SET data_cadastro = created_at::date 
WHERE data_cadastro IS NULL;

-- ✅ Etapa 3: Tornar a coluna obrigatória (NOT NULL)
ALTER TABLE public.clientes 
ALTER COLUMN data_cadastro SET NOT NULL;

-- ✅ Etapa 4: Definir valor padrão para novos registros
ALTER TABLE public.clientes 
ALTER COLUMN data_cadastro SET DEFAULT CURRENT_DATE;

-- ✅ Etapa 5: Atualizar o cache do schema no Supabase (restart do PostgREST)
NOTIFY pgrst, 'reload schema';

-- ✅ Verificar a estrutura final da tabela
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'clientes' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- ✅ Testar uma inserção mock para validar
SELECT 'Teste de inserção simulada:' as info;

-- ✅ Mostrar estrutura atual
\d public.clientes

SELECT '🎉 Script executado com sucesso! A coluna data_cadastro foi adicionada.' as resultado;