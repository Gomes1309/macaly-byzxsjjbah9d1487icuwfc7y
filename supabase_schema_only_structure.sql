-- Script SQL APENAS para criar estrutura (sem dados de exemplo)
-- Use este script se você já tem dados e quer apenas criar novas tabelas

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- ========================================
-- TABELA DE CLIENTES (se não existir)
-- ========================================
CREATE TABLE IF NOT EXISTS clientes (
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

-- ========================================
-- TABELA DE RESPONSAVEIS (se não existir)
-- ========================================
CREATE TABLE IF NOT EXISTS responsaveis (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  cpf TEXT UNIQUE NOT NULL,
  telefone TEXT,
  senha_hash TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'ativo' CHECK (status IN ('ativo', 'inativo', 'suspenso')),
  ultimo_acesso TIMESTAMP WITH TIME ZONE,
  data_cadastro DATE NOT NULL DEFAULT CURRENT_DATE,
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- TABELA DE RELACIONAMENTO (se não existir)
-- ========================================
CREATE TABLE IF NOT EXISTS responsavel_cliente (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  responsavel_id UUID REFERENCES responsaveis(id) ON DELETE CASCADE,
  cliente_id UUID REFERENCES clientes(id) ON DELETE CASCADE,
  cargo TEXT NOT NULL,
  permissoes JSONB NOT NULL DEFAULT '{"documentos": true, "download": true, "notificacoes": true}',
  status TEXT NOT NULL DEFAULT 'ativo' CHECK (status IN ('ativo', 'inativo', 'suspenso')),
  data_vinculacao DATE NOT NULL DEFAULT CURRENT_DATE,
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(responsavel_id, cliente_id)
);

-- ========================================
-- TABELA DE USUARIOS (se não existir)
-- ========================================
CREATE TABLE IF NOT EXISTS usuarios (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  cargo TEXT NOT NULL,
  departamento TEXT NOT NULL,
  permissoes JSONB NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'ativo' CHECK (status IN ('ativo', 'inativo', 'suspenso')),
  ultimo_acesso TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- TABELA DE EMPRESAS (se não existir)
-- ========================================
CREATE TABLE IF NOT EXISTS empresas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  cliente_id UUID REFERENCES clientes(id) ON DELETE CASCADE,
  razao_social TEXT NOT NULL,
  nome_fantasia TEXT,
  cnpj TEXT UNIQUE,
  atividade_principal TEXT NOT NULL,
  endereco TEXT NOT NULL,
  telefone TEXT,
  email TEXT,
  capital_social DECIMAL(15,2),
  tipo_empresa TEXT NOT NULL CHECK (tipo_empresa IN ('mei', 'ltda', 'sa', 'eireli')),
  status TEXT NOT NULL DEFAULT 'em_andamento' CHECK (status IN ('em_andamento', 'documentos_pendentes', 'aprovada', 'cancelada')),
  data_abertura DATE,
  responsavel_abertura TEXT NOT NULL,
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- TABELA DE DOCUMENTOS (se não existir)
-- ========================================
CREATE TABLE IF NOT EXISTS documentos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  cliente_id UUID REFERENCES clientes(id) ON DELETE CASCADE,
  empresa_id UUID REFERENCES empresas(id) ON DELETE CASCADE,
  nome_arquivo TEXT NOT NULL,
  tipo_documento TEXT NOT NULL CHECK (tipo_documento IN ('abertura', 'alteracao', 'fiscal', 'contabil', 'imposto_renda', 'pessoal')),
  categoria TEXT NOT NULL,
  url_arquivo TEXT NOT NULL,
  tamanho_arquivo BIGINT,
  data_upload DATE NOT NULL DEFAULT CURRENT_DATE,
  uploaded_by TEXT NOT NULL,
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- TABELA DE OBRIGACOES (se não existir)
-- ========================================
CREATE TABLE IF NOT EXISTS obrigacoes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  empresa_id UUID REFERENCES empresas(id) ON DELETE CASCADE,
  nome_obrigacao TEXT NOT NULL,
  descricao TEXT,
  tipo_obrigacao TEXT NOT NULL CHECK (tipo_obrigacao IN ('mensal', 'bimestral', 'trimestral', 'semestral', 'anual', 'eventual')),
  data_vencimento DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'cumprida', 'atrasada')),
  responsavel TEXT NOT NULL,
  data_cumprimento DATE,
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- TRIGGERS E POLÍTICAS APENAS SE NECESSÁRIO
-- ========================================

-- Habilitar RLS
ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE responsaveis ENABLE ROW LEVEL SECURITY;
ALTER TABLE responsavel_cliente ENABLE ROW LEVEL SECURITY;
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE empresas ENABLE ROW LEVEL SECURITY;
ALTER TABLE documentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE obrigacoes ENABLE ROW LEVEL SECURITY;

-- Criar triggers apenas se não existirem
DO $$
BEGIN
  -- Trigger para clientes
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_clientes_updated_at') THEN
    CREATE TRIGGER update_clientes_updated_at
      BEFORE UPDATE ON clientes
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
  
  -- Trigger para responsaveis
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_responsaveis_updated_at') THEN
    CREATE TRIGGER update_responsaveis_updated_at
      BEFORE UPDATE ON responsaveis
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
  
  -- Trigger para responsavel_cliente
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_responsavel_cliente_updated_at') THEN
    CREATE TRIGGER update_responsavel_cliente_updated_at
      BEFORE UPDATE ON responsavel_cliente
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
  
  -- Trigger para usuarios
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_usuarios_updated_at') THEN
    CREATE TRIGGER update_usuarios_updated_at
      BEFORE UPDATE ON usuarios
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
  
  -- Trigger para empresas
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_empresas_updated_at') THEN
    CREATE TRIGGER update_empresas_updated_at
      BEFORE UPDATE ON empresas
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
  
  -- Trigger para documentos
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_documentos_updated_at') THEN
    CREATE TRIGGER update_documentos_updated_at
      BEFORE UPDATE ON documentos
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
  
  -- Trigger para obrigacoes
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_obrigacoes_updated_at') THEN
    CREATE TRIGGER update_obrigacoes_updated_at
      BEFORE UPDATE ON obrigacoes
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

-- Criar políticas apenas se não existirem
DO $$
BEGIN
  -- Política para clientes
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'clientes' AND policyname = 'Allow all operations for authenticated users') THEN
    CREATE POLICY "Allow all operations for authenticated users" ON clientes
      FOR ALL
      TO authenticated
      USING (true)
      WITH CHECK (true);
  END IF;
  
  -- Política para responsaveis
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'responsaveis' AND policyname = 'Allow all operations for authenticated users') THEN
    CREATE POLICY "Allow all operations for authenticated users" ON responsaveis
      FOR ALL
      TO authenticated
      USING (true)
      WITH CHECK (true);
  END IF;
  
  -- Política para responsavel_cliente
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'responsavel_cliente' AND policyname = 'Allow all operations for authenticated users') THEN
    CREATE POLICY "Allow all operations for authenticated users" ON responsavel_cliente
      FOR ALL
      TO authenticated
      USING (true)
      WITH CHECK (true);
  END IF;
  
  -- Política para usuarios
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'usuarios' AND policyname = 'Allow all operations for authenticated users') THEN
    CREATE POLICY "Allow all operations for authenticated users" ON usuarios
      FOR ALL
      TO authenticated
      USING (true)
      WITH CHECK (true);
  END IF;
  
  -- Política para empresas
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'empresas' AND policyname = 'Allow all operations for authenticated users') THEN
    CREATE POLICY "Allow all operations for authenticated users" ON empresas
      FOR ALL
      TO authenticated
      USING (true)
      WITH CHECK (true);
  END IF;
  
  -- Política para documentos
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'documentos' AND policyname = 'Allow all operations for authenticated users') THEN
    CREATE POLICY "Allow all operations for authenticated users" ON documentos
      FOR ALL
      TO authenticated
      USING (true)
      WITH CHECK (true);
  END IF;
  
  -- Política para obrigacoes
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'obrigacoes' AND policyname = 'Allow all operations for authenticated users') THEN
    CREATE POLICY "Allow all operations for authenticated users" ON obrigacoes
      FOR ALL
      TO authenticated
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;