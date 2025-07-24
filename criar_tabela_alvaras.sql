-- ========================================
-- SCRIPT SIMPLES PARA CRIAR TABELA ALVARÁS
-- ========================================
-- Execute este script no Supabase SQL Editor
-- Este é um script focado apenas na tabela de alvarás

-- Deletar tabela existente se existir
DROP TABLE IF EXISTS alvaras;

-- Criar tabela alvaras com integração ao sistema de clientes
CREATE TABLE alvaras (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    cliente_id UUID REFERENCES clientes(id) ON DELETE SET NULL, -- Referência opcional ao cliente
    empresa VARCHAR(255) NOT NULL,
    cnpj VARCHAR(18) NOT NULL,
    tipo VARCHAR(50) NOT NULL CHECK (tipo IN ('vigilancia_sanitaria', 'bombeiro', 'municipal')),
    numero_protocolo VARCHAR(100) NOT NULL,
    data_emissao DATE NOT NULL,
    data_vencimento DATE NOT NULL,
    observacoes TEXT,
    responsavel VARCHAR(255) NOT NULL,
    contato VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Criar índices para melhor performance
CREATE INDEX idx_alvaras_cliente_id ON alvaras(cliente_id);
CREATE INDEX idx_alvaras_data_vencimento ON alvaras(data_vencimento);
CREATE INDEX idx_alvaras_tipo ON alvaras(tipo);
CREATE INDEX idx_alvaras_empresa ON alvaras(empresa);

-- Criar trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_alvaras_updated_at 
    BEFORE UPDATE ON alvaras 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Verificar se foi criada corretamente
SELECT 'Tabela alvaras criada com sucesso!' as status;