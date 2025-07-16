-- ============================================
-- SCRIPT DE CONFIGURAÇÃO DO BANCO SUPABASE
-- ============================================
-- Execute este script no SQL Editor do Supabase
-- URL: https://supabase.com/dashboard/project/sctlaitmqghnoxiqmbiw/sql

-- Criação da tabela de alvarás
CREATE TABLE IF NOT EXISTS alvaras (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  empresa TEXT NOT NULL,
  cnpj TEXT NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('vigilancia_sanitaria', 'bombeiro', 'municipal')),
  numero_protocolo TEXT NOT NULL,
  data_emissao DATE NOT NULL,
  data_vencimento DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'em_dia' CHECK (status IN ('em_dia', 'vencendo', 'vencido')),
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
CREATE INDEX IF NOT EXISTS idx_alvaras_status ON alvaras(status);
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

-- Trigger para atualizar updated_at
CREATE TRIGGER update_alvaras_updated_at
  BEFORE UPDATE ON alvaras
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Políticas de segurança (RLS)
ALTER TABLE alvaras ENABLE ROW LEVEL SECURITY;

-- Política para permitir todas as operações (para desenvolvimento)
CREATE POLICY "Enable all operations for all users" ON alvaras
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Inserir dados de exemplo (opcional)
INSERT INTO alvaras (empresa, cnpj, tipo, numero_protocolo, data_emissao, data_vencimento, status, observacoes, responsavel, contato)
VALUES 
  ('Restaurante Sabor Mineiro', '12.345.678/0001-90', 'vigilancia_sanitaria', 'VS-2024-001', '2024-01-15', '2025-01-15', 'em_dia', 'Renovação sem pendências', 'João Silva', '(11) 99999-9999'),
  ('Farmácia Central', '98.765.432/0001-10', 'vigilancia_sanitaria', 'VS-2024-002', '2024-07-01', '2025-07-01', 'vencendo', 'Vencimento próximo - providenciar renovação', 'Maria Santos', '(11) 88888-8888'),
  ('Hotel Estrela', '11.222.333/0001-44', 'bombeiro', 'CB-2024-003', '2023-12-01', '2024-12-01', 'vencido', 'URGENTE: Alvará vencido - regularizar imediatamente', 'Carlos Oliveira', '(11) 77777-7777'),
  ('Loja do Centro', '55.666.777/0001-88', 'municipal', 'MUN-2024-004', '2024-03-10', '2025-03-10', 'em_dia', 'Alvará de funcionamento municipal renovado', 'Ana Costa', '(11) 66666-6666')
ON CONFLICT DO NOTHING;

-- ============================================
-- SCRIPT EXECUTADO COM SUCESSO!
-- ============================================
-- Agora você pode usar o sistema de controle de alvarás
-- com todos os dados sendo salvos no Supabase.