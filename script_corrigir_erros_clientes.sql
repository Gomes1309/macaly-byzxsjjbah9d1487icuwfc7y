-- 🔧 Script para corrigir erros específicos de clientes
-- Execute este script no Supabase SQL Editor

-- 1. Verificar estrutura atual
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'clientes' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. Verificar se há dados existentes
SELECT 'Dados existentes antes da correção' as info, COUNT(*) as total_clientes FROM clientes;

-- 3. Remover tabela existente e recriar com estrutura correta
DROP TABLE IF EXISTS alvaras CASCADE;
DROP TABLE IF EXISTS clientes CASCADE;

-- 4. Criar tabela clientes com estrutura CORRETA
CREATE TABLE clientes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  cpf_cnpj TEXT UNIQUE NOT NULL,
  telefone TEXT,
  endereco TEXT,
  tipo_cliente TEXT NOT NULL CHECK (tipo_cliente IN ('pessoa_fisica', 'pessoa_juridica')),
  status TEXT NOT NULL DEFAULT 'ativo' CHECK (status IN ('ativo', 'inativo', 'suspenso')),
  data_cadastro DATE NOT NULL DEFAULT CURRENT_DATE,
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Criar tabela alvaras
CREATE TABLE alvaras (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  empresa TEXT NOT NULL,
  cnpj TEXT NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('vigilancia_sanitaria', 'bombeiro', 'municipal')),
  numero_protocolo TEXT NOT NULL,
  data_emissao DATE NOT NULL,
  data_vencimento DATE NOT NULL,
  observacoes TEXT,
  responsavel TEXT NOT NULL,
  contato TEXT NOT NULL,
  cliente_id UUID REFERENCES clientes(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Configurar RLS (Row Level Security)
ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE alvaras ENABLE ROW LEVEL SECURITY;

-- 7. Políticas de acesso (permitir tudo para usuários autenticados)
CREATE POLICY "Allow all for authenticated users" ON clientes
  FOR ALL 
  TO authenticated 
  USING (true) 
  WITH CHECK (true);

CREATE POLICY "Allow all for authenticated users" ON alvaras
  FOR ALL 
  TO authenticated 
  USING (true) 
  WITH CHECK (true);

-- 8. Teste de inserção para validar que tudo está funcionando
INSERT INTO clientes (nome, email, cpf_cnpj, tipo_cliente, status) 
VALUES 
  ('Teste Pessoa Física', 'teste.pf@example.com', '12345678901', 'pessoa_fisica', 'ativo'),
  ('Teste Pessoa Jurídica LTDA', 'teste.pj@example.com', '12345678000195', 'pessoa_juridica', 'ativo');

-- 9. Verificar se a inserção funcionou
SELECT 'Teste concluído com sucesso!' as message, COUNT(*) as total_clientes FROM clientes;

-- 10. Verificar estrutura final
SELECT 
  'Estrutura da tabela clientes:' as info,
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'clientes' 
AND table_schema = 'public'
ORDER BY ordinal_position;