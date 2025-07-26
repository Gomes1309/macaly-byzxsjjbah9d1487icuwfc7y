-- ========================================
-- SCRIPT SQL FORÇADO - RESOLVE DEPENDÊNCIAS
-- ========================================
-- Este script força a limpeza completa mesmo com dependências

-- ========================================
-- DESABILITAR VERIFICAÇÕES TEMPORARIAMENTE
-- ========================================
SET session_replication_role = replica;

-- ========================================
-- REMOVER TODAS AS POLÍTICAS RLS
-- ========================================
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON alvaras;
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON clientes;
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON responsaveis;
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON responsavel_cliente;
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON usuarios;
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON empresas;
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON documentos;
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON obrigacoes;
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON client_users;

-- ========================================
-- DESABILITAR RLS EM TODAS AS TABELAS
-- ========================================
ALTER TABLE IF EXISTS alvaras DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS clientes DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS responsaveis DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS responsavel_cliente DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS usuarios DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS empresas DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS documentos DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS obrigacoes DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS client_users DISABLE ROW LEVEL SECURITY;

-- ========================================
-- REMOVER TODOS OS TRIGGERS
-- ========================================
DROP TRIGGER IF EXISTS update_alvaras_updated_at ON alvaras;
DROP TRIGGER IF EXISTS update_clientes_updated_at ON clientes;
DROP TRIGGER IF EXISTS update_responsaveis_updated_at ON responsaveis;
DROP TRIGGER IF EXISTS update_responsavel_cliente_updated_at ON responsavel_cliente;
DROP TRIGGER IF EXISTS update_usuarios_updated_at ON usuarios;
DROP TRIGGER IF EXISTS update_empresas_updated_at ON empresas;
DROP TRIGGER IF EXISTS update_documentos_updated_at ON documentos;
DROP TRIGGER IF EXISTS update_obrigacoes_updated_at ON obrigacoes;
DROP TRIGGER IF EXISTS update_client_users_updated_at ON client_users;

-- ========================================
-- REMOVER TODAS AS TABELAS COM CASCADE
-- ========================================
DROP TABLE IF EXISTS obrigacoes CASCADE;
DROP TABLE IF EXISTS documentos CASCADE;
DROP TABLE IF EXISTS empresas CASCADE;
DROP TABLE IF EXISTS responsavel_cliente CASCADE;
DROP TABLE IF EXISTS responsaveis CASCADE;
DROP TABLE IF EXISTS clientes CASCADE;
DROP TABLE IF EXISTS usuarios CASCADE;
DROP TABLE IF EXISTS alvaras CASCADE;
DROP TABLE IF EXISTS client_users CASCADE;

-- ========================================
-- REMOVER ÍNDICES ÓRFÃOS (SE EXISTIREM)
-- ========================================
DROP INDEX IF EXISTS idx_alvaras_empresa;
DROP INDEX IF EXISTS idx_alvaras_cnpj;
DROP INDEX IF EXISTS idx_alvaras_tipo;
DROP INDEX IF EXISTS idx_alvaras_data_vencimento;
DROP INDEX IF EXISTS idx_alvaras_numero_protocolo;
DROP INDEX IF EXISTS idx_clientes_email;
DROP INDEX IF EXISTS idx_clientes_cpf_cnpj;
DROP INDEX IF EXISTS idx_clientes_tipo;
DROP INDEX IF EXISTS idx_clientes_status;
DROP INDEX IF EXISTS idx_responsaveis_email;
DROP INDEX IF EXISTS idx_responsaveis_cpf;
DROP INDEX IF EXISTS idx_responsaveis_status;
DROP INDEX IF EXISTS idx_responsavel_cliente_responsavel_id;
DROP INDEX IF EXISTS idx_responsavel_cliente_cliente_id;
DROP INDEX IF EXISTS idx_responsavel_cliente_status;
DROP INDEX IF EXISTS idx_usuarios_email;
DROP INDEX IF EXISTS idx_usuarios_cargo;
DROP INDEX IF EXISTS idx_usuarios_departamento;
DROP INDEX IF EXISTS idx_usuarios_status;
DROP INDEX IF EXISTS idx_empresas_cliente_id;
DROP INDEX IF EXISTS idx_empresas_cnpj;
DROP INDEX IF EXISTS idx_empresas_status;
DROP INDEX IF EXISTS idx_empresas_tipo;
DROP INDEX IF EXISTS idx_documentos_cliente_id;
DROP INDEX IF EXISTS idx_documentos_empresa_id;
DROP INDEX IF EXISTS idx_documentos_tipo;
DROP INDEX IF EXISTS idx_documentos_categoria;
DROP INDEX IF EXISTS idx_documentos_data_upload;
DROP INDEX IF EXISTS idx_obrigacoes_empresa_id;
DROP INDEX IF EXISTS idx_obrigacoes_data_vencimento;
DROP INDEX IF EXISTS idx_obrigacoes_status;
DROP INDEX IF EXISTS idx_obrigacoes_tipo;

-- ========================================
-- REABILITAR VERIFICAÇÕES
-- ========================================
SET session_replication_role = DEFAULT;

-- ========================================
-- FUNÇÃO PARA UPDATED_AT
-- ========================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- ========================================
-- RECRIAR TODAS AS TABELAS DO ZERO
-- ========================================

