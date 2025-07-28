-- Criar tabela para logs de notificações de alvarás
CREATE TABLE IF NOT EXISTS notification_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  alvara_id UUID NOT NULL,
  email_enviado VARCHAR(255) NOT NULL,
  data_envio TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  tipo_notificacao VARCHAR(50) NOT NULL CHECK (tipo_notificacao IN ('vencendo_15', 'vencendo_7', 'vencendo_3', 'vencido_1', 'vencido_7')),
  status VARCHAR(20) NOT NULL CHECK (status IN ('sucesso', 'erro')),
  response_data JSONB,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_notification_logs_alvara_id ON notification_logs(alvara_id);
CREATE INDEX IF NOT EXISTS idx_notification_logs_data_envio ON notification_logs(data_envio);
CREATE INDEX IF NOT EXISTS idx_notification_logs_tipo ON notification_logs(tipo_notificacao);
CREATE INDEX IF NOT EXISTS idx_notification_logs_status ON notification_logs(status);

-- Comentários para documentação
COMMENT ON TABLE notification_logs IS 'Log de notificações enviadas para alvarás vencidos/vencendo';
COMMENT ON COLUMN notification_logs.alvara_id IS 'ID do alvará relacionado';
COMMENT ON COLUMN notification_logs.email_enviado IS 'Email para onde foi enviada a notificação';
COMMENT ON COLUMN notification_logs.tipo_notificacao IS 'Tipo de notificação: vencendo_15, vencendo_7, vencendo_3, vencido_1, vencido_7';
COMMENT ON COLUMN notification_logs.status IS 'Status do envio: sucesso ou erro';
COMMENT ON COLUMN notification_logs.response_data IS 'Dados de resposta da API de email (JSON)';
COMMENT ON COLUMN notification_logs.error_message IS 'Mensagem de erro em caso de falha';

-- Política RLS (Row Level Security) - permitir acesso completo para usuários autenticados
ALTER TABLE notification_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "notification_logs_access" ON notification_logs
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Função para limpar logs antigos automaticamente (opcional)
CREATE OR REPLACE FUNCTION clean_old_notification_logs()
RETURNS void AS $$
BEGIN
  DELETE FROM notification_logs 
  WHERE data_envio < NOW() - INTERVAL '90 days';
  
  RAISE NOTICE 'Logs de notificação antigos (>90 dias) foram removidos.';
END;
$$ LANGUAGE plpgsql;

-- Comentário na função
COMMENT ON FUNCTION clean_old_notification_logs() IS 'Remove logs de notificação com mais de 90 dias para manter a tabela limpa';