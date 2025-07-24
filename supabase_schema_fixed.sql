-- Script SQL para Supabase - Versão com Drop Triggers
-- Este script pode ser executado múltiplas vezes sem erros

-- Criação da tabela de alvarás
CREATE TABLE IF NOT EXISTS alvaras (
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

-- Criação de índices para melhorar performance
CREATE INDEX IF NOT EXISTS idx_alvaras_empresa ON alvaras(empresa);
CREATE INDEX IF NOT EXISTS idx_alvaras_cnpj ON alvaras(cnpj);
CREATE INDEX IF NOT EXISTS idx_alvaras_tipo ON alvaras(tipo);
CREATE INDEX IF NOT EXISTS idx_alvaras_data_vencimento ON alvaras(data_vencimento);
CREATE INDEX IF NOT EXISTS idx_alvaras_numero_protocolo ON alvaras(numero_protocolo);

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Remover trigger existente e criar novo
DROP TRIGGER IF EXISTS update_alvaras_updated_at ON alvaras;
CREATE TRIGGER update_alvaras_updated_at
  BEFORE UPDATE ON alvaras
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Políticas de segurança (RLS)
ALTER TABLE alvaras ENABLE ROW LEVEL SECURITY;

-- Remover política existente e criar nova
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON alvaras;
CREATE POLICY "Allow all operations for authenticated users" ON alvaras
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ========================================
-- TABELA DE CLIENTES
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
-- TABELA DE RESPONSAVEIS (PESSOAS FÍSICAS)
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
-- TABELA DE RELACIONAMENTO RESPONSAVEL-CLIENTE
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
-- TABELA DE USUARIOS
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
-- TABELA DE EMPRESAS (ABERTURA)
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
-- TABELA DE DOCUMENTOS
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
-- TABELA DE OBRIGACOES
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
-- INDICES PARA PERFORMANCE
-- ========================================

-- Índices para clientes
CREATE INDEX IF NOT EXISTS idx_clientes_email ON clientes(email);
CREATE INDEX IF NOT EXISTS idx_clientes_cpf_cnpj ON clientes(cpf_cnpj);
CREATE INDEX IF NOT EXISTS idx_clientes_tipo ON clientes(tipo_cliente);
CREATE INDEX IF NOT EXISTS idx_clientes_status ON clientes(status);

-- Índices para responsáveis
CREATE INDEX IF NOT EXISTS idx_responsaveis_email ON responsaveis(email);
CREATE INDEX IF NOT EXISTS idx_responsaveis_cpf ON responsaveis(cpf);
CREATE INDEX IF NOT EXISTS idx_responsaveis_status ON responsaveis(status);

-- Índices para responsavel_cliente
CREATE INDEX IF NOT EXISTS idx_responsavel_cliente_responsavel_id ON responsavel_cliente(responsavel_id);
CREATE INDEX IF NOT EXISTS idx_responsavel_cliente_cliente_id ON responsavel_cliente(cliente_id);
CREATE INDEX IF NOT EXISTS idx_responsavel_cliente_status ON responsavel_cliente(status);

-- Índices para usuários
CREATE INDEX IF NOT EXISTS idx_usuarios_email ON usuarios(email);
CREATE INDEX IF NOT EXISTS idx_usuarios_cargo ON usuarios(cargo);
CREATE INDEX IF NOT EXISTS idx_usuarios_departamento ON usuarios(departamento);
CREATE INDEX IF NOT EXISTS idx_usuarios_status ON usuarios(status);

-- Índices para empresas
CREATE INDEX IF NOT EXISTS idx_empresas_cliente_id ON empresas(cliente_id);
CREATE INDEX IF NOT EXISTS idx_empresas_cnpj ON empresas(cnpj);
CREATE INDEX IF NOT EXISTS idx_empresas_status ON empresas(status);
CREATE INDEX IF NOT EXISTS idx_empresas_tipo ON empresas(tipo_empresa);

-- Índices para documentos
CREATE INDEX IF NOT EXISTS idx_documentos_cliente_id ON documentos(cliente_id);
CREATE INDEX IF NOT EXISTS idx_documentos_empresa_id ON documentos(empresa_id);
CREATE INDEX IF NOT EXISTS idx_documentos_tipo ON documentos(tipo_documento);
CREATE INDEX IF NOT EXISTS idx_documentos_categoria ON documentos(categoria);
CREATE INDEX IF NOT EXISTS idx_documentos_data_upload ON documentos(data_upload);

-- Índices para obrigações
CREATE INDEX IF NOT EXISTS idx_obrigacoes_empresa_id ON obrigacoes(empresa_id);
CREATE INDEX IF NOT EXISTS idx_obrigacoes_data_vencimento ON obrigacoes(data_vencimento);
CREATE INDEX IF NOT EXISTS idx_obrigacoes_status ON obrigacoes(status);
CREATE INDEX IF NOT EXISTS idx_obrigacoes_tipo ON obrigacoes(tipo_obrigacao);

-- ========================================
-- TRIGGERS PARA UPDATED_AT
-- ========================================

-- Remover todos os triggers existentes e criar novos
DROP TRIGGER IF EXISTS update_clientes_updated_at ON clientes;
CREATE TRIGGER update_clientes_updated_at
  BEFORE UPDATE ON clientes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_responsaveis_updated_at ON responsaveis;
CREATE TRIGGER update_responsaveis_updated_at
  BEFORE UPDATE ON responsaveis
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_responsavel_cliente_updated_at ON responsavel_cliente;
CREATE TRIGGER update_responsavel_cliente_updated_at
  BEFORE UPDATE ON responsavel_cliente
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_usuarios_updated_at ON usuarios;
CREATE TRIGGER update_usuarios_updated_at
  BEFORE UPDATE ON usuarios
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_empresas_updated_at ON empresas;
CREATE TRIGGER update_empresas_updated_at
  BEFORE UPDATE ON empresas
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_documentos_updated_at ON documentos;
CREATE TRIGGER update_documentos_updated_at
  BEFORE UPDATE ON documentos
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_obrigacoes_updated_at ON obrigacoes;
CREATE TRIGGER update_obrigacoes_updated_at
  BEFORE UPDATE ON obrigacoes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ========================================
-- POLÍTICAS DE SEGURANÇA (RLS)
-- ========================================

-- Habilitar RLS para todas as tabelas
ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE responsaveis ENABLE ROW LEVEL SECURITY;
ALTER TABLE responsavel_cliente ENABLE ROW LEVEL SECURITY;
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE empresas ENABLE ROW LEVEL SECURITY;
ALTER TABLE documentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE obrigacoes ENABLE ROW LEVEL SECURITY;

-- Remover políticas existentes e criar novas
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON clientes;
CREATE POLICY "Allow all operations for authenticated users" ON clientes
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON responsaveis;
CREATE POLICY "Allow all operations for authenticated users" ON responsaveis
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON responsavel_cliente;
CREATE POLICY "Allow all operations for authenticated users" ON responsavel_cliente
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON usuarios;
CREATE POLICY "Allow all operations for authenticated users" ON usuarios
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON empresas;
CREATE POLICY "Allow all operations for authenticated users" ON empresas
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON documentos;
CREATE POLICY "Allow all operations for authenticated users" ON documentos
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON obrigacoes;
CREATE POLICY "Allow all operations for authenticated users" ON obrigacoes
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ========================================
-- DADOS DE EXEMPLO
-- ========================================

-- Inserir dados de exemplo para alvarás
INSERT INTO alvaras (empresa, cnpj, tipo, numero_protocolo, data_emissao, data_vencimento, observacoes, responsavel, contato)
VALUES 
  ('Restaurante Sabor Mineiro', '12.345.678/0001-90', 'vigilancia_sanitaria', 'VS-2024-001', '2024-01-15', '2025-01-15', 'Renovação sem pendências', 'João Silva', '(11) 99999-9999'),
  ('Farmácia Central', '98.765.432/0001-10', 'vigilancia_sanitaria', 'VS-2024-002', '2024-07-01', '2025-07-01', 'Vencimento próximo - providenciar renovação', 'Maria Santos', '(11) 88888-8888'),
  ('Hotel Estrela', '11.222.333/0001-44', 'bombeiro', 'CB-2024-003', '2023-12-01', '2024-12-01', 'URGENTE: Alvará vencido - regularizar imediatamente', 'Carlos Oliveira', '(11) 77777-7777'),
  ('Loja do Centro', '55.666.777/0001-88', 'municipal', 'MUN-2024-004', '2024-03-10', '2025-03-10', 'Alvará de funcionamento municipal renovado', 'Ana Costa', '(11) 66666-6666')
ON CONFLICT DO NOTHING;

-- Inserir dados de exemplo para clientes
INSERT INTO clientes (nome, email, cpf_cnpj, telefone, endereco, tipo_cliente, status, data_cadastro, observacoes)
VALUES 
  ('João Silva', 'joao@email.com', '123.456.789-00', '(11) 99999-9999', 'Rua A, 123', 'pessoa_fisica', 'ativo', '2024-01-15', 'Cliente desde 2024'),
  ('Maria Santos', 'maria@email.com', '98.765.432/0001-10', '(11) 88888-8888', 'Av. B, 456', 'pessoa_juridica', 'ativo', '2024-02-20', 'Farmácia Central'),
  ('Carlos Oliveira', 'carlos@email.com', '11.222.333/0001-44', '(11) 77777-7777', 'Rua C, 789', 'pessoa_juridica', 'ativo', '2024-03-10', 'Hotel Estrela'),
  ('Ana Costa', 'ana@email.com', '55.666.777/0001-88', '(11) 66666-6666', 'Av. D, 321', 'pessoa_juridica', 'ativo', '2024-04-05', 'Loja do Centro')
ON CONFLICT DO NOTHING;

-- Inserir dados de exemplo para usuários
INSERT INTO usuarios (nome, email, cargo, departamento, permissoes, status, ultimo_acesso)
VALUES 
  ('Admin Sistema', 'admin@agassessoria.com', 'Administrador', 'TI', '{"full_access": true}', 'ativo', NOW()),
  ('Contador Principal', 'contador@agassessoria.com', 'Contador', 'Contabilidade', '{"obrigacoes": true, "documentos": true, "clientes": true}', 'ativo', NOW()),
  ('Assistente', 'assistente@agassessoria.com', 'Assistente', 'Contabilidade', '{"documentos": true, "clientes": false}', 'ativo', NOW()),
  ('Estagiário', 'estagiario@agassessoria.com', 'Estagiário', 'Contabilidade', '{"documentos": false, "clientes": false}', 'ativo', NOW())
ON CONFLICT DO NOTHING;

-- Inserir dados de exemplo para responsáveis (pessoas físicas)
INSERT INTO responsaveis (nome, email, cpf, telefone, senha_hash, status, data_cadastro, observacoes)
VALUES 
  ('Maria Santos', 'maria@email.com', '123.456.789-00', '(11) 88888-8888', '$2b$10$hashedpassword', 'ativo', '2024-02-20', 'Proprietária de várias empresas'),
  ('José Santos', 'jose@farmaciacentral.com', '987.654.321-00', '(11) 77777-7777', '$2b$10$hashedpassword', 'ativo', '2024-02-20', 'Sócio em múltiplas empresas'),
  ('Carlos Oliveira', 'carlos@email.com', '111.222.333-44', '(11) 77777-7777', '$2b$10$hashedpassword', 'ativo', '2024-03-10', 'Diretor de hotel e outras empresas'),
  ('Ana Costa', 'ana@email.com', '555.666.777-88', '(11) 66666-6666', '$2b$10$hashedpassword', 'ativo', '2024-04-05', 'Gerente de várias lojas'),
  ('Pedro Costa', 'pedro@lojadocentro.com', '222.333.444-55', '(11) 55555-5555', '$2b$10$hashedpassword', 'ativo', '2024-04-05', 'Assistente em várias empresas'),
  ('João Silva', 'joao@agassessoria.com', '333.444.555-66', '(11) 44444-4444', '$2b$10$hashedpassword', 'ativo', '2024-01-15', 'Contador responsável por múltiplas empresas'),
  ('Contador Senior', 'contador@agassessoria.com', '444.555.666-77', '(11) 33333-3333', '$2b$10$hashedpassword', 'ativo', '2024-01-10', 'Contador sênior com acesso a todas as empresas')
ON CONFLICT DO NOTHING;

-- Inserir dados de exemplo para responsavel_cliente (relacionamentos)
INSERT INTO responsavel_cliente (responsavel_id, cliente_id, cargo, permissoes, status, data_vinculacao, observacoes)
VALUES 
  -- Maria Santos -> Farmácia Central
  ((SELECT id FROM responsaveis WHERE email = 'maria@email.com'), (SELECT id FROM clientes WHERE email = 'maria@email.com'), 'Proprietária', '{"documentos": true, "download": true, "notificacoes": true}', 'ativo', '2024-02-20', 'Responsável principal da Farmácia Central'),
  
  -- José Santos -> Farmácia Central e Hotel Estrela
  ((SELECT id FROM responsaveis WHERE email = 'jose@farmaciacentral.com'), (SELECT id FROM clientes WHERE email = 'maria@email.com'), 'Sócio-Gerente', '{"documentos": true, "download": true, "notificacoes": true}', 'ativo', '2024-02-20', 'Sócio da Farmácia Central'),
  ((SELECT id FROM responsaveis WHERE email = 'jose@farmaciacentral.com'), (SELECT id FROM clientes WHERE email = 'carlos@email.com'), 'Consultor', '{"documentos": true, "download": false, "notificacoes": true}', 'ativo', '2024-03-15', 'Consultor do Hotel Estrela'),
  
  -- Carlos Oliveira -> Hotel Estrela
  ((SELECT id FROM responsaveis WHERE email = 'carlos@email.com'), (SELECT id FROM clientes WHERE email = 'carlos@email.com'), 'Diretor', '{"documentos": true, "download": true, "notificacoes": true}', 'ativo', '2024-03-10', 'Diretor do Hotel Estrela'),
  
  -- Ana Costa -> Loja do Centro
  ((SELECT id FROM responsaveis WHERE email = 'ana@email.com'), (SELECT id FROM clientes WHERE email = 'ana@email.com'), 'Gerente', '{"documentos": true, "download": true, "notificacoes": true}', 'ativo', '2024-04-05', 'Gerente da Loja do Centro'),
  
  -- Pedro Costa -> Loja do Centro e Farmácia Central
  ((SELECT id FROM responsaveis WHERE email = 'pedro@lojadocentro.com'), (SELECT id FROM clientes WHERE email = 'ana@email.com'), 'Assistente', '{"documentos": true, "download": false, "notificacoes": true}', 'ativo', '2024-04-05', 'Assistente da Loja do Centro'),
  ((SELECT id FROM responsaveis WHERE email = 'pedro@lojadocentro.com'), (SELECT id FROM clientes WHERE email = 'maria@email.com'), 'Estagiário', '{"documentos": true, "download": false, "notificacoes": false}', 'ativo', '2024-04-10', 'Estagiário na Farmácia Central'),
  
  -- João Silva (Contador) -> Todas as empresas
  ((SELECT id FROM responsaveis WHERE email = 'joao@agassessoria.com'), (SELECT id FROM clientes WHERE email = 'maria@email.com'), 'Contador', '{"documentos": true, "download": true, "notificacoes": true}', 'ativo', '2024-02-20', 'Contador responsável'),
  ((SELECT id FROM responsaveis WHERE email = 'joao@agassessoria.com'), (SELECT id FROM clientes WHERE email = 'carlos@email.com'), 'Contador', '{"documentos": true, "download": true, "notificacoes": true}', 'ativo', '2024-03-10', 'Contador responsável'),
  ((SELECT id FROM responsaveis WHERE email = 'joao@agassessoria.com'), (SELECT id FROM clientes WHERE email = 'ana@email.com'), 'Contador', '{"documentos": true, "download": true, "notificacoes": true}', 'ativo', '2024-04-05', 'Contador responsável'),
  
  -- Contador Senior -> Acesso total a todas as empresas
  ((SELECT id FROM responsaveis WHERE email = 'contador@agassessoria.com'), (SELECT id FROM clientes WHERE email = 'maria@email.com'), 'Contador Sênior', '{"documentos": true, "download": true, "notificacoes": true}', 'ativo', '2024-02-20', 'Contador sênior com acesso total'),
  ((SELECT id FROM responsaveis WHERE email = 'contador@agassessoria.com'), (SELECT id FROM clientes WHERE email = 'carlos@email.com'), 'Contador Sênior', '{"documentos": true, "download": true, "notificacoes": true}', 'ativo', '2024-03-10', 'Contador sênior com acesso total'),
  ((SELECT id FROM responsaveis WHERE email = 'contador@agassessoria.com'), (SELECT id FROM clientes WHERE email = 'ana@email.com'), 'Contador Sênior', '{"documentos": true, "download": true, "notificacoes": true}', 'ativo', '2024-04-05', 'Contador sênior com acesso total')
ON CONFLICT DO NOTHING;