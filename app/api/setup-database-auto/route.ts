import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST() {
  console.log('🚀 Tentando configurar banco automaticamente...');
  
  try {
    // Script SQL completo
    const sqlScript = `
-- ========================================
-- SCRIPT SQL FINAL - EXECUÇÃO AUTOMÁTICA
-- ========================================

-- LIMPEZA SEGURA
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') LOOP
        BEGIN
            EXECUTE 'ALTER TABLE IF EXISTS ' || quote_ident(r.tablename) || ' DISABLE ROW LEVEL SECURITY';
        EXCEPTION WHEN OTHERS THEN
            NULL;
        END;
    END LOOP;
END $$;

-- REMOVER TABELAS EXISTENTES
DROP TABLE IF EXISTS obrigacoes CASCADE;
DROP TABLE IF EXISTS documentos CASCADE;
DROP TABLE IF EXISTS responsavel_cliente CASCADE;
DROP TABLE IF EXISTS alvaras CASCADE;
DROP TABLE IF EXISTS empresas CASCADE;
DROP TABLE IF EXISTS usuarios CASCADE;
DROP TABLE IF EXISTS responsaveis CASCADE;
DROP TABLE IF EXISTS clientes CASCADE;

-- REMOVER FUNÇÃO SE EXISTIR
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;

-- CRIAR FUNÇÃO
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE 'plpgsql';

-- CRIAR TABELAS
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

-- TRIGGERS
CREATE TRIGGER update_clientes_updated_at BEFORE UPDATE ON clientes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_responsaveis_updated_at BEFORE UPDATE ON responsaveis FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_usuarios_updated_at BEFORE UPDATE ON usuarios FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_empresas_updated_at BEFORE UPDATE ON empresas FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_alvaras_updated_at BEFORE UPDATE ON alvaras FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_responsavel_cliente_updated_at BEFORE UPDATE ON responsavel_cliente FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_documentos_updated_at BEFORE UPDATE ON documentos FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_obrigacoes_updated_at BEFORE UPDATE ON obrigacoes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS E POLÍTICAS
ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE responsaveis ENABLE ROW LEVEL SECURITY;
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE empresas ENABLE ROW LEVEL SECURITY;
ALTER TABLE alvaras ENABLE ROW LEVEL SECURITY;
ALTER TABLE responsavel_cliente ENABLE ROW LEVEL SECURITY;
ALTER TABLE documentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE obrigacoes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all operations for authenticated users" ON clientes FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations for authenticated users" ON responsaveis FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations for authenticated users" ON usuarios FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations for authenticated users" ON empresas FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations for authenticated users" ON alvaras FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations for authenticated users" ON responsavel_cliente FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations for authenticated users" ON documentos FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations for authenticated users" ON obrigacoes FOR ALL TO authenticated USING (true) WITH CHECK (true);
`;

    // NOTA: O Supabase não suporta execução direta de SQL via API
    // Este endpoint serve para documentar o processo
    console.log('⚠️  Execução automática não suportada pelo Supabase');
    console.log('📋 Script preparado para execução manual');

    return NextResponse.json({
      success: false,
      message: "❌ Execução automática não disponível no Supabase",
      explanation: "O Supabase não permite execução de SQL complexo via API. Você deve executar manualmente no SQL Editor.",
      sqlScript: sqlScript,
      instructions: [
        "1. Acesse https://supabase.com/dashboard",
        "2. Vá em 'SQL Editor'",
        "3. Cole o script fornecido",
        "4. Clique em 'RUN'",
        "5. Aguarde: '✅ Todas as 8 tabelas criadas com sucesso!'"
      ]
    }, { status: 400 });

  } catch (error: any) {
    console.error('🚨 Erro na configuração automática:', error);
    return NextResponse.json({
      success: false,
      error: error.message,
      message: "❌ Erro na tentativa de configuração automática"
    }, { status: 500 });
  }
}