-- ============================================
-- SCRIPT DEFINITIVO - REMOVE TUDO E RECRIA
-- Execute este script no Supabase SQL Editor
-- ============================================

-- 1. REMOVER TODAS AS TABELAS E DEPENDÊNCIAS
DROP TABLE IF EXISTS client_users CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS documentos CASCADE;
DROP TABLE IF EXISTS obrigacoes CASCADE;
DROP TABLE IF EXISTS alvaras CASCADE;
DROP TABLE IF EXISTS responsaveis CASCADE;
DROP TABLE IF EXISTS clientes CASCADE;

-- 2. REMOVER FUNÇÕES E TRIGGERS SE EXISTIREM
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;

-- 3. RECRIAR FUNÇÃO PARA UPDATED_AT
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 4. CRIAR TABELAS DO ZERO

-- Tabela: clientes
CREATE TABLE clientes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    telefone VARCHAR(20),
    cpf_cnpj VARCHAR(20) UNIQUE,
    tipo_cliente VARCHAR(20) CHECK (tipo_cliente IN ('fisica', 'juridica')) DEFAULT 'fisica',
    endereco TEXT,
    status VARCHAR(20) CHECK (status IN ('ativo', 'inativo')) DEFAULT 'ativo',
    observacoes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabela: responsaveis
CREATE TABLE responsaveis (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    cliente_id UUID REFERENCES clientes(id) ON DELETE CASCADE,
    nome VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    telefone VARCHAR(20),
    cargo VARCHAR(100),
    is_principal BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabela: alvaras
CREATE TABLE alvaras (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    cliente_id UUID REFERENCES clientes(id) ON DELETE CASCADE,
    numero_alvara VARCHAR(100),
    tipo_alvara VARCHAR(100) NOT NULL,
    orgao_emissor VARCHAR(255),
    data_emissao DATE,
    data_vencimento DATE,
    status VARCHAR(20) CHECK (status IN ('ativo', 'vencido', 'em_renovacao', 'cancelado')) DEFAULT 'ativo',
    valor DECIMAL(10,2),
    observacoes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabela: obrigacoes
CREATE TABLE obrigacoes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    cliente_id UUID REFERENCES clientes(id) ON DELETE CASCADE,
    titulo VARCHAR(255) NOT NULL,
    descricao TEXT,
    tipo_obrigacao VARCHAR(100),
    periodicidade VARCHAR(50) CHECK (periodicidade IN ('mensal', 'bimestral', 'trimestral', 'semestral', 'anual', 'unica')),
    data_vencimento DATE NOT NULL,
    valor DECIMAL(10,2),
    status VARCHAR(20) CHECK (status IN ('pendente', 'cumprida', 'vencida', 'cancelada')) DEFAULT 'pendente',
    responsavel VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabela: documentos
CREATE TABLE documentos (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    cliente_id UUID REFERENCES clientes(id) ON DELETE CASCADE,
    nome_documento VARCHAR(255) NOT NULL,
    tipo_documento VARCHAR(100),
    categoria VARCHAR(100),
    arquivo_url TEXT,
    data_upload DATE DEFAULT CURRENT_DATE,
    data_vencimento DATE,
    observacoes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabela: users
CREATE TABLE users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    senha_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) CHECK (role IN ('admin', 'operador', 'visualizador')) DEFAULT 'operador',
    status VARCHAR(20) CHECK (status IN ('ativo', 'inativo')) DEFAULT 'ativo',
    ultimo_acesso TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabela: client_users (relacionamento clientes-usuários)
CREATE TABLE client_users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    cliente_id UUID REFERENCES clientes(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    permissoes TEXT[] DEFAULT ARRAY['read'],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(cliente_id, user_id)
);

-- 5. CRIAR TRIGGERS PARA UPDATED_AT
CREATE TRIGGER update_clientes_updated_at BEFORE UPDATE ON clientes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_responsaveis_updated_at BEFORE UPDATE ON responsaveis FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_alvaras_updated_at BEFORE UPDATE ON alvaras FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_obrigacoes_updated_at BEFORE UPDATE ON obrigacoes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_documentos_updated_at BEFORE UPDATE ON documentos FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 6. CRIAR ÍNDICES PARA PERFORMANCE
CREATE INDEX idx_clientes_cpf_cnpj ON clientes(cpf_cnpj);
CREATE INDEX idx_clientes_email ON clientes(email);
CREATE INDEX idx_clientes_status ON clientes(status);
CREATE INDEX idx_responsaveis_cliente_id ON responsaveis(cliente_id);
CREATE INDEX idx_alvaras_cliente_id ON alvaras(cliente_id);
CREATE INDEX idx_alvaras_status ON alvaras(status);
CREATE INDEX idx_obrigacoes_cliente_id ON obrigacoes(cliente_id);
CREATE INDEX idx_obrigacoes_data_vencimento ON obrigacoes(data_vencimento);
CREATE INDEX idx_obrigacoes_status ON obrigacoes(status);
CREATE INDEX idx_documentos_cliente_id ON documentos(cliente_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_client_users_cliente_id ON client_users(cliente_id);
CREATE INDEX idx_client_users_user_id ON client_users(user_id);

-- 7. HABILITAR RLS (ROW LEVEL SECURITY)
ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE responsaveis ENABLE ROW LEVEL SECURITY;
ALTER TABLE alvaras ENABLE ROW LEVEL SECURITY;
ALTER TABLE obrigacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE documentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_users ENABLE ROW LEVEL SECURITY;

-- 8. CRIAR POLÍTICAS RLS BÁSICAS (ACESSO TOTAL PARA AUTHENTICATED)
CREATE POLICY "Enable all for authenticated users" ON clientes FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Enable all for authenticated users" ON responsaveis FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Enable all for authenticated users" ON alvaras FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Enable all for authenticated users" ON obrigacoes FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Enable all for authenticated users" ON documentos FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Enable all for authenticated users" ON users FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Enable all for authenticated users" ON client_users FOR ALL USING (auth.role() = 'authenticated');

-- 9. VERIFICAR SE TUDO FOI CRIADO CORRETAMENTE
SELECT 
    schemaname,
    tablename,
    tableowner
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('clientes', 'responsaveis', 'alvaras', 'obrigacoes', 'documentos', 'users', 'client_users')
ORDER BY tablename;

-- Mensagem de sucesso
SELECT 'TODAS AS TABELAS FORAM CRIADAS COM SUCESSO!' as resultado;