-- TABELA DE ALVARÁS
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
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- TABELA DE CLIENTES
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

-- TABELA DE RESPONSAVEIS
CREATE TABLE responsaveis (
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

-- TABELA DE RELACIONAMENTO RESPONSAVEL-CLIENTE
CREATE TABLE responsavel_cliente (
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

-- TABELA DE USUARIOS
CREATE TABLE usuarios (
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

-- TABELA DE EMPRESAS (ABERTURA)
CREATE TABLE empresas (
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

-- TABELA DE DOCUMENTOS
CREATE TABLE documentos (
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

-- TABELA DE OBRIGACOES
CREATE TABLE obrigacoes (
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
-- CRIAR TODOS OS ÍNDICES
-- ========================================

-- Índices para alvarás
CREATE INDEX idx_alvaras_empresa ON alvaras(empresa);
CREATE INDEX idx_alvaras_cnpj ON alvaras(cnpj);
CREATE INDEX idx_alvaras_tipo ON alvaras(tipo);
CREATE INDEX idx_alvaras_data_vencimento ON alvaras(data_vencimento);
CREATE INDEX idx_alvaras_numero_protocolo ON alvaras(numero_protocolo);

-- Índices para clientes
CREATE INDEX idx_clientes_email ON clientes(email);
CREATE INDEX idx_clientes_cpf_cnpj ON clientes(cpf_cnpj);
CREATE INDEX idx_clientes_tipo ON clientes(tipo_cliente);
CREATE INDEX idx_clientes_status ON clientes(status);

-- Índices para responsáveis
CREATE INDEX idx_responsaveis_email ON responsaveis(email);
CREATE INDEX idx_responsaveis_cpf ON responsaveis(cpf);
CREATE INDEX idx_responsaveis_status ON responsaveis(status);

-- Índices para responsavel_cliente
CREATE INDEX idx_responsavel_cliente_responsavel_id ON responsavel_cliente(responsavel_id);
CREATE INDEX idx_responsavel_cliente_cliente_id ON responsavel_cliente(cliente_id);
CREATE INDEX idx_responsavel_cliente_status ON responsavel_cliente(status);

-- Índices para usuários
CREATE INDEX idx_usuarios_email ON usuarios(email);
CREATE INDEX idx_usuarios_cargo ON usuarios(cargo);
CREATE INDEX idx_usuarios_departamento ON usuarios(departamento);
CREATE INDEX idx_usuarios_status ON usuarios(status);

-- Índices para empresas
CREATE INDEX idx_empresas_cliente_id ON empresas(cliente_id);
CREATE INDEX idx_empresas_cnpj ON empresas(cnpj);
CREATE INDEX idx_empresas_status ON empresas(status);
CREATE INDEX idx_empresas_tipo ON empresas(tipo_empresa);

-- Índices para documentos
CREATE INDEX idx_documentos_cliente_id ON documentos(cliente_id);
CREATE INDEX idx_documentos_empresa_id ON documentos(empresa_id);
CREATE INDEX idx_documentos_tipo ON documentos(tipo_documento);
CREATE INDEX idx_documentos_categoria ON documentos(categoria);
CREATE INDEX idx_documentos_data_upload ON documentos(data_upload);

-- Índices para obrigações
CREATE INDEX idx_obrigacoes_empresa_id ON obrigacoes(empresa_id);
CREATE INDEX idx_obrigacoes_data_vencimento ON obrigacoes(data_vencimento);
CREATE INDEX idx_obrigacoes_status ON obrigacoes(status);
CREATE INDEX idx_obrigacoes_tipo ON obrigacoes(tipo_obrigacao);

-- ========================================
-- CRIAR TODOS OS TRIGGERS
-- ========================================

CREATE TRIGGER update_alvaras_updated_at
  BEFORE UPDATE ON alvaras
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_clientes_updated_at
  BEFORE UPDATE ON clientes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_responsaveis_updated_at
  BEFORE UPDATE ON responsaveis
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_responsavel_cliente_updated_at
  BEFORE UPDATE ON responsavel_cliente
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_usuarios_updated_at
  BEFORE UPDATE ON usuarios
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_empresas_updated_at
  BEFORE UPDATE ON empresas
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_documentos_updated_at
  BEFORE UPDATE ON documentos
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_obrigacoes_updated_at
  BEFORE UPDATE ON obrigacoes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ========================================
-- HABILITAR RLS E CRIAR POLÍTICAS
-- ========================================

-- Habilitar RLS
ALTER TABLE alvaras ENABLE ROW LEVEL SECURITY;
ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE responsaveis ENABLE ROW LEVEL SECURITY;
ALTER TABLE responsavel_cliente ENABLE ROW LEVEL SECURITY;
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE empresas ENABLE ROW LEVEL SECURITY;
ALTER TABLE documentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE obrigacoes ENABLE ROW LEVEL SECURITY;

-- Criar políticas
CREATE POLICY "Allow all operations for authenticated users" ON alvaras
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations for authenticated users" ON clientes
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations for authenticated users" ON responsaveis
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations for authenticated users" ON responsavel_cliente
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations for authenticated users" ON usuarios
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations for authenticated users" ON empresas
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations for authenticated users" ON documentos
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations for authenticated users" ON obrigacoes
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ========================================
-- VERIFICAR RESULTADO
-- ========================================
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