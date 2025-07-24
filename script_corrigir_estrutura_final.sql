-- 🔧 Script para corrigir estrutura do banco
-- Execute este script no Supabase SQL Editor

-- Remover tabela se existir para recriar com estrutura correta
DROP TABLE IF EXISTS alvaras CASCADE;
DROP TABLE IF EXISTS clientes CASCADE;

-- Criar tabela de clientes com estrutura correta
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

-- Criar tabela de alvarás com estrutura correta
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

-- Função para updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para updated_at
CREATE TRIGGER update_clientes_updated_at
  BEFORE UPDATE ON clientes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_alvaras_updated_at
  BEFORE UPDATE ON alvaras
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Habilitar RLS
ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE alvaras ENABLE ROW LEVEL SECURITY;

-- Políticas de acesso
CREATE POLICY "Allow all operations for authenticated users" ON clientes
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow all operations for authenticated users" ON alvaras
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Verificar que funcionou
SELECT 'Tabelas criadas com sucesso!' as message;