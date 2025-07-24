-- 🚨 SCRIPT PARA CORRIGIR CHECK CONSTRAINTS DOS CLIENTES
-- Execute este script no Supabase SQL Editor para resolver os problemas de constraint

-- ✅ Etapa 1: Verificar os constraints existentes
SELECT 
    conname as constraint_name,
    contype as constraint_type,
    pg_get_constraintdef(oid) as definition
FROM pg_constraint
WHERE conrelid = 'public.clientes'::regclass;

-- ✅ Etapa 2: Remover constraint problemático se existir
DO $$
BEGIN
    -- Tentar remover o constraint clientes_tipo_cliente_check se existir
    IF EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'clientes_tipo_cliente_check' 
        AND conrelid = 'public.clientes'::regclass
    ) THEN
        ALTER TABLE public.clientes DROP CONSTRAINT clientes_tipo_cliente_check;
        RAISE NOTICE 'Constraint clientes_tipo_cliente_check removido!';
    END IF;
END $$;

-- ✅ Etapa 3: Criar constraint correto para tipo_cliente
ALTER TABLE public.clientes 
ADD CONSTRAINT clientes_tipo_cliente_check 
CHECK (tipo_cliente IN ('pessoa_fisica', 'pessoa_juridica'));

-- ✅ Etapa 4: Verificar constraint de status também
DO $$
BEGIN
    -- Tentar remover o constraint clientes_status_check se existir
    IF EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'clientes_status_check' 
        AND conrelid = 'public.clientes'::regclass
    ) THEN
        ALTER TABLE public.clientes DROP CONSTRAINT clientes_status_check;
        RAISE NOTICE 'Constraint clientes_status_check removido!';
    END IF;
END $$;

-- ✅ Etapa 5: Criar constraint correto para status
ALTER TABLE public.clientes 
ADD CONSTRAINT clientes_status_check 
CHECK (status IN ('ativo', 'inativo', 'suspenso'));

-- ✅ Etapa 6: Verificar se a coluna data_cadastro existe
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'clientes' 
        AND column_name = 'data_cadastro'
    ) THEN
        ALTER TABLE public.clientes ADD COLUMN data_cadastro DATE DEFAULT CURRENT_DATE;
        RAISE NOTICE 'Coluna data_cadastro adicionada!';
    END IF;
END $$;

-- ✅ Etapa 7: Atualizar o cache do PostgREST
NOTIFY pgrst, 'reload schema';

-- ✅ Etapa 8: Testar inserção com dados válidos
INSERT INTO public.clientes (
    nome, 
    email, 
    cpf_cnpj, 
    telefone, 
    endereco, 
    tipo_cliente, 
    status, 
    data_cadastro, 
    observacoes
) VALUES (
    'TESTE CONSTRAINT - EMPRESA',
    'teste@constraint.com',
    '12.345.678/0001-90',
    '(11) 99999-9999',
    'Rua Teste, 123',
    'pessoa_juridica',
    'ativo',
    CURRENT_DATE,
    'Teste de constraint'
) ON CONFLICT (email) DO NOTHING;

-- ✅ Verificar se a inserção funcionou
SELECT * FROM public.clientes WHERE email = 'teste@constraint.com';

-- ✅ Limpar dados de teste
DELETE FROM public.clientes WHERE email = 'teste@constraint.com';

-- ✅ Mostrar constraints finais
SELECT 
    conname as constraint_name,
    pg_get_constraintdef(oid) as definition
FROM pg_constraint
WHERE conrelid = 'public.clientes'::regclass
AND contype = 'c';

SELECT '🎉 Constraints corrigidos com sucesso!' as resultado;