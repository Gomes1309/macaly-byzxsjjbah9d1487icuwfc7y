-- 🔧 Script para adicionar coluna data_cadastro que está faltando
-- Execute este script no Supabase SQL Editor

-- 1. Verificar colunas existentes na tabela clientes
SELECT 
  column_name, 
  data_type, 
  is_nullable, 
  column_default
FROM information_schema.columns 
WHERE table_name = 'clientes' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. Adicionar a coluna data_cadastro se não existir
DO $$ 
BEGIN 
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'clientes' 
        AND column_name = 'data_cadastro'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE clientes ADD COLUMN data_cadastro DATE NOT NULL DEFAULT CURRENT_DATE;
        RAISE NOTICE 'Coluna data_cadastro adicionada com sucesso!';
    ELSE
        RAISE NOTICE 'Coluna data_cadastro já existe.';
    END IF;
END $$;

-- 3. Verificar se a coluna foi adicionada
SELECT 
  'Estrutura atualizada:' as info,
  column_name, 
  data_type, 
  is_nullable, 
  column_default
FROM information_schema.columns 
WHERE table_name = 'clientes' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 4. Teste de inserção para validar que funcionou
INSERT INTO clientes (nome, email, cpf_cnpj, tipo_cliente, status) 
VALUES ('Teste Coluna', 'teste.coluna@exemplo.com', '98765432100', 'pessoa_fisica', 'ativo')
ON CONFLICT (email) DO NOTHING;

-- 5. Verificar se o teste funcionou e depois remover
SELECT 'Teste de inserção:' as info, COUNT(*) as total FROM clientes WHERE nome = 'Teste Coluna';

-- Remover o teste
DELETE FROM clientes WHERE nome = 'Teste Coluna' AND email = 'teste.coluna@exemplo.com';

SELECT 'Script executado com sucesso!' as resultado;