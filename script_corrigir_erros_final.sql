-- 🔧 Script para corrigir erros específicos
-- Execute este script no Supabase SQL Editor

-- 1. Verificar se as tabelas existem
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name IN ('clientes', 'alvaras');

-- 2. Remover tabelas existentes (se necessário)
DROP TABLE IF EXISTS alvaras CASCADE;
DROP TABLE IF EXISTS clientes CASCADE;

-- 3. Criar tabela clientes com estrutura CORRETA
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

-- 4. Criar tabela alvaras
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

-- 5. Habilitar RLS
ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE alvaras ENABLE ROW LEVEL SECURITY;

-- 6. Políticas simples (permitir tudo para usuários autenticados)
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

-- 7. Testar inserção básica
INSERT INTO clientes (nome, email, cpf_cnpj, tipo_cliente, status) 
VALUES ('Teste Cliente', 'teste@example.com', '12345678901', 'pessoa_fisica', 'ativo');

-- 8. Verificar se funcionou
SELECT 'Setup completo! ✅' as message, COUNT(*) as total_clientes FROM clientes;